/**
 * POST /api/analyse
 *
 * Server-side AI agent endpoint.
 * Receives a customer case, sends it to Groq (Llama 3.3-70b),
 * returns a structured analysis, and posts it to the Java backend
 * so it is persisted in the audit log including the full reasoning trail.
 *
 * Security: The GROQ_API_KEY is never sent to the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { postAiAnalysis } from "@/lib/serverApi";
import type { CustomerCase, AiAnalysis } from "@/types";

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
  "riskAssessment": "LOW | MEDIUM | HIGH | CRITICAL",
  "summary": "2-4 sentences in plain English",
  "recommendation": "APPROVE | REJECT | ESCALATE | NEEDS_MORE_INFO",
  "confidencePercent": 0-100,
  "reasoning": "bullet-point reasoning, max 300 words"
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

/** Lazily creates the Groq client so a missing key surfaces a clear error. */
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return new Groq({ apiKey });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse and validate input
  let customerCase: CustomerCase;
  try {
    customerCase = (await req.json()) as CustomerCase;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!customerCase.id || !customerCase.caseRef) {
    return NextResponse.json(
      { error: "Missing required case fields" },
      { status: 422 }
    );
  }

  // 2. Build the Groq client (validates key exists)
  let groq: Groq;
  try {
    groq = getGroqClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI Agent] Configuration error:", message);
    return NextResponse.json(
      { error: `Server configuration error: ${message}` },
      { status: 500 }
    );
  }

  // 3. Call Groq
  let analysis: AiAnalysis;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: buildUserPrompt(customerCase) },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Groq returned an empty response");

    analysis = JSON.parse(raw) as AiAnalysis;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI Agent] Groq call failed:", message);
    return NextResponse.json(
      { error: `AI call failed: ${message}` },
      { status: 502 }
    );
  }

  // 4. Validate AI output shape
  const validRecommendations = ["APPROVE", "REJECT", "ESCALATE", "NEEDS_MORE_INFO"];
  if (!validRecommendations.includes(analysis.recommendation)) {
    console.error("[AI Agent] Unexpected recommendation:", analysis.recommendation);
    return NextResponse.json(
      { error: `AI returned unexpected recommendation: "${analysis.recommendation}"` },
      { status: 502 }
    );
  }

  // 5. Persist to Java backend audit log — includes full reasoning trail
  try {
    await postAiAnalysis(customerCase.id, {
      riskAssessment:    analysis.riskAssessment,
      summary:           analysis.summary,
      recommendation:    analysis.recommendation,
      confidencePercent: Math.min(100, Math.max(0, analysis.confidencePercent)),
      reasoning:         analysis.reasoning,
    });
  } catch (err) {
    console.error("[AI Agent] Failed to persist analysis to backend:", err);
  }

  return NextResponse.json(analysis);
}