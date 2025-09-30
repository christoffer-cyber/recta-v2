import { ConversationMessage, RoleContext } from './engine-types';

export const detectRoleContext = (messages: ConversationMessage[]): RoleContext => {
	const userMessages = messages.filter(m => m.role === 'user');
	const allText = userMessages.map(m => m.content).join(' ').toLowerCase();

	console.log('🔍 ROLE DETECTION - Analyzing user messages only:', allText);

	const rolePatterns = {
		'sales-manager': ['säljchef', 'försäljningschef', 'sales manager', 'säljansvarig'],
		'sales': ['säljare', 'sales', 'account manager', 'försäljning', 'säljteam'],
		'cmo': ['cmo', 'marknadschef', 'chief marketing officer'],
		'cfo': ['cfo', 'finanschef', 'ekonomichef', 'chief financial officer'],
		'finance': ['ekonom', 'controller', 'redovisning', 'finans', 'budget'],
		'cto': ['cto', 'chief technology officer', 'teknikchef'],
		'tech-lead': ['tech lead', 'utvecklingschef', 'technical lead', 'arkitekt'],
		'tech': ['utvecklare', 'developer', 'engineer', 'programmerare', 'tech', 'it'],
		'coo': ['coo', 'chief operating officer', 'verkställande chef'],
		'operations-manager': ['operations manager', 'driftschef', 'processchef'],
		'operations': ['operations', 'drift', 'process', 'leverans', 'kvalitet'],
		'marketing-manager': ['marknadschef', 'marketing manager'],
		'marketing': ['marknadsföring', 'marketing', 'varumärke', 'brand'],
		'chro': ['chro', 'chief human resources officer'],
		'hr-manager': ['hr-chef', 'personalchef', 'hr manager'],
		'hr': ['hr', 'personal', 'rekrytering', 'anställning']
	};

	const seniorityPatterns = {
		'junior': ['junior', 'nybörjare', 'entry', 'trainee', 'assistent'],
		'mid': ['medior', 'erfaren', 'senior', 'specialist'],
		'senior': ['senior', 'expert', 'ledande', 'chef'],
		'executive': ['chef', 'director', 'vp', 'chief', 'ceo', 'cto', 'cfo', 'cmo', 'coo']
	};

	const departmentPatterns = {
		'finance': ['finans', 'ekonomi', 'redovisning', 'budget', 'controller'],
		'tech': ['utveckling', 'teknik', 'it', 'system', 'programmering'],
		'sales': ['försäljning', 'sälj', 'kund', 'pipeline', 'revenue'],
		'operations': ['drift', 'process', 'leverans', 'kvalitet', 'effektivitet'],
		'marketing': ['marknadsföring', 'marketing', 'varumärke', 'brand', 'tillväxt'],
		'hr': ['personal', 'hr', 'rekrytering', 'anställning', 'team']
	};

	let detectedRole = 'default';
	let maxMatches = 0;
	let matchedPatterns: string[] = [];

	const salesRoleTerms = ['säljchef', 'försäljningschef', 'säljansvarig', 'sales manager'];
	const hasSalesRoleTerms = salesRoleTerms.some(term => allText.includes(term));

	if (hasSalesRoleTerms) {
		console.log('🔍 ROLE DETECTION - Sales terms detected, prioritizing sales roles');
		const salesRoles = ['sales-manager', 'sales'];
		for (const role of salesRoles) {
			const patterns = (rolePatterns as any)[role] as string[];
			const matches = patterns.filter(pattern => allText.includes(pattern));
			if (matches.length > 0) {
				detectedRole = role;
				matchedPatterns = matches;
				console.log(`🔍 ROLE DETECTION - Sales role detected: ${role}, patterns: ${matches.join(', ')}`);
				break;
			}
		}
	} else {
		const techRoleTerms = ['tech lead', 'utvecklingschef', 'cto', 'chief technology officer', 'teknikchef'];
		const financeRoleTerms = ['cfo', 'finanschef', 'ekonomichef', 'chief financial officer'];
		const marketingRoleTerms = ['cmo', 'marknadschef', 'chief marketing officer'];
		const hrRoleTerms = ['hr-chef', 'personalchef', 'hr manager', 'chro', 'chief human resources officer'];
		const operationsRoleTerms = ['operations manager', 'driftschef', 'processchef', 'coo', 'chief operating officer'];

		if (techRoleTerms.some(term => allText.includes(term))) {
			console.log('🔍 ROLE DETECTION - Tech role terms detected, prioritizing tech roles');
			const techRoles = ['cto', 'tech-lead', 'tech'];
			for (const role of techRoles) {
				const patterns = (rolePatterns as any)[role] as string[];
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > 0) { detectedRole = role; matchedPatterns = matches; break; }
			}
		} else if (financeRoleTerms.some(term => allText.includes(term))) {
			console.log('🔍 ROLE DETECTION - Finance role terms detected, prioritizing finance roles');
			const financeRoles = ['cfo', 'finance'];
			for (const role of financeRoles) {
				const patterns = (rolePatterns as any)[role] as string[];
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > 0) { detectedRole = role; matchedPatterns = matches; break; }
			}
		} else if (marketingRoleTerms.some(term => allText.includes(term))) {
			console.log('🔍 ROLE DETECTION - Marketing role terms detected, prioritizing marketing roles');
			const marketingRoles = ['cmo', 'marketing-manager', 'marketing'];
			for (const role of marketingRoles) {
				const patterns = (rolePatterns as any)[role] as string[];
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > 0) { detectedRole = role; matchedPatterns = matches; break; }
			}
		} else if (hrRoleTerms.some(term => allText.includes(term))) {
			console.log('🔍 ROLE DETECTION - HR role terms detected, prioritizing HR roles');
			const hrRoles = ['chro', 'hr-manager', 'hr'];
			for (const role of hrRoles) {
				const patterns = (rolePatterns as any)[role] as string[];
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > 0) { detectedRole = role; matchedPatterns = matches; break; }
			}
		} else if (operationsRoleTerms.some(term => allText.includes(term))) {
			console.log('🔍 ROLE DETECTION - Operations role terms detected, prioritizing operations roles');
			const operationsRoles = ['coo', 'operations-manager', 'operations'];
			for (const role of operationsRoles) {
				const patterns = (rolePatterns as any)[role] as string[];
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > 0) { detectedRole = role; matchedPatterns = matches; break; }
			}
		} else {
			for (const [role, patterns] of Object.entries(rolePatterns)) {
				const matches = patterns.filter(pattern => allText.includes(pattern));
				if (matches.length > maxMatches) { maxMatches = matches.length; detectedRole = role; matchedPatterns = matches; }
			}
		}
		console.log(`🔍 ROLE DETECTION - Role detected: ${detectedRole}, patterns: ${matchedPatterns.join(', ')}`);
	}

	let detectedSeniority: 'junior' | 'mid' | 'senior' | 'executive' = 'mid';
	for (const [seniority, patterns] of Object.entries(seniorityPatterns)) {
		if (patterns.some(pattern => allText.includes(pattern))) { detectedSeniority = seniority as any; break; }
	}

	let detectedDepartment: RoleContext['department'] = 'general';
	const roleToDepartment: Record<string, string> = {
		'sales-manager': 'sales', 'sales': 'sales', 'cmo': 'marketing',
		'cfo': 'finance', 'finance': 'finance', 'cto': 'tech', 'tech-lead': 'tech', 'tech': 'tech',
		'coo': 'operations', 'operations-manager': 'operations', 'operations': 'operations',
		'marketing-manager': 'marketing', 'marketing': 'marketing', 'chro': 'hr', 'hr-manager': 'hr', 'hr': 'hr'
	};

	if (roleToDepartment[detectedRole]) {
		detectedDepartment = roleToDepartment[detectedRole] as any;
	} else {
		for (const [department, patterns] of Object.entries(departmentPatterns)) {
			if (patterns.some(pattern => allText.includes(pattern))) { detectedDepartment = department as any; break; }
		}
	}

	const result = { role: detectedRole, seniority: detectedSeniority, department: detectedDepartment } as RoleContext;
	console.log('🔍 ROLE DETECTION - Final result:', result);
	return result;
};


