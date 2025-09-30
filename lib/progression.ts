import { ClusterType, getClusterById } from './clusters';
import { ConversationMessage, RoleContext } from './engine-types';
import { analyzeUniversalQuality } from './quality-analysis';
import { calculateRoleSpecificConfidence, ROLE_COMPLETION_THRESHOLDS } from './confidence';

export interface CumulativeProgress {
	totalInsights: number;
	gatheredInsights: string[];
	missingInsights: string[];
	phaseReadiness: 'gathering' | 'ready' | 'complete';
	roleSpecificScore: number;
	completionThreshold: number;
}

export const calculateCumulativeProgress = (
	messages: ConversationMessage[],
	currentCluster: ClusterType,
	roleContext: RoleContext
): CumulativeProgress => {
	const cluster = getClusterById(currentCluster);
	if (!cluster) {
		return {
			totalInsights: 0,
			gatheredInsights: [],
			missingInsights: [],
			phaseReadiness: 'gathering',
			roleSpecificScore: 0,
			completionThreshold: 70
		};
	}

	const allText = messages.map(m => m.content).join(' ');
	const messageLower = allText.toLowerCase();

	const analysis = analyzeUniversalQuality(allText, messageLower);
	const roleSpecificScore = calculateRoleSpecificConfidence(analysis, roleContext, 0);

	const gatheredInsights: string[] = [];
	const missingInsights: string[] = [];

	cluster.requiredInfo.forEach(infoPoint => {
		const hasMatch = checkInfoPointMatchInternal(messageLower, infoPoint, currentCluster);
		if (hasMatch) gatheredInsights.push(infoPoint);
		else missingInsights.push(infoPoint);
	});

	const completionThreshold = ROLE_COMPLETION_THRESHOLDS[roleContext.seniority][roleContext.department] || 70;
	let phaseReadiness: 'gathering' | 'ready' | 'complete' = 'gathering';
	if (roleSpecificScore >= completionThreshold && gatheredInsights.length >= cluster.requiredInfo.length * 0.7) phaseReadiness = 'ready';
	if (gatheredInsights.length >= cluster.requiredInfo.length) phaseReadiness = 'complete';

	return {
		totalInsights: cluster.requiredInfo.length,
		gatheredInsights,
		missingInsights,
		phaseReadiness,
		roleSpecificScore,
		completionThreshold
	};
};

export const getPhaseProgressionSignal = (
	currentCluster: ClusterType,
	roleContext: RoleContext,
	cumulativeProgress: CumulativeProgress
): string => {
	const roleSignals: Record<string, Record<string, string[]>> = {
		'pain-point': {
			'cfo': [
				'Bra! Nu förstår jag det finansiella problemet. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er ekonomiska utmaning. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er finansiella situation. Låt oss nu fokusera på kostnader och påverkan.'
			],
			'tech': [
				'Bra! Nu förstår jag det tekniska problemet. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er tekniska utmaning. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er tekniska situation. Låt oss nu fokusera på kostnader och påverkan.'
			],
			'sales': [
				'Bra! Nu förstår jag er försäljningsutmaning. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er säljproblem. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er försäljningssituation. Låt oss nu fokusera på kostnader och påverkan.'
			],
			'operations': [
				'Bra! Nu förstår jag er driftsutmaning. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er processproblem. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er driftsituation. Låt oss nu fokusera på kostnader och påverkan.'
			],
			'marketing': [
				'Bra! Nu förstår jag er marknadsutmaning. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er marknadsproblem. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er marknadssituation. Låt oss nu fokusera på kostnader och påverkan.'
			],
			'hr': [
				'Bra! Nu förstår jag er personalutmaning. Låt oss titta på vad det kostar er.',
				'Perfekt! Vi har en tydlig bild av er HR-problem. Nu behöver vi kvantifiera påverkan.',
				'Utmärkt! Jag förstår er personalsituation. Låt oss nu fokusera på kostnader och påverkan.'
			]
		}
	};

	const clusterSignals = roleSignals[currentCluster] || {};
	const roleSpecificSignals = clusterSignals[roleContext.role] || clusterSignals['default'] || [
		'Bra! Nu förstår jag problemet. Låt oss titta på vad det kostar er.',
		'Perfekt! Vi har en tydlig bild av utmaningen. Nu behöver vi kvantifiera påverkan.',
		'Utmärkt! Jag förstår situationen. Låt oss nu fokusera på kostnader och påverkan.'
	];

	return roleSpecificSignals[Math.floor(Math.random() * roleSpecificSignals.length)];
};

