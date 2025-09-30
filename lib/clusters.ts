export type ClusterType = 'pain-point' | 'impact-urgency' | 'success-criteria' | 'resources-budget' | 'organization-culture' | 'alternatives-risks';

export interface ClusterProgress {
	confidence: number; // 0-100
	status: 'not-started' | 'in-progress' | 'completed';
	collectedInfo: string[];
}

export interface AnalysisState {
	currentCluster: ClusterType;
	clusters: Record<ClusterType, ClusterProgress>;
	overallProgress: number; // 0-100
}

export interface Cluster {
	id: ClusterType;
	title: string;
	icon: string;
	description: string;
	requiredInfo: string[];
	questions: string[];
	completionThreshold: number;
}

export const CLUSTERS: Cluster[] = [
	{
		id: 'pain-point',
		title: 'Problem & Pain Point',
		icon: '🎯',
		description: 'Identifiera det specifika problemet som rekryteringen ska lösa och de nuvarande smärtpunkterna.',
		requiredInfo: [
			'Nuvarande problem eller gap som behöver lösas',
			'Konsekvenser av att inte lösa problemet',
			'Vem som påverkas av problemet',
			'Tidsram för när problemet måste lösas',
			'Rotorsak till problemet',
			'Föregående försök att lösa problemet',
			'Kvantifierad påverkan på verksamheten',
			'Stakeholders som påverkas'
		],
		questions: [
			'Vilket specifikt problem försöker ni lösa med denna rekrytering?',
			'Vad händer om ni inte löser detta problem inom 6 månader?',
			'Vilka team eller funktioner påverkas mest av detta problem?',
			'Har ni försökt lösa detta problem tidigare? Vad fungerade inte?'
		],
		completionThreshold: 70
	},
	{
		id: 'impact-urgency',
		title: 'Impact & Urgency',
		icon: '⚡',
		description: 'Kvantifiera påverkan och brådskan för att prioritera rekryteringsinvesteringen.',
		requiredInfo: [
			'Kvantifierad påverkan på verksamheten',
			'Brådskan och tidskritiska faktorer',
			'Affärsnytta och ROI-prognos',
			'Risken av förseningar',
			'Konkurrensmässiga konsekvenser',
			'Kundpåverkan och förluster',
			'Teamproduktivitet och belastning',
			'Strategiska mål som påverkas'
		],
		questions: [
			'Hur mäter ni framgång för denna roll? Vilka KPI:er är viktigast?',
			'Vad är den ekonomiska påverkan om ni inte fyller rollen inom 3 månader?',
			'Finns det konkurrensmässiga fördelar med att agera snabbt?',
			'Vilka externa faktorer påverkar tidsramen?'
		],
		completionThreshold: 70
	},
	{
		id: 'success-criteria',
		title: 'Success Criteria',
		icon: '✅',
		description: 'Definiera tydliga, mätbara framgångskriterier för rollen och personen.',
		requiredInfo: [
			'Mätbara framgångskriterier för rollen',
			'Kompetenser och erfarenheter som krävs',
			'Prestanda-indikatorer och mål',
			'Utvecklingspotential och tillväxt',
			'Kulturell passning och värderingar',
			'Ledarskapskvaliteter och stilar',
			'Kommunikationsförmåga och samarbete',
			'Långsiktiga karriärmöjligheter'
		],
		questions: [
			'Vilka specifika resultat förväntar ni er inom de första 90 dagarna?',
			'Vilka tekniska eller funktionella kompetenser är absolut kritiska?',
			'Hur kommer ni att mäta framgång efter 6 månader?',
			'Vilken utvecklingspotential ser ni för personen i rollen?'
		],
		completionThreshold: 70
	},
	{
		id: 'resources-budget',
		title: 'Resources & Budget',
		icon: '💰',
		description: 'Säkerställ tillräckliga resurser och budget för en framgångsrik rekrytering.',
		requiredInfo: [
			'Budget för rekrytering och onboarding',
			'Tillgängliga interna resurser',
			'Externa partners och verktyg',
			'Långsiktiga kostnader och investeringar',
			'Lönebudget och kompensationsstruktur',
			'Onboarding och utbildningsresurser',
			'Rekryteringsverktyg och plattformar',
			'Backup-planer och alternativ'
		],
		questions: [
			'Vilken budget har ni för rekryteringsprocessen inklusive externa partners?',
			'Vilka interna resurser kan ni tilldela för onboarding och utveckling?',
			'Finns det befintliga verktyg eller system som kandidaten behöver kunna?',
			'Vilka är de totala kostnaderna för rollen under de första 12 månaderna?'
		],
		completionThreshold: 70
	},
	{
		id: 'organization-culture',
		title: 'Organization & Culture',
		icon: '🏢',
		description: 'Validera organisatorisk beredskap och kulturell passform för rollen.',
		requiredInfo: [
			'Organisatorisk struktur och rapporteringslinjer',
			'Kulturella värderingar och arbetsmiljö',
			'Teamdynamik och samarbetsmönster',
			'Stöd och utvecklingsmöjligheter',
			'Ledarskapsstil och beslutsprocesser',
			'Kommunikationskultur och transparens',
			'Konfliktlösning och feedback-kultur',
			'Innovation och förändringsbenägenhet'
		],
		questions: [
			'Hur passar rollen in i er nuvarande organisationsstruktur?',
			'Vilka kulturella värderingar är viktigast för framgång i rollen?',
			'Hur kommer personen att samarbeta med andra team och funktioner?',
			'Vilket stöd och vilka utvecklingsmöjligheter kan ni erbjuda?'
		],
		completionThreshold: 70
	},
	{
		id: 'alternatives-risks',
		title: 'Alternatives & Risks',
		icon: '🔄',
		description: 'Utvärdera alternativ och identifiera risker för att säkerställa optimala beslut.',
		requiredInfo: [
			'Alternativa lösningar till rekrytering',
			'Identifierade risker och mitigeringar',
			'Fallback-planer och kontingenser',
			'Långsiktiga konsekvenser av beslutet',
			'Konkurrensmässiga hot och möjligheter',
			'Marknadsförändringar och trender',
			'Interna kapacitetsbegränsningar',
			'Strategiska alternativ och scenarier'
		],
		questions: [
			'Vilka alternativ till extern rekrytering har ni övervägt?',
			'Vilka är de största riskerna med denna rekrytering?',
			'Hur skulle ni hantera situationen om kandidaten inte fungerar?',
			'Vilka långsiktiga konsekvenser ser ni av detta beslut?'
		],
		completionThreshold: 70
	}
];

export const getClusterById = (id: ClusterType): Cluster | undefined => {
	return CLUSTERS.find(cluster => cluster.id === id);
};

export const getNextCluster = (currentCluster: ClusterType): ClusterType | null => {
	const currentIndex = CLUSTERS.findIndex(cluster => cluster.id === currentCluster);
	return currentIndex < CLUSTERS.length - 1 ? CLUSTERS[currentIndex + 1].id : null;
};

export const getPreviousCluster = (currentCluster: ClusterType): ClusterType | null => {
	const currentIndex = CLUSTERS.findIndex(cluster => cluster.id === currentCluster);
	return currentIndex > 0 ? CLUSTERS[currentIndex - 1].id : null;
};

export const calculateOverallProgress = (clusters: Record<ClusterType, ClusterProgress>): number => {
	const totalClusters = CLUSTERS.length;
	const completedClusters = Object.values(clusters).filter(cluster => cluster.status === 'completed').length;
	const inProgressClusters = Object.values(clusters).filter(cluster => cluster.status === 'in-progress');
	
	const inProgressProgress = inProgressClusters.reduce((sum, cluster) => sum + cluster.confidence, 0) / totalClusters;
	
	return Math.round((completedClusters / totalClusters) * 100 + inProgressProgress);
};
