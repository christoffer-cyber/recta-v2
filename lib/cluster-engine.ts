import { Cluster, ClusterType, ClusterProgress, CLUSTERS, getClusterById } from './clusters';
import { ConversationMessage, RoleContext } from './engine-types';
import { analyzeUniversalQuality, analyzeSpecificity, analyzeQuantification, analyzeContext, analyzeCausality, type UniversalQualityAnalysis } from './quality-analysis';
import { calculateRoleSpecificConfidence, calculateUniversalConfidence, ROLE_WEIGHTS, ROLE_COMPLETION_THRESHOLDS } from './confidence';
import { calculateCumulativeProgress, getPhaseProgressionSignal, canProgressToNext, generatePhaseTransition, getClusterSummary } from './progression';

export interface MessageAnalysis {
	confidence: number; // 0-100
	matchedInfo: string[];
	missingInfo: string[];
	quality: 'low' | 'medium' | 'high';
}

export type { RoleContext, ConversationMessage } from './engine-types';

// moved to confidence.ts

// moved to progression.ts


export interface PhaseTransition {
	message: string;
	summary: string;
	nextSteps: string[];
}

/**
 * Role-specific scoring weights for different types of roles
 */
// moved to confidence.ts

/**
 * Role-specific completion thresholds based on seniority and complexity
 */
// moved to confidence.ts

/**
 * Detects role context from user messages
 */
export { detectRoleContext } from './role-detection';

/**
 * Calculates role-specific confidence score
 */
// re-export selected helpers for existing imports
export { calculateRoleSpecificConfidence } from './confidence';

/**
 * Calculates cumulative progress across conversation
 */
export { calculateCumulativeProgress, getPhaseProgressionSignal, canProgressToNext, generatePhaseTransition, getClusterSummary };

/**
 * Analyzes a user message against the current cluster's requirements
 * Returns confidence score and information coverage analysis
 */
export const analyzeMessage = (message: string, currentCluster: ClusterType, roleContext?: RoleContext): MessageAnalysis => {
	const cluster = getClusterById(currentCluster);
	if (!cluster) {
		console.log(`🔍 CLUSTER ENGINE - Cluster ${currentCluster} not found!`);
		return { confidence: 0, matchedInfo: [], missingInfo: [], quality: 'low' };
	}

	console.log(`🔍 CLUSTER ENGINE - Cluster ${currentCluster} threshold: ${cluster.completionThreshold}%`);
	console.log(`🔍 CLUSTER ENGINE - Required info points: ${cluster.requiredInfo.length}`);

	const messageLower = message.toLowerCase();
	const matchedInfo: string[] = [];
	const missingInfo: string[] = [];

	// More intelligent matching for each required info point
	cluster.requiredInfo.forEach(infoPoint => {
		const hasMatch = checkInfoPointMatch(messageLower, infoPoint, currentCluster);
		
		if (hasMatch) {
			matchedInfo.push(infoPoint);
		} else {
			missingInfo.push(infoPoint);
		}
	});

	// Universal quality-based confidence scoring system
	console.log(`🔍 CLUSTER ENGINE - Analyzing message for ${currentCluster}:`);
	console.log(`🔍 CLUSTER ENGINE - Message length: ${message.length}`);
	console.log(`🔍 CLUSTER ENGINE - Matched info points: ${matchedInfo.length} (${matchedInfo.join(', ')})`);
	
	const qualityAnalysis = analyzeUniversalQuality(message, messageLower);
	console.log(`🔍 CLUSTER ENGINE - Quality analysis:`, qualityAnalysis);
	
	// Calculate confidence - use role-specific if role context provided
	let confidence: number;
	if (roleContext) {
		confidence = calculateRoleSpecificConfidence(qualityAnalysis, roleContext, matchedInfo.length);
		console.log(`🔍 CLUSTER ENGINE - Role-specific confidence: ${confidence}% (${roleContext.role}, ${roleContext.seniority})`);
	} else {
		confidence = calculateUniversalConfidence(qualityAnalysis, matchedInfo.length);
		console.log(`🔍 CLUSTER ENGINE - Universal confidence: ${confidence}%`);
	}
	
	// ANTI-REGRESSION: Ensure confidence never goes below a reasonable minimum
	// This prevents the system from giving lower scores for more detailed responses
	const minConfidence = Math.max(5, matchedInfo.length * 2); // Minimum 2% per matched info point
	confidence = Math.max(confidence, minConfidence);
	
	console.log(`🔍 CLUSTER ENGINE - Final confidence: ${confidence}%`);

	// Determine quality based on role-specific criteria if available
	let quality: 'low' | 'medium' | 'high' = 'low';
	const threshold = roleContext ? 
		ROLE_COMPLETION_THRESHOLDS[roleContext.seniority][roleContext.department] || 70 : 70;
	
	if (confidence >= threshold * 0.85 && qualityAnalysis.categoriesCovered >= 4) {
		quality = 'high';
		console.log(`🔍 CLUSTER ENGINE - Quality: HIGH (${confidence}% confidence, ${qualityAnalysis.categoriesCovered}/6 categories)`);
	} else if (confidence >= threshold * 0.5 && qualityAnalysis.categoriesCovered >= 2) {
		quality = 'medium';
		console.log(`🔍 CLUSTER ENGINE - Quality: MEDIUM (${confidence}% confidence, ${qualityAnalysis.categoriesCovered}/6 categories)`);
	} else {
		console.log(`🔍 CLUSTER ENGINE - Quality: LOW (${confidence}% confidence, ${qualityAnalysis.categoriesCovered}/6 categories)`);
	}

	return { confidence, matchedInfo, missingInfo, quality };
};