export const canProgressToNext = (currentCluster: { confidence: number; status: string; collectedInfo: string[] }, clusterType: ClusterType): boolean => {
	const cluster = getClusterById(clusterType);
	if (!cluster) return false;

	const minExchanges = 5;
	const hasMinimumExchanges = currentCluster.collectedInfo.length >= minExchanges;
	const hasHighConfidence = currentCluster.confidence >= cluster.completionThreshold;
	const requiredInfoCount = cluster.requiredInfo.length;
	const collectedInfoCount = currentCluster.collectedInfo.length;
	const coverageRatio = collectedInfoCount / requiredInfoCount;
	const hasSubstantialCoverage = coverageRatio >= 0.75;
	return hasMinimumExchanges && hasHighConfidence && hasSubstantialCoverage;
};

export const generatePhaseTransition = (fromCluster: ClusterType, toCluster: ClusterType) => {
	const from = getClusterById(fromCluster);
	const to = getClusterById(toCluster);
	if (!from || !to) {
		return { message: "Okej, låt oss gå vidare.", summary: "Fortsättning av analysen", nextSteps: ["Fortsätt med nästa fas"] };
	}
	const transitions: Record<string, { message: string; summary: string; nextSteps: string[] }> = {
		'pain-point->impact-urgency': {
			message: `Bra! Nu förstår jag problemet. Låt oss titta på vad det kostar er.`,
			summary: `Avslutat: ${from.title} → Startar: ${to.title}`,
			nextSteps: ["Kvantifiera påverkan på verksamheten","Identifiera tidskritiska faktorer","Bedöma affärsnytta och ROI"]
		},
		'impact-urgency->success-criteria': {
			message: `Okej, så nu vet vi vad det kostar. Vad ska personen åstadkomma?`,
			summary: `Avslutat: ${from.title} → Startar: ${to.title}`,
			nextSteps: ["Definiera mätbara framgångskriterier","Specificera kritiska kompetenser","Ställa upp prestanda-indikatorer"]
		},
		'success-criteria->resources-budget': {
			message: `Bra! Nu vet vi vad som ska åstadkommas. Vilka resurser har ni?`,
			summary: `Avslutat: ${from.title} → Startar: ${to.title}`,
			nextSteps: ["Bedöma budget och resurser","Planera onboarding-processen","Identifiera externa partners"]
		},
		'resources-budget->organization-culture': {
			message: `Okej, så resurserna finns. Hur passar rollen in i er organisation?`,
			summary: `Avslutat: ${from.title} → Startar: ${to.title}`,
			nextSteps: ["Validera organisationsstruktur","Bedöma kulturell passform","Planera teamintegration"]
		},
		'organization-culture->alternatives-risks': {
			message: `Bra! Nu har vi en bra bild. Låt oss titta på risker och alternativ.`,
			summary: `Avslutat: ${from.title} → Startar: ${to.title}`,
			nextSteps: ["Utvärdera alternativa lösningar","Identifiera och mitigera risker","Skapa fallback-planer"]
		}
	};
	const transitionKey = `${fromCluster}->${toCluster}`;
	return transitions[transitionKey] || {
		message: `Låt oss fortsätta med ${to.title}. ${to.description}`,
		summary: `Fortsätter till: ${to.title}`,
		nextSteps: ["Fortsätt med analysen"]
	};
};

