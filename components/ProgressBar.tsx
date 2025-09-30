interface ProgressBarProps {
	currentStep: number;
	totalSteps: number;
	percent: number; // 0-100
}

export function ProgressBar({ currentStep, totalSteps, percent }: ProgressBarProps) {
	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-sm font-medium text-slate-700">Step {currentStep} of {totalSteps}</span>
				<span className="text-sm text-slate-500">{percent}%</span>
			</div>
			<div className="h-2 w-full rounded-full bg-slate-200">
				<div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
			</div>
		</div>
	);
}