/**
 * Generates role-aware adaptive questions based on role context and missing insights
 */
/**
 * SPIN Framework + Challenger Sale Strategic Questioning
 * Focuses on confidential/internal information only the user knows
 */
export { getRoleAwareQuestion, getChallengerInsight } from './questions';

/**
 * Challenger Sale methodology - challenges assumptions and reveals hidden problems
 */

/**
 * Generates contextual quick response suggestions based on conversation context and role
 */
export { generateQuickResponseSuggestions } from './quick-responses';

/**
 * Generates natural progression signals when phase is ready
 */
// moved to progression.ts

/**
 * Universal Quality Analysis System
 * Evaluates information depth across 6 universal categories
 */

// moved to quality-analysis.ts (interface defined in quality-analysis)

/**
 * Analyzes message quality using universal categories
 */
// analyzeUniversalQuality is imported from quality-analysis.ts

/**
 * Calculates universal confidence based on quality analysis
 */
export { calculateUniversalConfidence, ROLE_WEIGHTS, ROLE_COMPLETION_THRESHOLDS } from './confidence';

/**
 * Returns a complete, human-readable breakdown of how confidence was computed
 * for a given message. Useful for debugging and UI transparency.
 */
export const explainConfidence = (message: string | ConversationMessage) => {
    // Handle both string and ConversationMessage object inputs
    const messageText = typeof message === 'string' ? message : (message as ConversationMessage).content || '';
    const lower = messageText.toLowerCase();
    const qa = analyzeUniversalQuality(messageText, lower);

    // Raw components
    const categoriesPoints = qa.categoriesCovered * 5; // 0-30
    const specificityPoints = qa.specificity * 2;      // 0-8
    const quantificationPoints = qa.quantification * 2;// 0-8
    const contextPoints = qa.context * 2;              // 0-8
    const causalityPoints = qa.causality * 2;          // 0-8
    const impactBonus = qa.businessImpact ? 10 : 0;    // 0/10
    const timingBonus = qa.timingContext ? 10 : 0;     // 0/10

    const preCapScore = categoriesPoints + specificityPoints + quantificationPoints + contextPoints + causalityPoints + impactBonus + timingBonus; // theoretical 82

    // Apply caps mirroring calculateUniversalConfidence
    let cappedScore = preCapScore;
    const capsApplied: string[] = [];
    if (!qa.businessImpact || !qa.timingContext) {
        if (cappedScore > 75) cappedScore = 75;
        capsApplied.push('No 85% without BOTH business impact AND timing/context (cap=75)');
    }
    if (qa.categoriesCovered < 4) {
        if (cappedScore > 70) cappedScore = 70;
        capsApplied.push('Need ≥4/6 categories for high confidence (cap=70)');
    }
    if (cappedScore > 85) {
        cappedScore = 85;
        capsApplied.push('Global maximum confidence cap (85)');
    }

    return {
        messagePreview: messageText.substring(0, 160),
        categories: {
            situationDescription: qa.categoriesCovered >= 1,
            gapPainIdentification: undefined, // covered via categoriesCovered aggregate; see note below
            businessImpact: qa.businessImpact,
            stakeholderEffects: undefined,
            timingContext: qa.timingContext,
            scopeScale: undefined,
            coveredCount: qa.categoriesCovered,
            points: categoriesPoints,
            pointsPerCategory: 5
        },
        qualityIndicators: {
            specificity: { score: qa.specificity, points: specificityPoints, max: 4, triggers: 'role/tech details' },
            quantification: { score: qa.quantification, points: quantificationPoints, max: 4, triggers: 'numbers, %, money, timeframes' },
            context: { score: qa.context, points: contextPoints, max: 4, triggers: 'business/industry/market/strategic' },
            causality: { score: qa.causality, points: causalityPoints, max: 4, triggers: 'because/due to → result, solution/consequence' }
        },
        bonuses: {
            businessImpact: impactBonus,
            timingContext: timingBonus
        },
        totals: {
            preCapScore,
            finalConfidence: Math.max(0, Math.min(85, Math.round(cappedScore))),
            capsApplied
        },
        notes: [
            'CategoriesCovered counts how many of the 6 universal categories are detected; each is worth 5 points.',
            'Quality indicators each score 0-4 and are doubled to points (×2).',
            'High confidence requires BOTH business impact and timing/context signals.',
            'Design intentionally caps maximum confidence at 85%.',
        ]
    } as const;
};

