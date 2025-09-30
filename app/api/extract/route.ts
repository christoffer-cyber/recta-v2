// server-only
import { NextRequest, NextResponse } from "next/server";
import { chatWithClaude } from "@/lib/claude-client";
import { ChatMessage, ExtractedAnalysis } from "@/lib/types";

// Simple in-memory store for extracted analyses (replace with DB later)
const extractedStore: { latest?: ExtractedAnalysis } = {};

const EXTRACTION_PROMPT = `You are an expert analyst. Extract structured data from the conversation.
Return ONLY a valid JSON object with this schema (no markdown, no commentary):
{
  "company": { "name": string|null, "industry": string|null, "size": string|null, "growthStage": string|null },
  "role": { "title": string|null, "department": string|null, "seniority": string|null, "keyResponsibilities": string[] },
  "context": { "urgency": string|null, "budget": string|null, "timeline": string|null, "teamSize": string|null },
  "challenges": { "painPoints": string[], "strategicGoals": string[], "riskFactors": string[] }
}
Prefer concise phrases. If unknown, use null or empty array. Do not include additional fields.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] } | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Map to ChatMessage for Claude client
    const mapped: ChatMessage[] = body.messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content, timestamp: new Date().toISOString() }));

    const { text } = await chatWithClaude(mapped, EXTRACTION_PROMPT);

    let parsed: ExtractedAnalysis | null = null;
    try {
      parsed = JSON.parse(text) as ExtractedAnalysis;
    } catch (_) {
      // Try to salvage JSON from potential wrapping text
      const match = text.match(/\{[\s\S]*\}$/);
      if (match) parsed = JSON.parse(match[0]) as ExtractedAnalysis;
    }

    if (!parsed) {
      return NextResponse.json({ error: "Failed to parse extraction" }, { status: 500 });
    }

    extractedStore.latest = parsed;
    return NextResponse.json({ ok: true, data: parsed }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  if (!extractedStore.latest) {
    return NextResponse.json({ error: "No extracted data" }, { status: 404 });
  }
  return NextResponse.json({ data: extractedStore.latest }, { status: 200 });
}



