(()=>{var e={};e.id=466,e.ids=[466],e.modules={399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9348:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},412:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},4535:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>h,routeModule:()=>p,serverHooks:()=>m,workAsyncStorage:()=>g,workUnitAsyncStorage:()=>d});var s={};r.r(s),r.d(s,{POST:()=>c});var o=r(2412),n=r(4293),a=r(4147),i=r(7856),l=r(9111);async function u(e,t,r){let s=`Analyze this recruitment conversation and generate a strategic report.

Conversation (${e.length} exchanges):
${e.map(e=>`${e.role}: ${e.content}`).join("\n")}

Role: ${t.role} (${t.seniority})
Phases completed: ${r}/6

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

IMPORTANT: Base only on actual conversation content. Be explicit about gaps. If early in conversation, say so.`;try{return{report:(await (0,l.m)([{role:"user",content:s,timestamp:new Date().toISOString()}],"Generate a comprehensive recruitment analysis report based on the conversation provided.",{timeoutMs:4e3})).text,timestamp:new Date().toISOString(),phase:r,roleContext:t}}catch(e){throw console.error("Failed to generate recruitment report:",e),Error("Failed to generate report. Please try again.")}}async function c(e){try{let t=await e.json();if(!t.conversationHistory||!Array.isArray(t.conversationHistory))return i.NextResponse.json({error:"conversationHistory is required and must be an array"},{status:400});if(!t.roleContext||!t.roleContext.role)return i.NextResponse.json({error:"roleContext is required"},{status:400});if("number"!=typeof t.currentPhase||t.currentPhase<0||t.currentPhase>6)return i.NextResponse.json({error:"currentPhase must be a number between 0 and 6"},{status:400});console.log(`🔍 REPORT API - Generating report for ${t.roleContext.role} (phase ${t.currentPhase})`),console.log(`🔍 REPORT API - Conversation length: ${t.conversationHistory.length} exchanges`);let r=await u(t.conversationHistory,t.roleContext,t.currentPhase),s=function(e){let t=[],r=e.match(/# Information Gaps[\s\S]*?(?=# |$)/i);if(!r)return t;let s=r[0].split("\n").filter(e=>e.trim()),o=null;for(let e of s){let r=e.trim();r.includes("High")||r.includes("HIGH")?o={priority:"High",question:"",suggestedFollowUp:""}:r.includes("Medium")||r.includes("MEDIUM")?o={priority:"Medium",question:"",suggestedFollowUp:""}:(r.includes("Low")||r.includes("LOW"))&&(o={priority:"Low",question:"",suggestedFollowUp:""}),r.match(/^[-•*]\s/)&&o&&(o.question=r.replace(/^[-•*]\s*/,"")),r.toLowerCase().includes("suggest")&&o&&(o.suggestedFollowUp=r),o&&o.question&&o.suggestedFollowUp&&(t.push(o),o=null)}return t}(r.report);return console.log(`🔍 REPORT API - Generated report (${r.report.length} chars)`),console.log(`🔍 REPORT API - Information gaps found: ${s.length}`),i.NextResponse.json({report:r.report,timestamp:r.timestamp,phase:r.phase,roleContext:r.roleContext,informationGaps:s,isDraft:r.phase<6})}catch(e){return console.error("\uD83D\uDD0D REPORT API - Error generating report:",e),i.NextResponse.json({error:e instanceof Error?e.message:"Failed to generate report",details:e instanceof Error?e.stack:void 0},{status:500})}}let p=new o.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/reports/generate/route",pathname:"/api/reports/generate",filename:"route",bundlePath:"app/api/reports/generate/route"},resolvedPagePath:"/Users/christoffersundberg/recta-v2/app/api/reports/generate/route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:g,workUnitAsyncStorage:d,serverHooks:m}=p;function h(){return(0,a.patchFetch)({workAsyncStorage:g,workUnitAsyncStorage:d})}},5303:()=>{},9111:(e,t,r)=>{"use strict";r.d(t,{X:()=>i,m:()=>a});var s=r(9967);let o=process.env.ANTHROPIC_API_KEY;o||console.warn("ANTHROPIC_API_KEY is not set. Claude client will fail at runtime."),console.log("\uD83D\uDD0D Claude Client - API Key present:",!!o),console.log("\uD83D\uDD0D Claude Client - API Key length:",o?.length||0);let n=new s.ZP({apiKey:o}),a=async(e,t,r)=>{try{console.log("\uD83D\uDD0D Claude Client - Starting chatWithClaude"),console.log("\uD83D\uDD0D Claude Client - Messages count:",e.length),console.log("\uD83D\uDD0D Claude Client - System prompt:",t?.substring(0,100)+"...");let s=r?.model||process.env.CLAUDE_MODEL||"claude-3-5-sonnet-20240620",o=r?.timeoutMs??35e3,a=e.filter(e=>"user"===e.role||"assistant"===e.role).map(e=>({role:e.role,content:e.content}));console.log("\uD83D\uDD0D Claude Client - Mapped messages:",a.length),console.log("\uD83D\uDD0D Claude Client - Last message:",a[a.length-1]),console.log("\uD83D\uDD0D Claude Client - Sending request to model",s,`(timeout=${o}ms)`);let i=await function(e,t=35e3){return new Promise((r,s)=>{let o=setTimeout(()=>{console.error(`❌ Claude Client - Local timeout triggered after ${t}ms`),s(Error(`Claude client timeout after ${t}ms`))},t);e.then(e=>r(e)).catch(e=>s(e)).finally(()=>clearTimeout(o))})}(n.messages.create({model:s,max_tokens:500,system:t??"You are Recta, an executive assistant for structured hiring analysis.",messages:a}),o);console.log("\uD83D\uDD0D Claude Client - Response received");let l=i.content[0]?.type==="text"?i.content[0].text:"";return console.log("\uD83D\uDD0D Claude Client - Response text length:",l.length),{text:l,usage:{inputTokens:i.usage?.input_tokens??0,outputTokens:i.usage?.output_tokens??0}}}catch(r){let e=r?.status||r?.response?.status,t=r?.response?.data||r?.error||r?.message;if(console.error("❌ Claude Client - chatWithClaude failed",{status:e,data:t}),e)throw Error(`Claude API error ${e}: ${"string"==typeof t?t:JSON.stringify(t)}`);throw Error(r?.message||"Claude request failed")}};async function i(e){let t=await a(e.messages);return{message:{role:"assistant",content:t.text,stepId:e.stepId,timestamp:new Date().toISOString()},usage:t.usage}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[267,520],()=>r(4535));module.exports=s})();