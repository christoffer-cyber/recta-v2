/*
  Deep conversation tests
  - Two realistic scenarios (CFO, Tech Lead)
  - 28-30 exchanges each across 6 phases
  - Tracks cumulative confidence and coverage
*/

import { analyzeMessage } from '@/lib/cluster-engine';
import { analyzeUniversalQuality } from '@/lib/quality-analysis';
import { detectRoleContext } from '@/lib/role-detection';
import { CLUSTERS, ClusterType, getClusterById } from '@/lib/clusters';
import type { RoleContext } from '@/lib/engine-types';

type Msg = { role: 'user'|'assistant'; content: string };

interface Scenario {
  id: string;
  title: string;
  roleHint: string;
  conversation: Msg[];
  phaseByTurn: ClusterType[]; // same length as conversation
}

function cumulativeReport(scenario: Scenario) {
  const messages: Msg[] = [];
  const roleContext: RoleContext = detectRoleContext(scenario.conversation);
  const infoCovered = new Set<string>();
  const phaseCompletion: Record<ClusterType, number> = {
    'pain-point': 0,
    'impact-urgency': 0,
    'success-criteria': 0,
    'resources-budget': 0,
    'organization-culture': 0,
    'alternatives-risks': 0
  };
  let cumulativeConfidence = 0;

  const lines: string[] = [];
  lines.push(`Scenario: ${scenario.title}`);
  lines.push(`Detected role: ${roleContext.role} (${roleContext.seniority}) / ${roleContext.department}`);
  lines.push('');

  for (let i = 0; i < scenario.conversation.length; i++) {
    const msg = scenario.conversation[i];
    messages.push(msg);
    if (msg.role !== 'user') continue; // analyze only user turns
    const phase = scenario.phaseByTurn[i] || 'pain-point';
    const currentCluster: ClusterType = phase;

    const analysis = analyzeMessage(msg.content, currentCluster, roleContext);
    const qa = analyzeUniversalQuality(msg.content, msg.content.toLowerCase());

    // Incremental accumulation heuristic mirroring server logic
    const noveltyFactor = Math.max(1, qa.categoriesCovered);
    const incremental = Math.round(Math.min(15, (analysis.confidence / 3) + (noveltyFactor * 1.5)));
    cumulativeConfidence = Math.min(85, cumulativeConfidence + incremental);

    // Track info coverage via cluster requiredInfo
    const clusterDef = getClusterById(currentCluster);
    if (clusterDef) {
      analysis.matchedInfo.forEach(p => infoCovered.add(`${currentCluster}:${p}`));
      const coveredRatio = Math.min(100, Math.round((analysis.matchedInfo.length / Math.max(1, clusterDef.requiredInfo.length)) * 100));
      phaseCompletion[currentCluster] = Math.max(phaseCompletion[currentCluster], coveredRatio);
    }

    lines.push(`Turn ${i+1} [${currentCluster}]`);
    lines.push(`- User: ${msg.content}`);
    lines.push(`- CategoriesCovered: ${qa.categoriesCovered}/6 (spec:${qa.specificity} quant:${qa.quantification} ctx:${qa.context} caus:${qa.causality} impact:${qa.businessImpact} time:${qa.timingContext})`);
    lines.push(`- Matched info: ${analysis.matchedInfo.join(', ') || '-'}`);
    lines.push(`- Incremental +${incremental} → Cumulative ${cumulativeConfidence}%`);
    lines.push('');
  }

  const totalInfoPoints = CLUSTERS.reduce((sum, c) => sum + c.requiredInfo.length, 0);
  const coveredCount = infoCovered.size;

  lines.push('=== Summary ===');
  lines.push(`Info coverage: ${coveredCount}/${totalInfoPoints} (${Math.round((coveredCount/totalInfoPoints)*100)}%)`);
  lines.push(`Final cumulative confidence: ${cumulativeConfidence}%`);
  lines.push(`Phase completion:`);
  (Object.keys(phaseCompletion) as ClusterType[]).forEach(ph => {
    lines.push(`- ${ph}: ${phaseCompletion[ph]}%`);
  });

  const success = cumulativeConfidence >= 70 && coveredCount >= Math.round(totalInfoPoints*0.73) && (Object.values(phaseCompletion).every(v => v >= 65));
  lines.push('');
  lines.push(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`);

  return lines.join('\n');
}

function buildScenarioA(): Scenario {
  // CFO: 30 exchanges (approx) across phases
  const convo: Msg[] = [];
  const phase: ClusterType[] = [];

  // Phase 1: Problem (turns 1-5)
  convo.push({ role:'user', content: 'Vi saknar CFO. Våra rapporter är försenade och vi har bara en redovisningsekonom idag.'}); phase.push('pain-point');
  convo.push({ role:'assistant', content: 'Vad saknas specifikt idag?'}); phase.push('pain-point');
  convo.push({ role:'user', content: 'Vi klarar inte IFRS och konsolidering. VDn och styrelsen är oroliga.'}); phase.push('pain-point');
  convo.push({ role:'assistant', content: 'Har ni försökt lösa detta tidigare?'}); phase.push('pain-point');
  convo.push({ role:'user', content: 'Vi tog in konsult i två månader, kostade 500k/månad utan varaktig lösning.'}); phase.push('pain-point');

  // Phase 2: Impact (turns 6-10)
  convo.push({ role:'assistant', content: 'Hur påverkar detta verksamheten?'}); phase.push('impact-urgency');
  convo.push({ role:'user', content: 'Series B försenad 3 månader, två investerare tvekar. Kassaflödet har blivit svajigt.'}); phase.push('impact-urgency');
  convo.push({ role:'assistant', content: 'Hur brådskande är detta?'}); phase.push('impact-urgency');
  convo.push({ role:'user', content: 'Vi behöver stabil rapportering inom 3 månader, annars risk för tvingad omstrukturering.'}); phase.push('impact-urgency');
  convo.push({ role:'user', content: 'Vi har missat två större affärer pga bristande rapportering.'}); phase.push('impact-urgency');

  // Phase 3: Success (turns 11-15)
  convo.push({ role:'assistant', content: 'Hur ser framgång ut?'}); phase.push('success-criteria');
  convo.push({ role:'user', content: 'Månadsbokslut inom 5 dagar, IFRS-säker rapportering, 12-månaders rullande forecast med ±5% precision.'}); phase.push('success-criteria');
  convo.push({ role:'assistant', content: 'Vilka KPI:er vill ni följa?'}); phase.push('success-criteria');
  convo.push({ role:'user', content: 'Bruttomarginal, burn rate, kassalikviditet, DSO. '}); phase.push('success-criteria');
  convo.push({ role:'user', content: 'CFO ska leda budgetprocessen och äga investerarrelationer.'}); phase.push('success-criteria');

  // Phase 4: Resources (turns 16-20)
  convo.push({ role:'assistant', content: 'Budget och godkännande?'}); phase.push('resources-budget');
  convo.push({ role:'user', content: 'Total komp 1.6–2.0 MSEK, sign-on möjligt. Styrelsen måste godkänna.'}); phase.push('resources-budget');
  convo.push({ role:'assistant', content: 'Teamkapacitet?'}); phase.push('resources-budget');
  convo.push({ role:'user', content: 'Vi behöver bygga upp ett litet finans-team: controller + redovisning + BI-analytiker.'}); phase.push('resources-budget');
  convo.push({ role:'user', content: 'System: byta till NetSuite och införa bättre BI-stack.'}); phase.push('resources-budget');

  // Phase 5: Organization (turns 21-25)
  convo.push({ role:'assistant', content: 'Kultur och rapportering?'}); phase.push('organization-culture');
  convo.push({ role:'user', content: 'Snabbfotad, datadriven kultur. CFO rapporterar till VD, nära styrelse och investerare.'}); phase.push('organization-culture');
  convo.push({ role:'assistant', content: 'Teamstruktur?'}); phase.push('organization-culture');
  convo.push({ role:'user', content: 'CFO leder 4-6 personer initialt, bygger upp funktion i takt med tillväxt.'}); phase.push('organization-culture');
  convo.push({ role:'user', content: 'Vi vill ha någon som kan bygga struktur utan att bromsa affären.'}); phase.push('organization-culture');

  // Phase 6: Alternatives (turns 26-30)
  convo.push({ role:'assistant', content: 'Alternativ övervägda?'}); phase.push('alternatives-risks');
  convo.push({ role:'user', content: 'Interim CFO, men vi tror en permanent är nödvändig för investerarnas förtroende.'}); phase.push('alternatives-risks');
  convo.push({ role:'assistant', content: 'Risker?'}); phase.push('alternatives-risks');
  convo.push({ role:'user', content: 'Felrekrytering försenar finansiering och riskerar ytterligare kundtapp.'}); phase.push('alternatives-risks');
  convo.push({ role:'user', content: 'Största risken är att vi inte hinner till Q4 med IFRS och forecast.'}); phase.push('alternatives-risks');

  return { id:'deep_cfo', title:'CFO Recruitment (Scale-up)', roleHint:'cfo', conversation:convo, phaseByTurn:phase };
}

function buildScenarioB(): Scenario {
  // Tech Lead: 28 exchanges across phases
  const convo: Msg[] = [];
  const phase: ClusterType[] = [];

  // Phase 1: Problem (1-5)
  convo.push({ role:'user', content:'Vi behöver en Tech Lead. Vårt system lider av teknisk skuld och skalbarhetsproblem.'}); phase.push('pain-point');
  convo.push({ role:'assistant', content:'Vilka delar är mest påverkade?'}); phase.push('pain-point');
  convo.push({ role:'user', content:'Databasen blir flaskhals under peak. Vi saknar senior arkitekturkompetens.'}); phase.push('pain-point');
  convo.push({ role:'assistant', content:'Root cause?'}); phase.push('pain-point');
  convo.push({ role:'user', content:'Snabba leveranser utan riktlinjer. Monolit med spagettikod.'}); phase.push('pain-point');

  // Phase 2: Impact (6-10)
  convo.push({ role:'assistant', content:'Konsekvenser?'}); phase.push('impact-urgency');
  convo.push({ role:'user', content:'Incidenter varje vecka, downtime 2–3h/mån. Två enterprise-kunder klagar.'}); phase.push('impact-urgency');
  convo.push({ role:'assistant', content:'Tidsram?'}); phase.push('impact-urgency');
  convo.push({ role:'user', content:'Behöver stabilitet inom 4 månader, annars risk att tappa största kunden.'}); phase.push('impact-urgency');
  convo.push({ role:'user', content:'Churn ökat 3%, NPS ner 12 punkter.'}); phase.push('impact-urgency');

  // Phase 3: Success (11-15)
  convo.push({ role:'assistant', content:'Hur ser framgång ut?'}); phase.push('success-criteria');
  convo.push({ role:'user', content:'SLA 99.95%, time-to-recover < 30 min, tydlig tech roadmap.'}); phase.push('success-criteria');
  convo.push({ role:'assistant', content:'KPI:er?'}); phase.push('success-criteria');
  convo.push({ role:'user', content:'MTTR, error budget burn, change fail rate, throughput.'}); phase.push('success-criteria');
  convo.push({ role:'user', content:'Mentorskap, code standards, DevEx förbättringar.'}); phase.push('success-criteria');

  // Phase 4: Resources (16-20)
  convo.push({ role:'assistant', content:'Budget och team?'}); phase.push('resources-budget');
  convo.push({ role:'user', content:'Total komp 1.2–1.6 MSEK, team till 10 devs. Investera i observability och CI/CD.'}); phase.push('resources-budget');
  convo.push({ role:'assistant', content:'System/verktyg?'}); phase.push('resources-budget');
  convo.push({ role:'user', content:'Kubernetes, Postgres sharding, feature flags, SLO-drivet arbetssätt.'}); phase.push('resources-budget');
  convo.push({ role:'user', content:'Behöver sektionera monoliten mot modulär arkitektur.'}); phase.push('resources-budget');

  // Phase 5: Organization (21-25)
  convo.push({ role:'assistant', content:'Organisation och rapportering?'}); phase.push('organization-culture');
  convo.push({ role:'user', content:'Rapporterar till CTO. Kulturellt: pragmatisk, lärande, kvalitet över hastighet.'}); phase.push('organization-culture');
  convo.push({ role:'assistant', content:'Teamstruktur?'}); phase.push('organization-culture');
  convo.push({ role:'user', content:'Två squads nu, tre planerade. Lead ansvarar för arkitektur och leverans.'}); phase.push('organization-culture');
  convo.push({ role:'user', content:'Samarbete med produkt och support är kritiskt.'}); phase.push('organization-culture');

  // Phase 6: Alternatives (26-28)
  convo.push({ role:'assistant', content:'Alternativ?'}); phase.push('alternatives-risks');
  convo.push({ role:'user', content:'Konsulter övervägda men vill äga kompetensen internt.'}); phase.push('alternatives-risks');
  convo.push({ role:'user', content:'Största risken är att vi underinvesterar och accelererar skulden.'}); phase.push('alternatives-risks');

  return { id:'deep_techlead', title:'Tech Lead Recruitment (Scale & Debt)', roleHint:'tech', conversation:convo, phaseByTurn:phase };
}

async function main() {
  const scenarios = [buildScenarioA(), buildScenarioB()];
  for (const sc of scenarios) {
    const report = cumulativeReport(sc);
    console.log('\n\n' + report + '\n');
  }
}

main();


