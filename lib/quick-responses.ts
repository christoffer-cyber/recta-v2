import { ClusterType } from './clusters';
import { ConversationMessage, RoleContext } from './engine-types';
import { chatWithClaude } from './claude-client';

export const generateQuickResponseSuggestions = async (
	roleContext: RoleContext,
	currentCluster: ClusterType,
	lastQuestion: string,
	conversationHistory: ConversationMessage[]
): Promise<string[]> => {
    const lowerQ = (lastQuestion || '').toLowerCase();

    // Build and log a role-aware prompt (for future LLM usage)
    const recentTurns = conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `You are helping generate quick-response suggestions for a ${roleContext.role} (${roleContext.seniority}) recruitment conversation.\n\nThe EXACT question just asked was:\n'${lastQuestion}'\n\nRole context: ${roleContext.role}, ${roleContext.seniority}, ${roleContext.department}\n\nPrevious conversation context:\n${recentTurns}\n\nGenerate 3 short (under 10 words) response options that:\n1. DIRECTLY ANSWER the specific question: '${lastQuestion}'\n2. Are appropriate for a ${roleContext.role} recruitment context\n3. Reflect realistic challenges for this role level\n\nExamples for CFO:\n- If asked about actions: "Försökt förbättra forecasting", "Anlitat interim konsult"\n- If asked about consequences: "Förlorade två investerare", "Board försenade beslut"\n\nReturn only 3 suggestions, one per line, no formatting.`;
    console.log('🔍 QUICK RESPONSES - roleContext:', roleContext);
    console.log('🔍 QUICK RESPONSES - currentCluster:', currentCluster);
    console.log('🔍 QUICK RESPONSES - lastQuestion:', lastQuestion);
    console.log('🔍 QUICK RESPONSES - recentTurns:', recentTurns);
	console.log('🔍 QUICK RESPONSE PROMPT:', fullPrompt);

	// Try LLM (Haiku/Sonnet) generation with 1.5s timeout and fallback to heuristics
    try {
        // Small in-memory cache by question hash to reduce repeated calls
        const key = `qr:${roleContext.role}:${currentCluster}:${lastQuestion.trim().toLowerCase()}`;
        const now = Date.now();
        const cached = (global as any).__QR_CACHE__?.[key];
        if (cached && (now - cached.t) < 5 * 60 * 1000) {
            console.log('🔍 QUICK RESPONSES - Using cached LLM result for key:', key);
            const lines = (cached.text as string).split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
            const cleaned = lines.map((l: string) => l.replace(/^[-*\d\.\)\s]+/, '')).filter((l: string) => l.length > 0 && l.length <= 80).slice(0, 3);
            if (cleaned.length >= 2) {
                console.log('🔍 FINAL QUICK RESPONSES (llm, cached):', cleaned);
                return cleaned;
            }
        }

        const userOnly = [{ role: 'user' as const, content: fullPrompt, timestamp: new Date().toISOString() }];
        const llmPromise = chatWithClaude(userOnly, 'You generate quick-response options per the user content.', { model: process.env.CLAUDE_HAIKU_MODEL || 'claude-3-haiku-20240307', timeoutMs: 2500 });
        const withShortTimeout = new Promise<import('./claude-client').ClaudeChatResult>((resolve, reject) => {
            const id = setTimeout(() => reject(new Error('LLM quick-responses timeout after 2500ms')), 2500);
            llmPromise.then(res => { clearTimeout(id); resolve(res); }).catch(err => { clearTimeout(id); reject(err); });
        });
        const llmResult = await withShortTimeout;
		const raw = llmResult.text || '';
		console.log('🔍 HAIKU RAW RESPONSE:', raw);
		const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
		// Keep first 3 short answers, strip bullets/numbering
		const cleaned = lines
			.map(l => l.replace(/^[-*\d\.\)\s]+/, ''))
			.filter(l => l.length > 0 && l.length <= 80)
			.slice(0, 3);
        // Save to cache
        try {
            (global as any).__QR_CACHE__ = (global as any).__QR_CACHE__ || {};
            (global as any).__QR_CACHE__[key] = { t: now, text: raw };
        } catch {}
		if (cleaned.length >= 2) {
			console.log('🔍 FINAL QUICK RESPONSES (llm):', cleaned);
			return cleaned;
		}
		console.log('🔍 QUICK RESPONSES - LLM returned insufficient lines, falling back');
	} catch (err: any) {
		console.warn('⚠️ QUICK RESPONSES - LLM generation failed/timeout, using heuristics:', err?.message || err);
	}

	// Heuristic question intent detection
	const intent = {
		consequences: /(konsekven|vad hände|vilka följder|utfall|resultat)/.test(lowerQ),
		quantification: /(hur mycket|hur många|belopp|kronor|procent|€|kr|%)/.test(lowerQ),
		timing: /(när|tidsram|hur länge|månad|vecka|kvartal|år)/.test(lowerQ),
		stakeholders: /(vilka|vem|vilka kunder|investerare|styrelsen|team|leverantörer)/.test(lowerQ),
		actions: /(hur hanterade|vad gjorde ni|vilka åtgärder)/.test(lowerQ)
	};

	// Context-aware templates that directly answer the asked question
	const contextualTemplates: Record<string, Record<string, string[]>> = {
		'pain-point': {
			'cfo': [
				'Vi förlorade två stora kunder.',
				'Kassaflödet blev kaotiskt i 6 månader.',
				'Investerare försenade Series B med ett kvartal.'
			],
			'tech': [
				'Två produktlanseringar sköts upp.',
				'Teamets hastighet sjönk cirka 30%.',
				'Två seniora utvecklare lämnade teamet.'
			],
			'sales': [
				'Vi tappade tre enterprise-affärer.',
				'Pipeline-konverteringen föll från 22% till 14%.',
				'Två nyckelkunder valde konkurrent.'
			],
			'operations': [
				'Leveransprecisionen föll under 90%.',
				'Tre större kunder eskalerade kvalitetsärenden.',
				'Vi behövde pausa nykundsintag i 4 veckor.'
			],
			'marketing': [
				'Vår organiska trafik minskade ~20% på 3 månader.',
				'Två kampanjer fick pausas p.g.a. brist på ledning.',
				'Varumärkes-NPS föll 8 punkter i senaste mätningen.'
			],
			'hr': [
				'Frivillig churn ökade från 10% till 18%.',
				'Tre nyckelrekryteringar försenades >60 dagar.',
				'Två team rapporterade tydlig kulturförsämring.'
			]
		}
	};

	// If the question asks for consequences/effects, answer with concrete outcomes
	if (intent.consequences) {
		const roleSet = contextualTemplates[currentCluster]?.[roleContext.role] || contextualTemplates['pain-point']?.[roleContext.role];
		if (roleSet) {
			const selectedSuggestions = roleSet.slice(0, 3);
			console.log('🔍 FINAL QUICK RESPONSES (consequences):', selectedSuggestions);
			return selectedSuggestions;
        }
	}

	// If the question asks for quantification, produce numeric-tailored answers
	if (intent.quantification) {
		const byRole: Record<string, string[]> = {
			'cfo': ['~2–3 MSEK påverkan per kvartal','Rapporter försenade 4–6 veckor','Bruttomarginal -2 p.p. sedan Q2'],
			'tech': ['~30% lägre velocity i 2 sprintar','Buggtakten ökade ~25%','2 planerade releaser försenade'],
			'sales': ['Pipeline -20% QoQ','Win-rate föll från 22% → 15%','Genomsnittlig säljcykel +3 veckor'],
			'operations': ['OTD föll till 88% i två månader','Felprocent +1.5 p.p.','Kundärenden +30% volym'],
			'marketing': ['MQL -18% under Q3','CAC +12% under sommaren','NPS -6p senaste mätning'],
			'hr': ['Time-to-hire +25 dagar','Churn +6 p.p. i Q2','Kandidatinflöde -15%']
		};
		const selectedSuggestions = (byRole[roleContext.role] || byRole['cfo']).slice(0, 3);
		console.log('🔍 FINAL QUICK RESPONSES (quantification):', selectedSuggestions);
		return selectedSuggestions;
	}

	// If the question asks for actions/how handled, give action-focused answers
	if (intent.actions) {
		const byRole: Record<string, string[]> = {
			'cfo': ['Vi införde veckovisa kassaflödesprognoser','Vi hyrde in interim CFO i 8 veckor','Vi standardiserade månadsstängning'],
			'tech': ['Vi frös nya features i två sprintar','Vi skapade en skuld-backlog med SLA','Vi tillsatte tech lead i interim'],
			'sales': ['Vi renodlade ICP och stängde icke-core','Vi införde deal-reviews veckovis','Vi omfördelade konton efter kapacitet'],
			'operations': ['Vi körde 8D-rotorsaksanalys','Vi kortade batchstorlekar','Vi dubblerade QA i två veckor'],
			'marketing': ['Vi stoppade låg-ROI-kampanjer','Vi fokuserade på 2 kanaler','Vi uppdaterade budskap mot ICP'],
			'hr': ['Vi prioriterade kritiska roller','Vi förbättrade referral-programmet','Vi stramade upp intervjuprocessen']
		};
		const selectedSuggestions = (byRole[roleContext.role] || byRole['cfo']).slice(0, 3);
		console.log('🔍 FINAL QUICK RESPONSES (actions):', selectedSuggestions);
		return selectedSuggestions;
	}

	// Fall back to previous role/cluster generic suggestions (but trimmed to be outcome-oriented)
	const suggestions: Record<string, Record<string, string[]>> = {
		'pain-point': {
			'cfo': ['Vi förlorar viktiga investerare','Styrelsen är orolig','Vi missar affärsmöjligheter','Banken hotar med att dra tillbaka kredit','Vi kan inte fatta snabba beslut'],
			'tech': ['Vi förlorar viktiga kunder','Teamet börjar tvivla','Konkurrenter tar marknadsandelar','Vi missar produktlanseringar','Utvecklare börjar leta nya jobb'],
			'sales': ['Vi förlorar viktiga kunder','Säljteamet är demoraliserat','Konkurrenter tar marknadsandelar','Vi missar försäljningsmål','Säljare börjar leta nya jobb'],
			'operations': ['Vi förlorar viktiga kunder','Teamet är överbelastat','Kvaliteten sjunker','Vi missar leveransdeadlines','Medarbetare börjar leta nya jobb'],
			'marketing': ['Vi förlorar marknadsandelar','Teamet saknar riktning','Konkurrenter tar över','Vi missar tillväxtmöjligheter','Marknadsförare börjar leta nya jobb'],
			'hr': ['Vi förlorar viktiga talanger','Teamet är demoraliserat','Kulturen försämras','Vi missar rekryteringsmål','HR-medarbetare börjar leta nya jobb']
		},
		'impact-urgency': {
			'cfo': ['Vi förlorar 2-3 miljoner per månad','Investerare hotar att dra sig ur','Vi missar nästa finansieringsrunda','Banken kräver förskottsbetalning','Vi kan inte växa som planerat'],
			'tech': ['Vi förlorar 30% av produktionshastigheten','Kunder hotar att avsluta kontrakt','Vi missar produktlanseringar','Konkurrenter tar över marknaden','Vi kan inte leverera nya funktioner'],
			'sales': ['Vi förlorar 25% av omsättningen','Kunder hotar att byta leverantör','Vi missar försäljningsmål','Konkurrenter tar över kunder','Vi kan inte växa som planerat'],
			'operations': ['Vi förlorar 20% av kapaciteten','Kunder hotar att avsluta kontrakt','Vi missar leveransdeadlines','Kvaliteten sjunker drastiskt','Vi kan inte hantera tillväxten'],
			'marketing': ['Vi förlorar 15% av marknadsandelen','Kunder börjar välja konkurrenter','Vi missar tillväxtmöjligheter','Varumärket försvagas','Vi kan inte konkurrera effektivt'],
			'hr': ['Vi förlorar 20% av produktiviteten','Talanger börjar lämna företaget','Vi missar rekryteringsmål','Kulturen försämras snabbt','Vi kan inte bygga teamet']
		}
	};

	const clusterSuggestions = suggestions[currentCluster] || {};
	const roleSuggestions = clusterSuggestions[roleContext.role] || clusterSuggestions['default'] || [
		'Vi förlorar viktiga kunder','Teamet börjar tvivla','Konkurrenter tar marknadsandelar'
	];

	const shuffled = roleSuggestions.sort(() => 0.5 - Math.random());
	const finalSuggestions = shuffled.slice(0, 3);
	console.log('🔍 FINAL QUICK RESPONSES (fallback):', finalSuggestions);
	return finalSuggestions;
};


