import { NextRequest, NextResponse } from 'next/server';
import { chatWithClaude } from '@/lib/claude-client';

// In-memory cache for semantic analysis
const semanticCache = new Map<string, any>();

function hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

function applySemanticSignals(baseConfidence: number, signals: any): number {
    let confidence = baseConfidence;
    if (signals?.businessTermsPresent) confidence += 5;
    if (signals?.timingIndicators) confidence += 7;
    if (typeof signals?.quantificationLevel === 'number') confidence += Math.min(8, signals.quantificationLevel * 2);
    if (typeof signals?.causalityStrength === 'number') confidence += Math.min(6, signals.causalityStrength * 1.5);
    if (signals?.stakeholderMentions) confidence += 4;

    return Math.min(85, Math.round(confidence));
}

export async function POST(request: NextRequest) {
    try {
        const { message, baseConfidence } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const words = message.trim().split(/\s+/).length;
        if (words <= 10) {
            return NextResponse.json({ 
                enhancedConfidence: baseConfidence || 0,
                signals: null,
                cached: false
            });
        }

        const key = hashString(message);
        if (semanticCache.has(key)) {
            const cached = semanticCache.get(key);
            const enhancedConfidence = applySemanticSignals(baseConfidence || 0, cached);
            return NextResponse.json({ 
                enhancedConfidence,
                signals: cached,
                cached: true
            });
        }

        const prompt = `Analyze this message and return ONLY JSON with keys:
{
  "businessTermsPresent": boolean,
  "quantificationLevel": 0|1|2|3|4,
  "timingIndicators": boolean,
  "causalityStrength": 0|1|2|3|4,
  "stakeholderMentions": boolean
}
Message: """${message}"""`;

        try {
            const { text } = await chatWithClaude([
                { role: 'user', content: message, timestamp: new Date().toISOString() }
            ], prompt);
            
            let parsed: any = null;
            try {
                parsed = JSON.parse(text);
            } catch {
                const m = text.match(/\{[\s\S]*\}/);
                if (m) parsed = JSON.parse(m[0]);
            }
            
            if (parsed) {
                semanticCache.set(key, parsed);
                const enhancedConfidence = applySemanticSignals(baseConfidence || 0, parsed);
                return NextResponse.json({ 
                    enhancedConfidence,
                    signals: parsed,
                    cached: false
                });
            }
        } catch (error) {
            console.warn('⚠️ Semantic analysis failed, returning base confidence:', error);
        }

        return NextResponse.json({ 
            enhancedConfidence: baseConfidence || 0,
            signals: null,
            cached: false
        });

    } catch (error) {
        console.error('❌ Semantic analysis API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

