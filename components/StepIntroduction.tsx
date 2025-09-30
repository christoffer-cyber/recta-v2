"use client";

import { StepDefinition } from "@/lib/types";

interface StepIntroductionProps {
	step: StepDefinition;
	onBegin: () => void;
}

export function StepIntroduction({ step, onBegin }: StepIntroductionProps) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
			<h2 className="text-xl font-semibold text-primary">Step {step.id}: {step.title}</h2>
			<p className="mt-2 text-slate-600">{step.description}</p>
			<button onClick={onBegin} className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">Begin</button>
		</div>
	);
}