export const getClusterSummary = (clusterType: ClusterType, progress: { confidence: number; collectedInfo: string[]; }): string => {
	const cluster = getClusterById(clusterType);
	if (!cluster) return "Okänd kluster";
	const completion = Math.round((progress.collectedInfo.length / cluster.requiredInfo.length) * 100);
	return `${cluster.title}: ${completion}% komplett (${progress.confidence}% säkerhet)`;
};

function checkInfoPointMatchInternal(message: string, infoPoint: string, cluster: ClusterType): boolean {
	const patterns: Record<ClusterType, Record<string, string[]>> = {
		'pain-point': {
			'Nuvarande problem eller gap som behöver lösas': ['problem','gap','behöver','saknas','brist','utmaning','svårighet','cfo','chef','ledare'],
			'Konsekvenser av att inte lösa problemet': ['konsekvens','risker','händer om','om vi inte','försening','kostnad'],
			'Vem som påverkas av problemet': ['team','avdelning','organisation','påverkas','drabbas','berör'],
			'Tidsram för när problemet måste lösas': ['tidsram','när','snart','månader','veckor','akut','brådskande']
		},
		'impact-urgency': {
			'Kvantifierad påverkan på verksamheten': ['påverkan','effekt','resultat','kpi','mätbar','siffror','procent'],
			'Brådskan och tidskritiska faktorer': ['brådskande','akut','tidskritisk','deadline','snart','månader'],
			'Affärsnytta och ROI-prognos': ['roi','affärsnytta','vinst','kostnad','investering','tillbaka'],
			'Risken av förseningar': ['risk','försening','förlust','missad','chans','konkurrens']
		},
		'success-criteria': {
			'Mätbara framgångskriterier för rollen': ['framgång','mål','kriterier','mätbar','kpi','resultat'],
			'Kompetenser och erfarenheter som krävs': ['kompetens','erfarenhet','kunskaper','färdigheter','utbildning'],
			'Prestanda-indikatorer och mål': ['prestanda','indikatorer','mål','benchmark','standard'],
			'Utvecklingspotential och tillväxt': ['utveckling','tillväxt','potential','karriär','framtid']
		},
		'resources-budget': {
			'Budget för rekrytering och onboarding': ['budget','kostnad','pengar','resurser','onboarding'],
			'Tillgängliga interna resurser': ['interna','resurser','personal','team','hjälp'],
			'Externa partners och verktyg': ['externa','partners','verktyg','system','konsulter'],
			'Långsiktiga kostnader och investeringar': ['långsiktig','investering','kostnad','framtid','år']
		},
		'organization-culture': {
			'Organisatorisk struktur och rapporteringslinjer': ['struktur','rapportering','hierarki','organisation','chef'],
			'Kulturella värderingar och arbetsmiljö': ['kultur','värderingar','miljö','atmosfär','stil'],
			'Teamdynamik och samarbetsmönster': ['team','samarbete','dynamik','grupp','kollegor'],
			'Stöd och utvecklingsmöjligheter': ['stöd','utveckling','möjligheter','träning','lärande']
		},
		'alternatives-risks': {
			'Alternativa lösningar till rekrytering': ['alternativ','andra','lösningar','istället','utöver'],
			'Identifierade risker och mitigeringar': ['risker','risk','problem','mitigering','hantera'],
			'Fallback-planer och kontingenser': ['fallback','plan b','kontingens','reserv','backup'],
			'Långsiktiga konsekvenser av beslutet': ['långsiktig','konsekvenser','framtid','påverkan','resultat']
		}
	};
	const clusterPatterns = patterns[cluster];
	const infoPatterns = clusterPatterns[infoPoint];
	if (!infoPatterns) {
		const keywords = infoPoint.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(w=>w.length>2);
		return keywords.some(keyword => message.includes(keyword.toLowerCase()));
	}
	return infoPatterns.some(pattern => message.includes(pattern));
}


