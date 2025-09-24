import { ChatMessage, StepId } from "@/lib/types";

interface ReportPreviewProps {
	stepId: StepId;
	messages: ChatMessage[];
}

export function ReportPreview({ stepId, messages }: ReportPreviewProps) {
	const stepMessages = messages.filter((m) => m.stepId === stepId && m.role === "assistant");
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<h3 className="text-sm font-semibold text-slate-700">Report Preview</h3>
			<div className="mt-3 space-y-2 text-sm text-slate-600">
				{stepMessages.length === 0 ? (
					<p>No content yet. Chat to generate insights.</p>
				) : (
					stepMessages.slice(-3).map((m, i) => <p key={i}>{m.content}</p>)
				)}
			</div>
		</div>
	);
}
