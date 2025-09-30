import { ClusterType } from '../lib/clusters.js';

export interface ConversationMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface TestScenario {
	id: string;
	name: string;
	description: string;
	cluster: ClusterType;
	messages: ConversationMessage[];
	expectedProgression: number[];
	tolerance: number;
	expectedCategories: string[];
	completionCriteria: {
		minConfidence: number;
		minCategories: number;
		requiredInfo: string[];
	};
}

export const CONVERSATION_SCENARIOS: TestScenario[] = [
	{
		id: 'cfo-finance-scaling',
		name: 'CFO - Finance Scaling Challenge',
		description: 'Finance team struggling with scaling and reporting during rapid growth',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en CFO för vårt växande företag'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en CFO. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vår nuvarande ekonomifunktion räcker inte till. Vi har dubblat omsättningen på 18 månader men våra finansiella rapporter är alltid försenade'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi missar kritiska investeringsbeslut eftersom vi inte har aktuell data. Detta kostar oss potentiellt 5-10 miljoner SEK per kvartal i förlorade möjligheter'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en deadline på 6 månader innan vår Series B-runda. Investerare kräver professionell finansiell rapportering och vi kan inte vänta längre'
			}
		],
		expectedProgression: [25, 35, 45, 55], // High-complexity CFO role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 55, // High-complexity CFO threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'tech-lead-engineering',
		name: 'Tech Lead - Engineering Team Growth',
		description: 'Engineering team needs leadership for scaling and technical debt',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en Tech Lead för vårt utvecklingsteam'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en Tech Lead. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vårt team på 8 utvecklare saknar teknisk ledning. Vi har mycket teknisk skuld och ingen arkitekturstrategi'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi kan inte leverera nya funktioner i tid på grund av teknisk skuld. Detta påverkar vår konkurrenskraft och vi förlorar kunder till snabbare konkurrenter'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en produktlansering om 4 månader som kräver stabil arkitektur. Utan teknisk ledning kommer vi att missa deadline'
			}
		],
		expectedProgression: [25, 35, 45, 55], // High-complexity Tech Lead role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 55, // High-complexity Tech Lead threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'sales-manager-pipeline',
		name: 'Sales Manager - Pipeline/Revenue Issues',
		description: 'Sales team struggling with pipeline management and revenue growth',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en säljchef för vår nordiska marknad'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en säljchef. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vår säljorganisation fungerar inte i Norden. Vi har svårt att nå rätt kunder och vår varumärkesposition är svag'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi förlorar 15-20 miljoner SEK per år i potentiell omsättning. Konkurrenter växer 25% medan vi bara når 12%'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en aggressiv tillväxtplan som kräver 50% ökning nästa år. Utan professionell säljledning kommer vi att missa målen'
			}
		],
		expectedProgression: [30, 40, 50, 60], // Medium-complexity Operations role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 60, // Medium-complexity Operations threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'operations-efficiency',
		name: 'Operations - Process Efficiency Problems',
		description: 'Operations team struggling with process efficiency and quality',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en Operations Manager för våra leveransprocesser'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en Operations Manager. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Våra leveransprocesser fungerar inte effektivt. Vi har problem med att leverera i tid och våra kunder klagar'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi förlorar kunder på grund av dålig leveransservice. Detta kostar oss 8-12 miljoner SEK per år i förlorad omsättning'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en aggressiv tillväxtplan som kräver 3x fler leveranser nästa år. Utan effektiva processer kommer vi att kollapsa'
			}
		],
		expectedProgression: [35, 45, 55, 65], // Standard complexity Marketing role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 65, // Standard complexity Marketing threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'marketing-brand-growth',
		name: 'Marketing - Brand/Growth Challenges',
		description: 'Marketing team struggling with brand positioning and growth',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en CMO för vårt växande team'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en CMO. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vår marknadsföring fungerar inte för vår tillväxt. Vi har svårt att nå rätt kunder och vår varumärkesposition är svag'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi förlorar marknadsandelar till konkurrenter med bättre varumärkesposition. Detta påverkar vår tillväxt med 20-30% per år'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en aggressiv tillväxtplan som kräver 50 miljoner SEK i omsättning nästa år. Utan stark marknadsföring kommer vi att missa målen'
			}
		],
		expectedProgression: [35, 45, 55, 65], // Standard complexity HR role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 65, // Standard complexity HR threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'hr-talent-acquisition',
		name: 'HR - Talent Acquisition Challenges',
		description: 'HR team struggling with talent acquisition and retention',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en HR-chef för vår personalrekrytering'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en HR-chef. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vi har svårt att rekrytera rätt kompetens. Våra nuvarande processer är ineffektiva och vi missar bra kandidater'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi förlorar affärsmöjligheter på grund av personalbrist. Detta kostar oss 10-15 miljoner SEK per år i förlorad omsättning'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi behöver dubbla vår personalstyrka inom 12 månader för att möta vår tillväxtplan. Utan professionell HR-ledning kommer vi att missa målen'
			}
		],
		expectedProgression: [35, 45, 55, 65], // Standard complexity Product Manager role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 65, // Standard complexity Product Manager threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	},
	{
		id: 'product-manager-roadmap',
		name: 'Product Manager - Roadmap/Strategy Issues',
		description: 'Product team struggling with roadmap planning and strategy',
		cluster: 'pain-point',
		messages: [
			{
				role: 'user',
				content: 'Vi behöver en Product Manager för vår produktstrategi'
			},
			{
				role: 'assistant',
				content: 'Okej, ni är på jakt efter en Product Manager. Vad är det största problemet med er nuvarande situation utan en?'
			},
			{
				role: 'user',
				content: 'Vi saknar tydlig produktstrategi och roadmap. Våra utvecklingsteam arbetar utan riktning och vi bygger fel funktioner'
			},
			{
				role: 'assistant',
				content: 'Jag förstår. Det låter som en utmaning. Hur mycket försäljning uppskattar du att ni går miste om på grund av detta?'
			},
			{
				role: 'user',
				content: 'Vi förlorar kunder till konkurrenter med bättre produkter. Detta påverkar vår omsättning med 25-40% per år'
			},
			{
				role: 'assistant',
				content: 'Det låter allvarligt. När behöver ni ha detta löst?'
			},
			{
				role: 'user',
				content: 'Vi har en produktlansering om 6 månader som kräver tydlig strategi. Utan produktledning kommer vi att missa marknadsmöjligheten'
			}
		],
		expectedProgression: [35, 45, 55, 65], // Standard complexity Product Manager role
		tolerance: 15,
		expectedCategories: ['situation', 'gap', 'impact', 'timing', 'stakeholders'],
		completionCriteria: {
			minConfidence: 65, // Standard complexity Product Manager threshold
			minCategories: 4,
			requiredInfo: ['Nuvarande problem eller gap som behöver lösas', 'Kvantifierad påverkan på verksamheten', 'Tidsram för när problemet måste lösas']
		}
	}
];

export interface TestResult {
	scenario: TestScenario;
	actualProgression: number[];
	passed: boolean;
	confidence: number;
	categories: string[];
	missingInfo: string[];
	errors: string[];
}

export interface TestReport {
	totalTests: number;
	passedTests: number;
	failedTests: number;
	passRate: number;
	results: TestResult[];
	summary: {
		averageConfidence: number;
		commonIssues: string[];
		recommendations: string[];
	};
}
