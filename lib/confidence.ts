import { ClusterType, getClusterById } from './clusters';
import { RoleContext } from './engine-types';
import { UniversalQualityAnalysis } from './quality-analysis';

export interface RoleWeights {
	specificity: number;
	quantification: number;
	context: number;
	causality: number;
	businessImpact: number;
	timingContext: number;
}

export const ROLE_WEIGHTS: Record<string, RoleWeights> = {
	'cfo': { specificity: 1.2, quantification: 1.5, context: 1.0, causality: 1.1, businessImpact: 1.4, timingContext: 1.2 },
	'finance': { specificity: 1.1, quantification: 1.4, context: 1.0, causality: 1.0, businessImpact: 1.3, timingContext: 1.1 },
	'controller': { specificity: 1.2, quantification: 1.3, context: 1.0, causality: 1.0, businessImpact: 1.2, timingContext: 1.0 },
	'tech': { specificity: 1.3, quantification: 1.0, context: 1.2, causality: 1.1, businessImpact: 1.0, timingContext: 1.1 },
	'developer': { specificity: 1.4, quantification: 0.9, context: 1.1, causality: 1.0, businessImpact: 0.9, timingContext: 1.0 },
	'engineer': { specificity: 1.3, quantification: 0.9, context: 1.1, causality: 1.0, businessImpact: 0.9, timingContext: 1.0 },
	'tech-lead': { specificity: 1.2, quantification: 1.0, context: 1.3, causality: 1.2, businessImpact: 1.1, timingContext: 1.1 },
	'cto': { specificity: 1.1, quantification: 1.1, context: 1.4, causality: 1.3, businessImpact: 1.2, timingContext: 1.2 },
	'sales': { specificity: 1.1, quantification: 1.2, context: 1.1, causality: 1.2, businessImpact: 1.3, timingContext: 1.3 },
	'sales-manager': { specificity: 1.0, quantification: 1.3, context: 1.2, causality: 1.3, businessImpact: 1.4, timingContext: 1.2 },
	'account-manager': { specificity: 1.0, quantification: 1.2, context: 1.1, causality: 1.2, businessImpact: 1.3, timingContext: 1.1 },
	'cmo': { specificity: 1.0, quantification: 1.1, context: 1.3, causality: 1.2, businessImpact: 1.3, timingContext: 1.2 },
	'operations': { specificity: 1.2, quantification: 1.1, context: 1.1, causality: 1.1, businessImpact: 1.1, timingContext: 1.0 },
	'operations-manager': { specificity: 1.1, quantification: 1.2, context: 1.2, causality: 1.2, businessImpact: 1.2, timingContext: 1.1 },
	'coo': { specificity: 1.0, quantification: 1.1, context: 1.3, causality: 1.3, businessImpact: 1.3, timingContext: 1.2 },
	'marketing': { specificity: 1.0, quantification: 1.1, context: 1.3, causality: 1.1, businessImpact: 1.2, timingContext: 1.1 },
	'marketing-manager': { specificity: 1.0, quantification: 1.2, context: 1.2, causality: 1.2, businessImpact: 1.3, timingContext: 1.1 },
	'hr': { specificity: 1.0, quantification: 1.0, context: 1.2, causality: 1.0, businessImpact: 1.1, timingContext: 1.0 },
	'hr-manager': { specificity: 1.0, quantification: 1.1, context: 1.3, causality: 1.1, businessImpact: 1.2, timingContext: 1.0 },
	'chro': { specificity: 1.0, quantification: 1.0, context: 1.4, causality: 1.2, businessImpact: 1.3, timingContext: 1.1 },
	'default': { specificity: 1.0, quantification: 1.0, context: 1.0, causality: 1.0, businessImpact: 1.0, timingContext: 1.0 }
};

export const ROLE_COMPLETION_THRESHOLDS: Record<string, Record<string, number>> = {
	'junior': { 'finance': 60, 'tech': 55, 'sales': 65, 'operations': 60, 'marketing': 60, 'hr': 55, 'general': 60 },
	'mid': { 'finance': 70, 'tech': 65, 'sales': 75, 'operations': 70, 'marketing': 70, 'hr': 65, 'general': 70 },
	'senior': { 'finance': 75, 'tech': 70, 'sales': 80, 'operations': 75, 'marketing': 75, 'hr': 70, 'general': 75 },
	'executive': { 'finance': 80, 'tech': 75, 'sales': 85, 'operations': 80, 'marketing': 80, 'hr': 75, 'general': 80 }
};

export const calculateRoleSpecificConfidence = (
	analysis: UniversalQualityAnalysis,
	roleContext: RoleContext,
	matchedInfoCount: number
): number => {
	const weights = ROLE_WEIGHTS[roleContext.role] || ROLE_WEIGHTS.default;
	let confidence = 0;
	confidence += analysis.categoriesCovered * 4;
	confidence += analysis.specificity * 2 * weights.specificity;
	confidence += analysis.quantification * 2 * weights.quantification;
	confidence += analysis.context * 2 * weights.context;
	confidence += analysis.causality * 2 * weights.causality;
	if (analysis.businessImpact) confidence += 3 * weights.businessImpact;
	if (analysis.timingContext) confidence += 3 * weights.timingContext;
	const threshold = ROLE_COMPLETION_THRESHOLDS[roleContext.seniority][roleContext.department] || 70;
	confidence = Math.min(confidence, threshold);
	return Math.max(confidence, 0);
};

export function calculateUniversalConfidence(analysis: UniversalQualityAnalysis, matchedInfoCount: number): number {
	let confidence = 0;
	confidence += analysis.categoriesCovered * 4;
	confidence += analysis.specificity * 2;
	confidence += analysis.quantification * 2;
	confidence += analysis.context * 2;
	confidence += analysis.causality * 2;
	if (analysis.businessImpact) confidence += 3;
	if (analysis.timingContext) confidence += 3;
	if (analysis.categoriesCovered <= 2) confidence = Math.min(confidence, 30);
	else if (analysis.categoriesCovered === 3) confidence = Math.min(confidence, 50);
	else if (analysis.categoriesCovered >= 4) confidence = Math.min(confidence, 75);
	if (analysis.businessImpact && analysis.timingContext) confidence = Math.min(confidence, 85);
	else confidence = Math.min(confidence, 75);
	confidence = Math.min(confidence, 80);
	return Math.max(confidence, 0);
}


