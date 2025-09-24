import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, ChatRequest, ChatResponse } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateChatResponse(req: ChatRequest): Promise<ChatResponse> {
	const systemPrompt = "You are Recta, an AI assistant guiding structured hiring analysis across 6 steps.";

	const messagesForAnthropic = req.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

	const result = await anthropic.messages.create({
		model: "claude-3-5-sonnet-20240620",
		max_tokens: 400,
		system: systemPrompt,
		messages: messagesForAnthropic,
	});

	const text = result.content[0]?.type === "text" ? result.content[0].text : "";

	const assistantMessage: ChatMessage = {
		role: "assistant",
		content: text,
		stepId: req.stepId,
		timestamp: new Date().toISOString(),
	};

	return {
		message: assistantMessage,
		usage: {
			inputTokens: (result.usage as any)?.input_tokens ?? 0,
			outputTokens: (result.usage as any)?.output_tokens ?? 0,
		},
	};
}
