"use client";

import { useState } from "react";
import { ChatMessage, StepId } from "@/lib/types";

interface ChatProps {
	stepId: StepId;
	messages: ChatMessage[];
	onMessagesChange: (messages: ChatMessage[]) => void;
}

export function Chat({ stepId, messages, onMessagesChange }: ChatProps) {
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	async function sendMessage() {
		if (!input.trim()) return;
		const userMessage: ChatMessage = { role: "user", content: input.trim(), stepId, timestamp: new Date().toISOString() };
		onMessagesChange([...messages, userMessage]);
		setInput("");
		setLoading(true);
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: [...messages, userMessage], stepId }),
			});
			const data = await res.json();
			if (data?.message) {
				onMessagesChange([...messages, userMessage, data.message]);
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="rounded-lg border border-slate-200 bg-white">
			<div className="max-h-[480px] space-y-3 overflow-y-auto p-4">
				{messages.filter((m) => m.stepId === stepId).map((m, idx) => (
					<div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
						<div className={"inline-block rounded-md px-3 py-2 " + (m.role === "user" ? "bg-primary text-white" : "bg-slate-100 text-slate-900")}>{m.content}</div>
					</div>
				))}
				{loading && <div className="text-sm text-slate-500">Thinking…</div>}
			</div>
			<div className="border-t border-slate-200 p-3">
				<div className="flex gap-2">
					<input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message" className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
					<button onClick={sendMessage} disabled={loading} className="rounded-md bg-accent px-4 py-2 text-white hover:bg-accent/90 disabled:opacity-50">Send</button>
				</div>
			</div>
		</div>
	);
}
