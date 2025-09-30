export interface ConversationMessage {
	role: "assistant" | "user";
	content: string;
}

export interface RoleContext {
	role: string;
	seniority: 'junior' | 'mid' | 'senior' | 'executive';
	department: 'finance' | 'tech' | 'sales' | 'operations' | 'marketing' | 'hr' | 'general';
}

export interface CumulativeProgress {
	confidence: number;
	insightsGathered: number;
	requiredInsights: number;
}
