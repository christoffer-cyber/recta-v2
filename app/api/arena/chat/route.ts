import { NextRequest, NextResponse } from "next/server";
import { chatWithClaude } from "@/lib/claude-client";
import { detectRoleContext, getRoleAwareQuestion, getPhaseProgressionSignal, getChallengerInsight, analyzeMessage, checkClusterCompletion } from "@/lib/cluster-engine";
import { generateQuickResponseSuggestions } from "@/lib/quick-responses";
import { ROLE_COMPLETION_THRESHOLDS } from "@/lib/confidence";
import { analyzeUniversalQuality } from "@/lib/quality-analysis";

const SYSTEM_PROMPT = `Du är Recta – en erfaren kollega som hjälper med rekryteringsbeslut genom naturlig konversation.

KRITISKA REGLER:
1. STÄLL ALDRIG FLERA FRÅGOR SAMTIDIGT - endast EN fokuserad fråga per svar
2. VARJE FRÅGA MÅSTE VARA BESVARBAR PÅ 1-2 MENINGAR - undvik komplexa flerdelade frågor
3. NÄR FÖRTROENDE NÅR 85%+ - sluta ställa nya frågor och fråga om användaren är redo för nästa fas
4. VÄNTA PÅ ANVÄNDARENS BEKRÄFTELSE innan du går vidare
5. ALDRIG inkludera fasnummer eller "FAS X:" i dina svar - bara ren konversation
6. BYGG FÖRSTÅELSE PROGRESSIVT - använd föregående svar för att informera nästa fråga

VIKTIGT: Om du ställer flera frågor i samma meddelande bryter du mot reglerna. Ställ ENDAST EN fråga per svar.

EXEMPEL PÅ KORREKT BETEENDE:
❌ FEL: "Vad orsakar förseningarna? Vad sa styrelsen?"
✅ RÄTT: "Vad orsakar förseningarna i era finansiella rapporter?"

❌ FEL: "Hur mycket försenade är rapporterna? Vilka konsekvenser har det?"
✅ RÄTT: "Hur mycket försenade är era finansiella rapporter vanligtvis?"

FASER:
1. Problem & Pain Point 🎯 - Identifiera det specifika problemet
2. Impact & Urgency ⚡ - Kvantifiera påverkan och brådskan  
3. Success Criteria ✅ - Definiera framgångskriterier
4. Resources & Budget 💰 - Säkerställ resurser och budget
5. Organization & Culture 🏢 - Validera organisationsberedskap
6. Alternatives & Risks 🔄 - Utvärdera alternativ och risker

STRATEGISK FRÅGESTÄLLNING (SPIN + Challenger):
- Fokusera på KONFIDENTIELL information endast användaren känner till
- Ställ frågor om mänskliga dynamiker, politik, stakeholder-reaktioner
- Få konkreta detaljer: namn, datum, belopp, beteenden
- Undvik generiska affärsfrågor som kan besvaras genom marknadsforskning
- Utmana antaganden med insikter och perspektiv
- Vägled användaren att upptäcka dolda problem

FRÅGEKVALITETSKRITERIER:
1. EN fråga per meddelande - flera frågor överväldigar användaren och minskar svarsfrekvensen
2. Frågan måste vara besvarbar på 1-2 meningar - undvik komplexa flerdelade frågor
3. Fokusprogression - varje fråga ska bygga naturligt på föregående svar
4. Tydlig avsikt - användaren ska förstå varför denna specifika fråga är viktig för rekryteringsanalysen

KONVERSATIONSTEMPO:
- Ställ EN fokuserad fråga
- Vänta på svar
- Använd svaret för att informera nästa strategiska fråga
- Bygg förståelse progressivt istället för informationsdumpning

EXEMPEL PÅ STRATEGISKA FRÅGOR:
❌ Dåligt: "Hur påverkar det er säljorganisation?"
✅ Bra: "Vilka av era säljare har redan börjat fråga om nya jobb?"

❌ Dåligt: "Vad händer med skalbarhet?"
✅ Bra: "Vilka specifika kunder har uttryckt oro över er säljledning?"

❌ Dåligt: "Hur påverkar detta er tekniska skuld?"
✅ Bra: "Vad sa styrelsen när de fick höra om situationen?"

EXEMPEL PÅ FRÅGEKVALITET:
❌ Dåligt: "Vad ser ni som den största utmaningen med att er nuvarande säljchef lämnar? Hur påverkar det er säljorganisation? Vad händer med er skalbarhet?"
✅ Bra: "Vad ser ni som den största utmaningen med att er nuvarande säljchef lämnar?"

❌ Dåligt: "Berätta om era finansiella utmaningar, hur påverkar det er rapportering, och vilka compliance-risker finns?"
✅ Bra: "Vilka specifika finansiella utmaningar har ni just nu?"

KONVERSATIONSSTIL:
- Prata naturligt och direkt, som en erfaren kollega
- Använd korta, konkreta frågor som fokuserar på intern information
- Undvik formella övergångar och sammanfattningar
- Bekräfta kort och gå vidare med strategiska följdfrågor
- Ställ följdfrågor för att förstå helheten
- Håll stycken korta och naturliga
- EN ENDA fokuserad fråga per svar
- Varje fråga ska vara besvarbar på 1-2 meningar
- Bygg förståelse progressivt, inte informationsdumpning

EXEMPEL PÅ NATURLIG KONVERSATION:
❌ Undvik: "Låt mig sammanfatta för att säkerställa att jag förstått korrekt. Baserat på er information verkar ni ha utmaningar med..."
✅ Använd: "Okej, så ni behöver någon med enterprise-erfarenhet. Vad kostar det er att sakna denna person?"

❌ Undvik: "Kan du kvantifiera den ekonomiska påverkan av detta problem?"
✅ Använd: "Vad kostar det er?"

❌ Undvik: "För att bättre förstå situationen, skulle du kunna beskriva..."
✅ Använd: "Berätta mer om..."

FASÖVERGÅNG:
Du kommer att få information om när användaren har tillräckligt med information för att gå vidare.
När du får "PHASE_STATUS: READY_FOR_PROGRESSION" - föreslå att gå vidare till nästa fas istället för att ställa fler frågor.

När fasen är redo för progression, säg:
"Vi har nu samlat tillräcklig information om [fasnamn]. Är du redo att gå vidare till nästa fas där vi kommer att utforska [nästa fas]?"

STOPPA HÄR - ställ inga fler frågor efter detta meddelande. Vänta på användarens val.`;