export const semanticEnhanceAnalysis = async (
    message: string,
    base: MessageAnalysis
): Promise<MessageAnalysis> => {
    const words = message.trim().split(/\s+/).length;
    if (words <= 10) return base;

    try {
        const response = await fetch('/api/semantic-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                baseConfidence: base.confidence 
            })
        });

        if (!response.ok) {
            console.warn('⚠️ Semantic analysis API failed, using base scoring');
            return base;
        }

        const data = await response.json();
        const enhancedConfidence = data.enhancedConfidence || base.confidence;
        const quality = enhancedConfidence >= 75 ? 'high' : enhancedConfidence >= 50 ? 'medium' : 'low';
        
        return { 
            ...base, 
            confidence: enhancedConfidence, 
            quality 
        };
    } catch (error) {
        console.warn('⚠️ Semantic analysis failed, using base scoring:', error);
        return base;
    }
};

/**
 * More intelligent matching for specific info points
 */
function checkInfoPointMatch(message: string, infoPoint: string, cluster: ClusterType): boolean {
	// Define specific patterns for each cluster
	const patterns: Record<ClusterType, Record<string, string[]>> = {
		'pain-point': {
			'Nuvarande problem eller gap som behöver lösas': ['problem', 'gap', 'behöver', 'saknas', 'brist', 'utmaning', 'svårighet', 'cfo', 'chef', 'ledare'],
			'Konsekvenser av att inte lösa problemet': ['konsekvens', 'risker', 'händer om', 'om vi inte', 'försening', 'kostnad'],
			'Vem som påverkas av problemet': ['team', 'avdelning', 'organisation', 'påverkas', 'drabbas', 'berör'],
			'Tidsram för när problemet måste lösas': ['tidsram', 'när', 'snart', 'månader', 'veckor', 'akut', 'brådskande']
		},
		'impact-urgency': {
			'Kvantifierad påverkan på verksamheten': ['påverkan', 'effekt', 'resultat', 'kpi', 'mätbar', 'siffror', 'procent'],
			'Brådskan och tidskritiska faktorer': ['brådskande', 'akut', 'tidskritisk', 'deadline', 'snart', 'månader'],
			'Affärsnytta och ROI-prognos': ['roi', 'affärsnytta', 'vinst', 'kostnad', 'investering', 'tillbaka'],
			'Risken av förseningar': ['risk', 'försening', 'förlust', 'missad', 'chans', 'konkurrens']
		},
		'success-criteria': {
			'Mätbara framgångskriterier för rollen': ['framgång', 'mål', 'kriterier', 'mätbar', 'kpi', 'resultat'],
			'Kompetenser och erfarenheter som krävs': ['kompetens', 'erfarenhet', 'kunskaper', 'färdigheter', 'utbildning'],
			'Prestanda-indikatorer och mål': ['prestanda', 'indikatorer', 'mål', 'benchmark', 'standard'],
			'Utvecklingspotential och tillväxt': ['utveckling', 'tillväxt', 'potential', 'karriär', 'framtid']
		},
		'resources-budget': {
			'Budget för rekrytering och onboarding': ['budget', 'kostnad', 'pengar', 'resurser', 'onboarding'],
			'Tillgängliga interna resurser': ['interna', 'resurser', 'personal', 'team', 'hjälp'],
			'Externa partners och verktyg': ['externa', 'partners', 'verktyg', 'system', 'konsulter'],
			'Långsiktiga kostnader och investeringar': ['långsiktig', 'investering', 'kostnad', 'framtid', 'år']
		},
		'organization-culture': {
			'Organisatorisk struktur och rapporteringslinjer': ['struktur', 'rapportering', 'hierarki', 'organisation', 'chef'],
			'Kulturella värderingar och arbetsmiljö': ['kultur', 'värderingar', 'miljö', 'atmosfär', 'stil'],
			'Teamdynamik och samarbetsmönster': ['team', 'samarbete', 'dynamik', 'grupp', 'kollegor'],
			'Stöd och utvecklingsmöjligheter': ['stöd', 'utveckling', 'möjligheter', 'träning', 'lärande']
		},
		'alternatives-risks': {
			'Alternativa lösningar till rekrytering': ['alternativ', 'andra', 'lösningar', 'istället', 'utöver'],
			'Identifierade risker och mitigeringar': ['risker', 'risk', 'problem', 'mitigering', 'hantera'],
			'Fallback-planer och kontingenser': ['fallback', 'plan b', 'kontingens', 'reserv', 'backup'],
			'Långsiktiga konsekvenser av beslutet': ['långsiktig', 'konsekvenser', 'framtid', 'påverkan', 'resultat']
		}
	};

	const clusterPatterns = patterns[cluster];
	const infoPatterns = clusterPatterns[infoPoint];
	
	if (!infoPatterns) {
		// Fallback to keyword matching
		const keywords = extractKeywords(infoPoint);
		return keywords.some(keyword => message.includes(keyword.toLowerCase()));
	}

	// Check if message contains any of the relevant patterns
	return infoPatterns.some(pattern => message.includes(pattern));
}

