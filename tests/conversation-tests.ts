/* Minimal automated conversation regression tests
 * Run: npm run test:conversations
 */

import { detectRoleContext, analyzeMessage, RoleContext } from "../lib/cluster-engine";

type ExpectedRange = [number, number];

type TestCase = {
	id: string;
	label: string;
	userMessage: string;
	expectedRole: string;
	expectedSeniority: string;
	expectedConfidenceRange: ExpectedRange;
	expectedQuestionType: "business_impact" | "technical_debt" | "team_dynamics";
};

const SCENARIOS: TestCase[] = [
	{
		id: "sales_manager_001",
		label: "Sales Manager (pipeline issues)",
		userMessage: "Vi behöver en säljchef eftersom vår nuvarande slutar",
		expectedRole: "sales",
		expectedSeniority: "senior",
		expectedConfidenceRange: [25, 40],
		expectedQuestionType: "business_impact",
	},
	{
		id: "cfo_001",
		label: "CFO (finance scaling, Series B)",
		userMessage: "Vi behöver en CFO för att förbereda en Series B och skala finansfunktionen",
		expectedRole: "finance",
		expectedSeniority: "executive",
		expectedConfidenceRange: [25, 40],
		expectedQuestionType: "business_impact",
	},
	{
		id: "tech_lead_001",
		label: "Tech Lead (architecture debt, growth)",
		userMessage: "Vi behöver en Tech Lead – mycket teknisk skuld och teamet växer",
		expectedRole: "tech",
		expectedSeniority: "mid",
		expectedConfidenceRange: [25, 40],
		expectedQuestionType: "technical_debt",
	},
	{
		id: "junior_dev_001",
		label: "Junior Developer (first hire, budget)",
		userMessage: "Vi behöver vår första utvecklare men har begränsad budget",
		expectedRole: "tech",
		expectedSeniority: "junior",
		expectedConfidenceRange: [20, 35],
		expectedQuestionType: "business_impact",
	},
	{
		id: "marketing_manager_001",
		label: "Marketing Manager (brand & growth)",
		userMessage: "Vi behöver en marknadschef för att stärka varumärket och växa",
		expectedRole: "marketing",
		expectedSeniority: "senior",
		expectedConfidenceRange: [25, 40],
		expectedQuestionType: "business_impact",
	},
];

function classifyQuestionType(text: string): TestCase["expectedQuestionType"] {
	const lower = text.toLowerCase();
	if (/(teknisk skuld|arkitektur|skalbarhet|drift|infra|kod|kodbas)/.test(lower)) return "technical_debt";
	if (/(pipeline|omsättning|kunder|intäkt|affärspåverkan|marknad|tillväxt|budget|finansiell)/.test(lower)) return "business_impact";
	if (/(team|kultur|ledarskap|rekrytering|person|motivation|oro)/.test(lower)) return "team_dynamics";
	return "business_impact";
}

async function callArenaAPI(message: string, currentCluster: string = "pain-point") {
	const body = {
		messages: [{ role: "user", content: message }],
		currentCluster,
		clusterProgress: { confidence: 0, status: "in-progress", collectedInfo: [] },
		canProgressToNext: false,
	};
	const res = await fetch("http://localhost:3000/api/arena/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return (await res.json()) as { message: string };
}

function inRange(value: number, [min, max]: ExpectedRange) {
	return value >= min && value <= max;
}

async function runScenario(test: TestCase) {
	const messages = [{ role: "user" as const, content: test.userMessage }];
	const roleContext = detectRoleContext(messages as any);

	const confidence = analyzeMessage(test.userMessage, "pain-point" as any, roleContext as RoleContext).confidence;

	let questionText = "";
	try {
		const api = await callArenaAPI(test.userMessage);
		questionText = api.message || "";
	} catch (e) {
		questionText = "";
	}
	const questionType = classifyQuestionType(questionText);

	const roleOk = roleContext.department === test.expectedRole;
	const seniorityOk = roleContext.seniority === test.expectedSeniority;
	const confidenceOk = inRange(confidence, test.expectedConfidenceRange);
	const questionOk = questionType === test.expectedQuestionType;

	const ok = roleOk && seniorityOk && confidenceOk && questionOk;

	return {
		id: test.id,
		label: test.label,
		ok,
		roleOk,
		seniorityOk,
		confidenceOk,
		questionOk,
		observed: { role: roleContext.department, seniority: roleContext.seniority, confidence, questionType },
		expected: { role: test.expectedRole, seniority: test.expectedSeniority, confidenceRange: test.expectedConfidenceRange, questionType: test.expectedQuestionType },
	};
}

async function main() {
	const start = Date.now();
	const results = [] as Awaited<ReturnType<typeof runScenario>>[];
	for (const s of SCENARIOS) {
		// Run serially to keep API noise low
		const r = await runScenario(s);
		results.push(r);
	}
	const passed = results.filter(r => r.ok).length;
	for (const r of results) {
		const status = r.ok ? "✅" : "❌";
		const parts: string[] = [];
		parts.push(`${r.label}:`);
		parts.push(`role ${r.roleOk ? "✓" : `✗ (got: ${r.observed.role}, expected: ${r.expected.role})`}`);
		parts.push(`seniority ${r.seniorityOk ? "✓" : `✗ (got: ${r.observed.seniority}, expected: ${r.expected.seniority})`}`);
		parts.push(`confidence ${r.confidenceOk ? "✓" : `✗ (got: ${r.observed.confidence}, expected: ${r.expected.confidenceRange[0]}-${r.expected.confidenceRange[1]})`}`);
		parts.push(`question ${r.questionOk ? "✓" : `✗ (got: ${r.observed.questionType}, expected: ${r.expected.questionType})`}`);
		console.log(`${status} ${parts.join(" ")}`);
	}
	console.log(`\nSummary: ${passed}/${results.length} passed  (time: ${Math.round((Date.now()-start)/1000)}s)`);
}

// Execute
main().catch(err => {
	console.error("Test runner failed:", err);
	process.exit(1);
});


