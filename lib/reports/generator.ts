// server-only
import { chatWithClaude } from '@/lib/claude-client';
import { RoleContext } from '@/lib/engine-types';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface RecruitmentReport {
  report: string;
  timestamp: string;
  phase: number;
  roleContext: RoleContext;
}

export async function generateRecruitmentReport(
  conversationHistory: Message[],
  roleContext: RoleContext,
  currentPhase: number
): Promise<RecruitmentReport> {
  const prompt = `Analyze this recruitment conversation and generate a strategic report.

Conversation (${conversationHistory.length} exchanges):
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Role: ${roleContext.role} (${roleContext.seniority})
Phases completed: ${currentPhase}/6

Generate report with:

# Executive Summary
Core challenge, urgency, key stakeholders (2-3 sentences)

# Problem Analysis
Specific issues identified, business impact, who's affected

# Success Criteria & Timeline
Measurable outcomes, expectations, deadlines

# Resource Assessment
Budget, organizational readiness, constraints

# Organizational Context
Team structure, culture, reporting relationships

# Strategic Recommendation
Should they recruit? Alternatives considered? Key risks?

# Information Gaps
**Critical missing information that would strengthen this analysis:**
- List specific questions that remain unanswered
- Prioritize by importance (High/Medium/Low)
- Suggest follow-up questions for each gap

# Next Steps
3-5 concrete actions with owners

IMPORTANT: Base only on actual conversation content. Be explicit about gaps. If early in conversation, say so.`;

  try {
    const result = await chatWithClaude(
      [{ role: 'user', content: prompt, timestamp: new Date().toISOString() } as any],
      'Generate a comprehensive recruitment analysis report based on the conversation provided.',
      { timeoutMs: 4000 }
    );

    return {
      report: result.text,
      timestamp: new Date().toISOString(),
      phase: currentPhase,
      roleContext
    };
  } catch (error) {
    console.error('Failed to generate recruitment report:', error);
    throw new Error('Failed to generate report. Please try again.');
  }
}

export function extractInformationGaps(report: string): Array<{
  priority: 'High' | 'Medium' | 'Low';
  question: string;
  suggestedFollowUp: string;
}> {
  const gaps: Array<{
    priority: 'High' | 'Medium' | 'Low';
    question: string;
    suggestedFollowUp: string;
  }> = [];

  // Extract gaps from the Information Gaps section
  const gapsSection = report.match(/# Information Gaps[\s\S]*?(?=# |$)/i);
  if (!gapsSection) return gaps;

  const gapsText = gapsSection[0];
  const lines = gapsText.split('\n').filter(line => line.trim());

  let currentGap: any = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for priority markers
    if (trimmed.includes('High') || trimmed.includes('HIGH')) {
      currentGap = { priority: 'High' as const, question: '', suggestedFollowUp: '' };
    } else if (trimmed.includes('Medium') || trimmed.includes('MEDIUM')) {
      currentGap = { priority: 'Medium' as const, question: '', suggestedFollowUp: '' };
    } else if (trimmed.includes('Low') || trimmed.includes('LOW')) {
      currentGap = { priority: 'Low' as const, question: '', suggestedFollowUp: '' };
    }
    
    // Check for bullet points or dashes (questions)
    if (trimmed.match(/^[-•*]\s/) && currentGap) {
      currentGap.question = trimmed.replace(/^[-•*]\s*/, '');
    }
    
    // Check for follow-up suggestions
    if (trimmed.toLowerCase().includes('suggest') && currentGap) {
      currentGap.suggestedFollowUp = trimmed;
    }
    
    // If we have both question and follow-up, add to gaps
    if (currentGap && currentGap.question && currentGap.suggestedFollowUp) {
      gaps.push(currentGap);
      currentGap = null;
    }
  }

  return gaps;
}

export function getReportPhaseStatus(currentPhase: number): {
  isDraft: boolean;
  canGenerate: boolean;
  buttonLabel: string;
} {
  const canGenerate = currentPhase >= 2;
  const isDraft = currentPhase < 6;
  
  return {
    isDraft,
    canGenerate,
    buttonLabel: isDraft ? 'Generate Draft Report' : 'Generate Final Report'
  };
}