/**
 * Get cluster-specific bonus for confidence scoring
 */
function getClusterSpecificBonus(message: string, cluster: ClusterType): number {
	const bonuses: Record<ClusterType, string[]> = {
		'pain-point': ['problem', 'utmaning', 'svårighet', 'gap', 'brist', 'behöver', 'saknas', 'förbättra', 'lösa'],
		'impact-urgency': ['brådskande', 'akut', 'viktigt', 'kritisk', 'prioritet', 'deadline', 'tidsram', 'press'],
		'success-criteria': ['mål', 'framgång', 'kriterier', 'kompetens', 'erfarenhet', 'kvalifikationer', 'resultat'],
		'resources-budget': ['budget', 'kostnad', 'resurser', 'pengar', 'investering', 'lön', 'utgifter', 'finansiering'],
		'organization-culture': ['kultur', 'team', 'organisation', 'struktur', 'miljö', 'värderingar', 'arbetssätt'],
		'alternatives-risks': ['alternativ', 'risk', 'lösning', 'plan', 'konsekvens', 'möjligheter', 'hot']
	};

	const clusterBonus = bonuses[cluster] || [];
	const matches = clusterBonus.filter(bonus => message.includes(bonus));
	
	console.log(`🔍 CLUSTER ENGINE - getClusterSpecificBonus for ${cluster}:`);
	console.log(`🔍 CLUSTER ENGINE - Message: "${message.substring(0, 100)}..."`);
	console.log(`🔍 CLUSTER ENGINE - Matched terms: ${matches.length} (${matches.join(', ')})`);
	
	// More demanding scoring - require multiple relevant terms for significant bonus
	let bonus = 0;
	if (matches.length >= 3) {
		bonus = 15; // High bonus for comprehensive coverage
		console.log(`🔍 CLUSTER ENGINE - High bonus: +15 (3+ terms)`);
	} else if (matches.length >= 2) {
		bonus = 8;  // Medium bonus for good coverage
		console.log(`🔍 CLUSTER ENGINE - Medium bonus: +8 (2+ terms)`);
	} else if (matches.length >= 1) {
		bonus = 3;  // Low bonus for basic relevance
		console.log(`🔍 CLUSTER ENGINE - Low bonus: +3 (1+ terms)`);
	} else {
		console.log(`🔍 CLUSTER ENGINE - No bonus: 0 (no relevant terms)`);
	}
	
	return bonus;
}

