export type StepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface StepDefinition {
	id: StepId;
	title: string;
	description: string;
}

export interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string;
	stepId?: StepId;
	timestamp: string; // ISO string
}

export interface StepProgress {
	currentStep: StepId;
	completedSteps: StepId[];
	percentComplete: number; // 0-100
}

export interface ReportSection {
	title: string;
	content: string;
}

export interface ReportSummary {
	candidateName?: string;
	roleTitle?: string;
	sections: ReportSection[];
	generatedAt: string; // ISO string
}

export interface ChatRequest {
	messages: ChatMessage[];
	stepId: StepId;
}

export interface ChatResponse {
	message: ChatMessage;
	usage?: {
		inputTokens: number;
		outputTokens: number;
	};
}
