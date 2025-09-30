import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, ChatRequest, ChatResponse } from "./types";

const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
	// Fail early in dev; in production the route will handle this
	// eslint-disable-next-line no-console
	console.warn("ANTHROPIC_API_KEY is not set. Claude client will fail at runtime.");
}

console.log("🔍 Claude Client - API Key present:", !!API_KEY);
console.log("🔍 Claude Client - API Key length:", API_KEY?.length || 0);

const anthropic = new Anthropic({ 
	apiKey: API_KEY,
	dangerouslyAllowBrowser: true // Temporary fix for development
});

export interface ClaudeChatResult {
	text: string;
	usage?: { inputTokens: number; outputTokens: number };
}

function withTimeout<T>(promise: Promise<T>, ms = 35_000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const id = setTimeout(() => {
            console.error(`❌ Claude Client - Local timeout triggered after ${ms}ms`);
            reject(new Error(`Claude client timeout after ${ms}ms`));
        }, ms);
        promise
            .then((value) => resolve(value))
            .catch((err) => reject(err))
            .finally(() => clearTimeout(id));
    });
}

// Simple chat function: takes conversation messages and returns assistant text
export const chatWithClaude = async (
    messages: ChatMessage[], 
    systemPrompt?: string,
    opts?: { model?: string; timeoutMs?: number }
): Promise<ClaudeChatResult> => {
	try {
		console.log("🔍 Claude Client - Starting chatWithClaude");
		console.log("🔍 Claude Client - Messages count:", messages.length);
		console.log("🔍 Claude Client - System prompt:", systemPrompt?.substring(0, 100) + "...");
		const model = opts?.model || process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";
		const timeoutMs = opts?.timeoutMs ?? 35_000;
		
		const mapped = messages
			.filter((m) => m.role === "user" || m.role === "assistant")
			.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

		console.log("🔍 Claude Client - Mapped messages:", mapped.length);
		console.log("🔍 Claude Client - Last message:", mapped[mapped.length - 1]);

		console.log("🔍 Claude Client - Sending request to model", model, `(timeout=${timeoutMs}ms)`);
		const response = await withTimeout(
            anthropic.messages.create({
				model,
                max_tokens: 500,
                system: systemPrompt ?? "You are Recta, an executive assistant for structured hiring analysis.",
                messages: mapped,
            }),
			timeoutMs
        );

		console.log("🔍 Claude Client - Response received");
		const text = response.content[0]?.type === "text" ? response.content[0].text : "";
		console.log("🔍 Claude Client - Response text length:", text.length);
		
		return {
			text,
			usage: {
				inputTokens: (response.usage as any)?.input_tokens ?? 0,
				outputTokens: (response.usage as any)?.output_tokens ?? 0,
			},
		};
    } catch (error: any) {
        const status = error?.status || error?.response?.status;
        const data = error?.response?.data || error?.error || error?.message;
        console.error("❌ Claude Client - chatWithClaude failed", { status, data });
        if (status) {
            throw new Error(`Claude API error ${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        }
        throw new Error(error?.message || "Claude request failed");
    }
};

// Backwards-compatible wrapper used by the API route
export async function generateChatResponse(req: ChatRequest): Promise<ChatResponse> {
	const result = await chatWithClaude(req.messages);
	const assistantMessage: ChatMessage = {
		role: "assistant",
		content: result.text,
		stepId: req.stepId,
		timestamp: new Date().toISOString(),
	};
	return {
		message: assistantMessage,
		usage: result.usage,
	};
}