/**
 * Checks if a cluster meets completion criteria
 */
export const checkClusterCompletion = (cluster: ClusterProgress, clusterType: ClusterType): boolean => {
	const clusterDef = getClusterById(clusterType);
	if (!clusterDef) return false;

	return cluster.confidence >= clusterDef.completionThreshold && 
		   cluster.status === 'in-progress' &&
		   cluster.collectedInfo.length >= clusterDef.requiredInfo.length * 0.8; // 80% of required info
};

/**
 * Generates adaptive follow-up questions based on missing information
 */
export const getNextAdaptiveQuestion = (clusterType: ClusterType, missingInfo: string[]): string => {
	const cluster = getClusterById(clusterType);
	if (!cluster) {
		return "Kan du berätta mer om situationen?";
	}

	// If no missing info, ask for more detail
	if (missingInfo.length === 0) {
		return getEncouragingFollowUp(clusterType);
	}

	// Map missing info to specific questions - NATURAL CONVERSATION STYLE
	const questionMap: Record<ClusterType, Record<string, string>> = {
		'pain-point': {
			'Nuvarande problem eller gap som behöver lösas': 'Vad saknas just nu?',
			'Konsekvenser av att inte lösa problemet': 'Vad händer om ni inte löser detta?',
			'Vem som påverkas av problemet': 'Vilka team påverkas mest?',
			'Tidsram för när problemet måste lösas': 'När behöver det vara löst?'
		},
		'impact-urgency': {
			'Kvantifierad påverkan på verksamheten': 'Vad kostar det er att inte ha denna person?',
			'Brådskan och tidskritiska faktorer': 'Vad händer om ni väntar 3 månader till?',
			'Affärsnytta och ROI-prognos': 'Vad vinner ni på att agera snabbt?',
			'Risken av förseningar': 'Vad kan stoppa er?'
		},
		'success-criteria': {
			'Mätbara framgångskriterier för rollen': 'Vad ska personen ha åstadkommit efter 90 dagar?',
			'Kompetenser och erfarenheter som krävs': 'Vad är absolut kritiskt att kunna?',
			'Prestanda-indikatorer och mål': 'Hur mäter ni framgång efter 6 månader?',
			'Utvecklingspotential och tillväxt': 'Vart kan personen utvecklas?'
		},
		'resources-budget': {
			'Budget för rekrytering och onboarding': 'Vilken budget har ni?',
			'Tillgängliga interna resurser': 'Vad kan ni tilldela för onboarding?',
			'Externa partners och verktyg': 'Vilka system behöver personen kunna?',
			'Långsiktiga kostnader och investeringar': 'Vad kostar rollen första året?'
		},
		'organization-culture': {
			'Organisatorisk struktur och rapporteringslinjer': 'Var passar rollen in i organisationen?',
			'Kulturella värderingar och arbetsmiljö': 'Vad är viktigast för framgång?',
			'Teamdynamik och samarbetsmönster': 'Hur samarbetar personen med andra?',
			'Stöd och utvecklingsmöjligheter': 'Vad kan ni erbjuda för utveckling?'
		},
		'alternatives-risks': {
			'Alternativa lösningar till rekrytering': 'Vilka alternativ har ni övervägt?',
			'Identifierade risker och mitigeringar': 'Vad är de största riskerna?',
			'Fallback-planer och kontingenser': 'Vad händer om det inte fungerar?',
			'Långsiktiga konsekvenser av beslutet': 'Vad händer på längre sikt?'
		}
	};

	// Get the first missing info point and its corresponding question
	const firstMissing = missingInfo[0];
	const clusterQuestions = questionMap[clusterType];
	const specificQuestion = clusterQuestions[firstMissing];

	if (specificQuestion) {
		return specificQuestion;
	}

	// Fallback to encouraging follow-up
	return getEncouragingFollowUp(clusterType);
};

