import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/claude-client";
import { ChatRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as ChatRequest;
		if (!body || !body.messages || !body.stepId) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const result = await generateChatResponse(body);
		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("/api/chat error", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
