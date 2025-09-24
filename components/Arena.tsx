"use client";

import { useMemo, useState } from "react";
import { Chat } from "@/components/Chat";
import { ProgressBar } from "@/components/ProgressBar";
import { ReportPreview } from "@/components/ReportPreview";
import { StepCompletion } from "@/components/StepCompletion";
import { StepIntroduction } from "@/components/StepIntroduction";
import { STEPS } from "@/lib/constants";
import { ChatMessage, StepId } from "@/lib/types";

export function Arena() {
	const [currentStep, setCurrentStep] = useState<StepId>(1);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [showIntro, setShowIntro] = useState<boolean>(true);
	const stepsCount = STEPS.length;

	const percent = useMemo(() => Math.round(((currentStep - 1) / stepsCount) * 100), [currentStep, stepsCount]);

	function handleAdvance() {
		setShowIntro(false);
	}

	function handleCompleteStep() {
		if (currentStep < 6) {
			setCurrentStep((s) => ((s + 1) as StepId));
			setShowIntro(true);
		}
	}

	return (
		<div className="space-y-6">
			<ProgressBar currentStep={currentStep} totalSteps={stepsCount} percent={percent} />

			{showIntro ? (
				<StepIntroduction step={STEPS[currentStep - 1]} onBegin={handleAdvance} />
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<Chat stepId={currentStep} messages={messages} onMessagesChange={setMessages} />
					</div>
					<div className="lg:col-span-1">
						<ReportPreview stepId={currentStep} messages={messages} />
						<StepCompletion onComplete={handleCompleteStep} isFinal={currentStep === 6} />
					</div>
				</div>
			)}
		</div>
	);
}