/**
 * Get encouraging follow-up questions when no specific missing info
 */
function getEncouragingFollowUp(clusterType: ClusterType): string {
	const encouragements: Record<ClusterType, string[]> = {
		'pain-point': [
			'Berätta mer om utmaningen.',
			'Vad är det största problemet?',
			'Hur påverkar det er dagliga arbete?'
		],
		'impact-urgency': [
			'Vad är mest kritiskt?',
			'Hur brådskande är det?',
			'Vad händer om ni väntar?'
		],
		'success-criteria': [
			'Vad betyder framgång för rollen?',
			'Vilka är era viktigaste mål?',
			'Hur vet ni att ni gjort rätt val?'
		],
		'resources-budget': [
			'Vilka resurser har ni?',
			'Hur ser budgeten ut?',
			'Vilka system behöver personen kunna?'
		],
		'organization-culture': [
			'Hur passar rollen in i er kultur?',
			'Vad är viktigt för framgång?',
			'Hur ser samarbetet ut mellan olika team?'
		],
		'alternatives-risks': [
			'Vilka alternativ har ni övervägt?',
			'Vilka risker ser ni?',
			'Hur hanterar ni utmaningar?'
		]
	};

	const clusterEncouragements = encouragements[clusterType] || ['Berätta mer om situationen.'];
	return clusterEncouragements[Math.floor(Math.random() * clusterEncouragements.length)];
}

/**
 * Determines if user can progress to next cluster
 * Requires minimum 5-6 exchanges and 85%+ confidence for thorough analysis
 */
// moved to progression.ts

/**
 * Generates smooth transition message between phases
 */
// moved to progression.ts

/**
 * Updates cluster progress based on message analysis
 */
export const updateClusterProgress = (
	currentProgress: ClusterProgress, 
	analysis: MessageAnalysis, 
	message: string
): ClusterProgress => {
	console.log(`🔍 CLUSTER ENGINE - updateClusterProgress called:`);
	console.log(`🔍 CLUSTER ENGINE - Current confidence: ${currentProgress.confidence}%`);
	console.log(`🔍 CLUSTER ENGINE - Analysis confidence: ${analysis.confidence}%`);
	console.log(`🔍 CLUSTER ENGINE - Current collected info: ${currentProgress.collectedInfo.length} items`);
	console.log(`🔍 CLUSTER ENGINE - New matched info: ${analysis.matchedInfo.length} items (${analysis.matchedInfo.join(', ')})`);
	
	const newCollectedInfo = [...currentProgress.collectedInfo];
	
	// Add new information points
	analysis.matchedInfo.forEach(info => {
		if (!newCollectedInfo.includes(info)) {
			newCollectedInfo.push(info);
			console.log(`🔍 CLUSTER ENGINE - Added new info point: ${info}`);
		} else {
			console.log(`🔍 CLUSTER ENGINE - Info point already collected: ${info}`);
		}
	});

	// Update confidence - use the latest analysis confidence for accurate scoring
	// This ensures the recalibrated scoring system works properly
	const newConfidence = analysis.confidence;
	console.log(`🔍 CLUSTER ENGINE - Confidence update: ${currentProgress.confidence}% → ${newConfidence}% (analysis: ${analysis.confidence}%)`);
	
	// Determine status
	let status = currentProgress.status;
	if (status === 'not-started' && newConfidence > 0) {
		status = 'in-progress';
		console.log(`🔍 CLUSTER ENGINE - Status changed to: in-progress`);
	}

	const result = {
		confidence: Math.min(newConfidence, 100),
		status,
		collectedInfo: newCollectedInfo
	};
	
	console.log(`🔍 CLUSTER ENGINE - Final progress result:`, result);
	return result;
};

/**
 * Extracts keywords from text for matching
 */
function extractKeywords(text: string): string[] {
	// Remove common words and extract meaningful terms
	const stopWords = ['och', 'eller', 'men', 'för', 'att', 'som', 'är', 'har', 'kan', 'ska', 'vilka', 'vad', 'hur', 'när', 'var', 'varför'];
	
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter(word => word.length > 2 && !stopWords.includes(word));
}

/**
 * Gets completion summary for a cluster
 */
// moved to progression.ts
