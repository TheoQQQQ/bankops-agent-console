import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { cookies } from "next/headers";

const CASE_TYPES  = ["FRAUD_ALERT", "KYC_REVIEW", "CREDIT_LIMIT", "AML_FLAG"];
const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const SYSTEM_PROMPT = `You are a senior financial crime compliance officer at a European bank.
Generate realistic, varied customer case records that would be flagged for human review.

Rules:
- Each case must be distinct in customer, scenario, and risk profile
- Use realistic European names, IDs, and financial amounts in EUR
- Descriptions must be 2–4 sentences, specific, and reference concrete indicators
- caseRef format: CASE-XXXX (4 random digits)
- customerId format: CUST-XXXXX (5 random digits)
- caseType must be one of: ${CASE_TYPES.join(", ")}
- riskLevel must be one of: ${RISK_LEVELS.join(", ")}
- amount: numeric string in EUR (e.g. "47500.00"), or null for non-financial cases
- Mix risk levels — include at least one HIGH or CRITICAL case

Respond ONLY with a valid JSON object:
{
  "cases": [
    {
      "caseRef": "CASE-XXXX",
      "customerId": "CUST-XXXXX",
      "customerName": "Full Name",
      "caseType": "AML_ALERT",
      "riskLevel": "HIGH",
      "amount": "47500.00",
      "description": "Detailed description of the flagged activity..."
    }
  ]
}`;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set.");
  return new Groq({ apiKey });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let count = 5;
  try {
    const body = await req.json() as { count?: number };
    if (body.count && body.count >= 1 && body.count <= 10) count = body.count;
  } catch { /* use default */ }

  let generatedCases: object[];
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Generate exactly ${count} realistic banking compliance cases as JSON.` },
      ],
      temperature: 0.8,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Groq returned an empty response");

    const parsed = JSON.parse(raw) as { cases: object[] };
    if (!Array.isArray(parsed.cases)) throw new Error("Groq response missing 'cases' array");
    generatedCases = parsed.cases;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI generation failed: ${message}` }, { status: 502 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("bankops_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const backendRes = await fetch("http://localhost:8080/api/v1/cases/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ cases: generatedCases }),
    });

    if (!backendRes.ok) {
      const text = await backendRes.text();
      throw new Error(`Backend returned ${backendRes.status}: ${text}`);
    }

    const savedCases = await backendRes.json() as object[];
    return NextResponse.json({ cases: savedCases, count: savedCases.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to save cases: ${message}` }, { status: 502 });
  }
}