"use client";

interface StepCompletionProps {
	onComplete: () => void;
	isFinal?: boolean;
}

export function StepCompletion({ onComplete, isFinal }: StepCompletionProps) {
	return (
		<div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
			<p className="text-slate-700">{isFinal ? "Generate your final report when ready." : "When you're satisfied, continue to the next step."}</p>
			<button onClick={onComplete} className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
				{isFinal ? "Finish & Generate" : "Next Step"}
			</button>
		</div>
	);
}

