// server-only
import { NextRequest, NextResponse } from "next/server";
import { generateRecruitmentReport, extractInformationGaps } from "@/lib/reports/generator";
import { RoleContext } from "@/lib/engine-types";

interface RequestBody {
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  roleContext: RoleContext;
  currentPhase: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    
    if (!body.conversationHistory || !Array.isArray(body.conversationHistory)) {
      return NextResponse.json(
        { error: "conversationHistory is required and must be an array" },
        { status: 400 }
      );
    }
    
    if (!body.roleContext || !body.roleContext.role) {
      return NextResponse.json(
        { error: "roleContext is required" },
        { status: 400 }
      );
    }
    
    if (typeof body.currentPhase !== 'number' || body.currentPhase < 0 || body.currentPhase > 6) {
      return NextResponse.json(
        { error: "currentPhase must be a number between 0 and 6" },
        { status: 400 }
      );
    }

    console.log(`🔍 REPORT API - Generating report for ${body.roleContext.role} (phase ${body.currentPhase})`);
    console.log(`🔍 REPORT API - Conversation length: ${body.conversationHistory.length} exchanges`);

    const report = await generateRecruitmentReport(
      body.conversationHistory,
      body.roleContext,
      body.currentPhase
    );

    const informationGaps = extractInformationGaps(report.report);
    
    console.log(`🔍 REPORT API - Generated report (${report.report.length} chars)`);
    console.log(`🔍 REPORT API - Information gaps found: ${informationGaps.length}`);

    return NextResponse.json({
      report: report.report,
      timestamp: report.timestamp,
      phase: report.phase,
      roleContext: report.roleContext,
      informationGaps,
      isDraft: report.phase < 6
    });

  } catch (error) {
    console.error("🔍 REPORT API - Error generating report:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate report",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
