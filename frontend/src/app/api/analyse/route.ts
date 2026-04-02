/**
 * POST /api/analyse
 *
 * Server-side AI agent endpoint.
 * Receives a customer case, sends it to Groq (Llama 3.3-70b),
 * returns a structured analysis, and posts it to the Java backend
 * so it is persisted in the audit log.
 *
 * Security: The GROQ_API_KEY is never sent to the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { postAiAnalysis } from "@/lib/serverApi";
import type { CustomerCase, AiAnalysis } from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior financial crime analyst AI assistant at a European bank.
Your role is to review customer cases flagged for human attention and provide a concise, 
structured risk assessment to assist the human operator.

IMPORTANT RULES:
- You must NEVER make a final decision. You provide analysis only.
- Be precise and factual. Do not speculate beyond what the case data shows.
- Cite specific risk indicators from the case description.
- Always end with a clear recommendation: APPROVE, REJECT, ESCALATE, or NEEDS_MORE_INFO.

Respond ONLY with a valid JSON object matching this schema:
{
  "riskAssessment": "string (LOW | MEDIUM | HIGH | CRITICAL)",
  "summary": "string (2-4 sentences, plain English)",
  "recommendation": "APPROVE | REJECT | ESCALATE | NEEDS_MORE_INFO",
  "confidencePercent": number (0-100),
  "reasoning": "string (bullet-point reasoning, max 300 words)"
}`;

function buildUserPrompt(c: CustomerCase): string {
  return `
Case Reference: ${c.caseRef}
Customer ID:    ${c.customerId}
Customer Name:  ${c.customerName}
Case Type:      ${c.caseType}
Current Status: ${c.status}
Risk Level:     ${c.riskLevel}
Amount:         ${c.amount !== null ? `€${c.amount}` : "N/A"}
Created:        ${c.createdAt}

Case Description:
${c.description}

Please analyse this case and return your structured assessment as JSON.
`.trim();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse and validate input
  let customerCase: CustomerCase;
  try {
    customerCase = (await req.json()) as CustomerCase;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!customerCase.id || !customerCase.caseRef) {
    return NextResponse.json(
      { error: "Missing required case fields" },
      { status: 422 }
    );
  }

  // 2. Call Groq
  let analysis: AiAnalysis;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: buildUserPrompt(customerCase) },
      ],
      temperature: 0.2,        // Low temperature for consistent financial analysis
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from Groq");

    analysis = JSON.parse(raw) as AiAnalysis;
  } catch (err) {
    console.error("[AI Agent] Groq error:", err);
    return NextResponse.json(
      { error: "AI analysis failed. Please retry." },
      { status: 502 }
    );
  }

  // 3. Validate AI output shape
  const validRecommendations = ["APPROVE", "REJECT", "ESCALATE", "NEEDS_MORE_INFO"];
  if (!validRecommendations.includes(analysis.recommendation)) {
    return NextResponse.json(
      { error: "AI returned an unexpected recommendation value." },
      { status: 502 }
    );
  }

  // 4. Persist to Java backend audit log
  try {
    await postAiAnalysis(customerCase.id, {
      riskAssessment: analysis.riskAssessment,
      summary: analysis.summary,
      recommendation: analysis.recommendation,
      confidencePercent: Math.min(100, Math.max(0, analysis.confidencePercent)),
    });
  } catch (err) {
    // Non-fatal: the analysis was generated; log the persistence failure
    console.error("[AI Agent] Failed to persist analysis to backend:", err);
  }

  return NextResponse.json(analysis);
}