// Simple message interface that matches Arena's ConversationMessage
interface SimpleMessage {
	role: "assistant" | "user";
	content: string;
}

interface RequestBody {
	messages: SimpleMessage[];
	currentCluster?: string;
	clusterProgress?: {
		confidence: number;
		collectedInfo: string[];
		status: string;
	};
	canProgressToNext?: boolean;
}

// M2 Step 1: Server-authoritative analysis response
interface ChatResponsePayload {
    message: string;
    roleContext: { role: string; seniority: string; department: string };
    analysis: {
        confidence: number;
        quality: 'low' | 'medium' | 'high';
        categoriesCovered: number;
        missingInsights: string[];
    };
    quickResponses: string[];
    canProgressToNext: boolean;
}

export async function POST(req: NextRequest) {
	try {
		console.log("🔍 API - Starting /api/arena/chat request");
		
    const body = (await req.json()) as Partial<RequestBody> | null;
    try {
      console.log("🔍 API - Request body (keys):", body ? Object.keys(body) : null);
      console.log("🔍 API - Messages length:", Array.isArray(body?.messages) ? body!.messages!.length : null);
      console.log("🔍 API - currentCluster:", body?.currentCluster);
      console.log("🔍 API - canProgressToNext:", body?.canProgressToNext);
    } catch {}
		
		if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
			console.log("🔍 API - Error: Invalid request body");
			return NextResponse.json({ message: "", error: "Invalid request: messages required" }, { status: 400 });
		}

    // Validate messages structure
    const sanitizedMessages = body.messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role!, content: (m.content || "").toString() }));

    if (sanitizedMessages.length === 0) {
      console.log("🔍 API - Error: No valid messages after sanitization");
      return NextResponse.json({ message: "", error: "Invalid messages format" }, { status: 400 });
    }

    const last = sanitizedMessages[sanitizedMessages.length - 1];
		if (!last || last.role !== "user" || !last.content?.trim()) {
			console.log("🔍 API - Error: Last message invalid");
			return NextResponse.json({ message: "", error: "Last message must be from user with content" }, { status: 400 });
		}

		console.log("🔍 API - Calling chatWithClaude...");
		
		// Detect role context for role-aware responses
		const roleContext = detectRoleContext(sanitizedMessages);
		console.log("🔍 API - Role context detected:", roleContext);
		
		// Build dynamic system prompt based on completion status and role context
		let dynamicSystemPrompt = SYSTEM_PROMPT;
		
		// Add role-specific context to system prompt
		if (roleContext.role !== 'default') {
			dynamicSystemPrompt += `\n\nROLLSPECIFIK KONTEXT:
Du hjälper med rekrytering av en ${roleContext.role.toUpperCase()} (${roleContext.seniority} nivå).
Fokusera på ${roleContext.department}-specifika utmaningar och använd relevant terminologi.
Ställ frågor som är relevanta för denna rolltyp.`;
		}
		// Log payload size to catch oversized requests
		try {
			const approxBytes = JSON.stringify(body).length;
			console.log("🔍 API - Approx payload bytes:", approxBytes);
		} catch {}
		
    if (body.canProgressToNext && body.currentCluster) {
			const clusterNames: Record<string, string> = {
				'pain-point': 'Problem & Pain Point',
				'impact-urgency': 'Impact & Urgency', 
				'success-criteria': 'Success Criteria',
				'resources-budget': 'Resources & Budget',
				'organization-culture': 'Organization & Culture',
				'alternatives-risks': 'Alternatives & Risks'
			};
			
			const nextClusterNames: Record<string, string> = {
				'pain-point': 'Impact & Urgency',
				'impact-urgency': 'Success Criteria',
				'success-criteria': 'Resources & Budget', 
				'resources-budget': 'Organization & Culture',
				'organization-culture': 'Alternatives & Risks',
				'alternatives-risks': 'slutrapporten'
			};
			
			const currentPhaseName = clusterNames[body.currentCluster] || body.currentCluster;
			const nextPhaseName = nextClusterNames[body.currentCluster] || 'nästa fas';
			
      const phaseStatusMessage = `\n\nPHASE_STATUS: READY_FOR_PROGRESSION (Current: ${currentPhaseName} -> Next: ${nextPhaseName}; confidence=${body.clusterProgress?.confidence || 0}%)`;
			
			dynamicSystemPrompt += phaseStatusMessage;
			console.log("🔍 API - Added phase completion status to system prompt");
		}
		
    // Limit context to last 10 messages to keep payload small
    const recent = sanitizedMessages.slice(-10);
    console.log("🔍 API - Using recent messages:", recent.length);

    // Convert simple messages to ChatMessage format for claude-client
    const chatMessages = recent.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date().toISOString()
    }));

    let text = "";
    try {
      const result = await chatWithClaude(chatMessages, dynamicSystemPrompt);
      text = result.text;
      
      // Enhance response with strategic questioning (SPIN + Challenger) if needed
        if (roleContext.role !== 'default' && body.currentCluster && !body.canProgressToNext) {
        // Determine if we should use Challenger insights or strategic questions
        const shouldUseChallenger = Math.random() < 0.3; // 30% chance to use Challenger insights
        
        if (shouldUseChallenger) {
          // Use Challenger Sale methodology to challenge assumptions
          const challengerInsight = getChallengerInsight(roleContext, body.currentCluster as any, sanitizedMessages);
          console.log("🔍 API - Challenger insight generated:", challengerInsight);
          
          // If the response is generic, enhance it with Challenger insight
          if (text.length < 100 || !text.includes(roleContext.department)) {
            text = `${text}\n\n${challengerInsight}`;
          }
        } else {
          // Use strategic SPIN questions focused on confidential information
          const strategicQuestion = getRoleAwareQuestion(body.currentCluster as any, roleContext, []);
          console.log("🔍 API - Strategic question generated:", strategicQuestion);
          
          // If the response is generic, enhance it with strategic question
          if (text.length < 100 || !text.includes(roleContext.department)) {
            text = `${text}\n\n${strategicQuestion}`;
          }
        }
        
        // Post-process to ensure only one question is asked
        const questionMarks = (text.match(/\?/g) || []).length;
        if (questionMarks > 1) {
          console.log("🔍 API - Multiple questions detected, keeping only the first one");
          const firstQuestionEnd = text.indexOf('?') + 1;
          text = text.substring(0, firstQuestionEnd);
        }
      }
      
    } catch (err: any) {
      console.error("❌ API - Claude call failed:", err?.message);
      return NextResponse.json({ message: "", error: err?.message || "Claude failed" }, { status: 502 });
    }
		console.log("🔍 API - Claude response length:", text?.length || 0);
		
        // Generate quick response suggestions using role context and exact question
        let quickResponses: string[] = [];
        if (roleContext.role !== 'default' && body.currentCluster) {
            quickResponses = await generateQuickResponseSuggestions(
                roleContext,
                body.currentCluster as any,
                // Pass the last assistant question (text) to ensure relevance
                text,
                sanitizedMessages as any
            );
            console.log("🔍 API - Quick response suggestions generated:", quickResponses);
        }

        // Compute cumulative server-side analysis using entire conversation
        const currentCluster = (body.currentCluster || 'pain-point') as any;
        const lastUserMessage = last.content;

        // Previous confidence from client state (if provided)
        const prevConfidence = Math.max(0, Math.round(body.clusterProgress?.confidence || 0));
        console.log('🔍 API - CUMULATIVE: prevConfidence =', prevConfidence);

        // Analyze only the NEW information from the last user message
        const msgAnalysis = analyzeMessage(lastUserMessage, currentCluster, roleContext as any);
        const qa = analyzeUniversalQuality(lastUserMessage, lastUserMessage.toLowerCase());

        // Derive a reasonable incremental confidence from the message analysis
        // Use a fraction of the per-message confidence, scaled by novelty proxy (categoriesCovered)
        const noveltyFactor = Math.max(1, qa.categoriesCovered); // 1..6
        const incremental = Math.round(Math.min(15, (msgAnalysis.confidence / 3) + (noveltyFactor * 1.5)));
        console.log('🔍 API - CUMULATIVE: msgAnalysis.confidence =', msgAnalysis.confidence);
        console.log('🔍 API - CUMULATIVE: qa.categoriesCovered =', qa.categoriesCovered);
        console.log('🔍 API - CUMULATIVE: incremental added =', incremental);

        // Role-specific cap
        const roleCap = ROLE_COMPLETION_THRESHOLDS[roleContext.seniority]?.[roleContext.department] ?? 80;

        // Cumulative total; never decrease
        let cumulativeConfidence = prevConfidence + incremental;
        if (cumulativeConfidence < prevConfidence) cumulativeConfidence = prevConfidence;
        cumulativeConfidence = Math.min(cumulativeConfidence, roleCap);
        console.log('🔍 API - CUMULATIVE: roleCap =', roleCap);
        console.log('🔍 API - CUMULATIVE: final cumulativeConfidence =', cumulativeConfidence);

        // Phase completion (server-side)
        const serverCanProgress = body.clusterProgress
            ? checkClusterCompletion(body.clusterProgress as any, currentCluster)
            : false;

        const payload: ChatResponsePayload = {
            message: text ?? "",
            roleContext: {
                role: roleContext.role,
                seniority: roleContext.seniority,
                department: roleContext.department
            },
            analysis: {
                // Return cumulative confidence instead of per-message
                confidence: cumulativeConfidence,
                quality: msgAnalysis.quality,
                categoriesCovered: qa.categoriesCovered,
                missingInsights: msgAnalysis.missingInfo
            },
            quickResponses,
            canProgressToNext: !!serverCanProgress
        };

        console.log("🔍 API - Structured response payload:", payload);

        // Backward compatible: older clients read { message, quickResponses }
        return NextResponse.json(payload, { status: 200 });
	} catch (error) {
		console.error("🔍 API - Error details:", error);
		console.error("🔍 API - Error stack:", error instanceof Error ? error.stack : "No stack trace");
		return NextResponse.json({ 
			message: "", 
			error: error instanceof Error ? error.message : "Internal server error" 
		}, { status: 500 });
	}
}
