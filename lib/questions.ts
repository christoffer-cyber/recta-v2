import { ClusterType } from './clusters';
import { ConversationMessage, RoleContext } from './engine-types';

export const getRoleAwareQuestion = (
	currentCluster: ClusterType,
	roleContext: RoleContext,
	missingInsights: string[]
): string => {
	const strategicQuestions: Record<string, Record<string, string[]>> = {
		'pain-point': {
			'cfo': [
				'Vilka specifika investerare har redan uttryckt oro över er rapportering?',
				'Vad sa styrelsen när de fick höra om förseningarna?',
				'Vilka av era finansiella leverantörer har hotat med att dra tillbaka kredit?',
				'Hur många av era chefer har redan börjat leta efter nya jobb?',
				'Vilka konkreta affärsmöjligheter har ni redan missat på grund av detta?'
			],
			'tech': [
				'Vilka av era utvecklare har redan börjat fråga om nya jobb?',
				'Vad sa era största kunder när de fick höra om förseningarna?',
				'Vilka specifika kunder har uttryckt oro över er tekniska skuld?',
				'Hur många av era seniora utvecklare har redan sagt upp sig?',
				'Vilka konkreta produktlanseringar har ni redan missat på grund av detta?'
			],
			'sales': [
				'Vilka av era säljare har redan börjat fråga om nya jobb?',
				'Vad sa era största kunder när de fick höra om problemen?',
				'Vilka specifika kunder har redan hotat med att byta leverantör?',
				'Hur många av era account managers har redan sagt upp sig?',
				'Vilka konkreta affärer har ni redan förlorat på grund av detta?'
			],
			'operations': [
				'Vilka av era operations-medarbetare har redan börjat fråga om nya jobb?',
				'Vad sa era största kunder när de fick höra om leveransproblemen?',
				'Vilka specifika kunder har redan hotat med att avsluta kontrakt?',
				'Hur många av era kvalitetsansvariga har redan sagt upp sig?',
				'Vilka konkreta leveransmöjligheter har ni redan missat på grund av detta?'
			],
			'marketing': [
				'Vilka av era marknadsförare har redan börjat fråga om nya jobb?',
				'Vad sa era största kunder när de fick höra om varumärkesproblemen?',
				'Vilka specifika kunder har redan uttryckt oro över er marknadsposition?',
				'Hur många av era kreativa medarbetare har redan sagt upp sig?',
				'Vilka konkreta marknadsmöjligheter har ni redan missat på grund av detta?'
			],
			'hr': [
				'Vilka av era HR-medarbetare har redan börjat fråga om nya jobb?',
				'Vad sa era största kunder när de fick höra om personalproblemen?',
				'Vilka specifika kunder har redan uttryckt oro över er teamstabilitet?',
				'Hur många av era rekryterare har redan sagt upp sig?',
				'Vilka konkreta talangmöjligheter har ni redan missat på grund av detta?'
			]
		},
		'impact-urgency': {
			'cfo': [
				'Vilka specifika investerare har redan sagt att de inte kommer investera i nästa runda?',
				'Vad sa banken när de fick höra om er finansiella situation?',
				'Hur många av era leverantörer har redan krävt förskottsbetalning?',
				'Vilka konkreta affärsmöjligheter har ni redan förlorat på grund av dålig rapportering?',
				'Vad sa era största kunder när de fick höra om er finansiella instabilitet?'
			],
			'tech': [
				'Vilka specifika kunder har redan sagt att de inte kommer förnya kontrakt?',
				'Vad sa era största kunder när de fick höra om produktförseningarna?',
				'Hur många av era utvecklare har redan fått jobberbjudanden från konkurrenter?',
				'Vilka konkreta produktlanseringar har ni redan förlorat på grund av tekniska problem?',
				'Vad sa era största kunder när de fick höra om er tekniska skuld?'
			],
			'sales': [
				'Vilka specifika kunder har redan sagt att de inte kommer förnya kontrakt?',
				'Vad sa era största kunder när de fick höra om säljproblemen?',
				'Hur många av era säljare har redan fått jobberbjudanden från konkurrenter?',
				'Vilka konkreta affärer har ni redan förlorat på grund av dålig säljledning?',
				'Vad sa era största kunder när de fick höra om er säljorganisation?'
			],
			'operations': [
				'Vilka specifika kunder har redan sagt att de inte kommer förnya kontrakt?',
				'Vad sa era största kunder när de fick höra om leveransproblemen?',
				'Hur många av era operations-medarbetare har redan fått jobberbjudanden från konkurrenter?',
				'Vilka konkreta leveransmöjligheter har ni redan förlorat på grund av processproblem?',
				'Vad sa era största kunder när de fick höra om er operationskapacitet?'
			],
			'marketing': [
				'Vilka specifika kunder har redan sagt att de inte kommer förnya kontrakt?',
				'Vad sa era största kunder när de fick höra om varumärkesproblemen?',
				'Hur många av era marknadsförare har redan fått jobberbjudanden från konkurrenter?',
				'Vilka konkreta marknadsmöjligheter har ni redan förlorat på grund av dålig marknadsföring?',
				'Vad sa era största kunder när de fick höra om er marknadsposition?'
			],
			'hr': [
				'Vilka specifika kunder har redan sagt att de inte kommer förnya kontrakt?',
				'Vad sa era största kunder när de fick höra om personalproblemen?',
				'Hur många av era HR-medarbetare har redan fått jobberbjudanden från konkurrenter?',
				'Vilka konkreta talangmöjligheter har ni redan förlorat på grund av dålig HR-ledning?',
				'Vad sa era största kunder när de fick höra om er teamstabilitet?'
			]
		}
	};

	const clusterQuestions = strategicQuestions[currentCluster] || {};
	const roleSpecificQuestions = clusterQuestions[roleContext.role] || clusterQuestions['default'] || [
		'Vilka specifika personer har redan uttryckt oro över denna situation?',
		'Vad sa era största kunder när de fick höra om problemet?',
		'Hur många av era medarbetare har redan börjat leta efter nya jobb?'
	];

	return roleSpecificQuestions[Math.floor(Math.random() * roleSpecificQuestions.length)];
};

export const getChallengerInsight = (
	roleContext: RoleContext,
	currentCluster: ClusterType,
	conversationHistory: ConversationMessage[]
): string => {
    // Try to ground the insight in last 2 user turns for relevance
    const recentUserStatements = conversationHistory
        .filter(m => m.role === 'user')
        .slice(-2)
        .map(m => m.content.toLowerCase())
        .join(' \n ');

    // Lightweight tailoring by role with simple pattern probes
    function tailorByRole(base: string): string {
        const add = (hint: string) => `${base} (${hint})`;
        if (roleContext.role === 'marketing') {
            if (recentUserStatements.includes('varumärke') || recentUserStatements.includes('brand')) {
                return add('direkt kopplat till varumärkesstyrka ni nämnde');
            }
            if (recentUserStatements.includes('mql') || recentUserStatements.includes('pipeline') || recentUserStatements.includes('leads')) {
                return add('konsekvenser för pipeline/leads ni beskrev');
            }
            return add('koppla till marknadsposition och growth-momentum');
        }
        if (roleContext.role === 'cfo' || roleContext.department === 'finance') {
            if (recentUserStatements.includes('ifrs') || recentUserStatements.includes('rapport')) {
                return add('kopplat till IFRS/rapportering som ni tog upp');
            }
            if (recentUserStatements.includes('series') || recentUserStatements.includes('invest')) {
                return add('konsekvenser för investerare/finansiering');
            }
            return add('finansiell kontroll och styrelsens förtroende');
        }
        if (roleContext.role === 'sales') {
            if (recentUserStatements.includes('pipeline') || recentUserStatements.includes('konvertering')) {
                return add('direkt effekt på pipeline och konvertering');
            }
            return add('intäktstakt och kundtapp');
        }
        if (roleContext.role === 'tech') {
            if (recentUserStatements.includes('skuld') || recentUserStatements.includes('teknisk skuld')) {
                return add('accelererande teknisk skuld påverkar leverans');
            }
            return add('skalbarhet och incidentrisk');
        }
        return base;
    }

	const challengerInsights: Record<string, Record<string, string[]>> = {
		'pain-point': {
			'cfo': [
				'Jag tror att det här problemet är större än ni tror. De flesta företag i er situation har redan förlorat 2-3 nyckelpersoner.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 15-25% av deras omsättning inom 6 månader.',
				'Jag har sett detta mönster förut - företag som väntar för länge brukar förlora sina bästa kunder först.',
				'Det här låter som ett systemproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela funktionen?'
			],
			'tech': [
				'Jag tror att er tekniska skuld är mycket större än ni inser. De flesta team i er situation har redan förlorat sina seniora utvecklare.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 30-40% av deras produktionshastighet inom 3 månader.',
				'Jag har sett detta mönster förut - team som väntar för länge brukar förlora sina bästa utvecklare först.',
				'Det här låter som ett arkitekturproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela systemet?'
			],
			'sales': [
				'Jag tror att er säljorganisation är mycket mer instabil än ni tror. De flesta team i er situation har redan förlorat sina bästa säljare.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 20-30% av deras omsättning inom 4 månader.',
				'Jag har sett detta mönster förut - säljteam som väntar för länge brukar förlora sina bästa kunder först.',
				'Det här låter som ett organisationsproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela säljorganisationen?'
			],
			'operations': [
				'Jag tror att era processproblem är mycket allvarligare än ni tror. De flesta företag i er situation har redan förlorat sina bästa kunder.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 25-35% av deras kapacitet inom 2 månader.',
				'Jag har sett detta mönster förut - operations som väntar för länge brukar förlora sina bästa medarbetare först.',
				'Det här låter som ett systemproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela operations?'
			],
			'marketing': [
				'Jag tror att er marknadsposition är mycket svagare än ni tror. De flesta företag i er situation har redan förlorat marknadsandelar.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 15-25% av deras tillväxt inom 6 månader.',
				'Jag har sett detta mönster förut - marknadsföring som väntar för länge brukar förlora sina bästa kunder först.',
				'Det här låter som ett strategiproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela marknadsföringen?'
			],
			'hr': [
				'Jag tror att er teamstabilitet är mycket sämre än ni tror. De flesta företag i er situation har redan förlorat sina bästa medarbetare.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 20-30% av deras produktivitet inom 3 månader.',
				'Jag har sett detta mönster förut - HR som väntar för länge brukar förlora sina bästa talanger först.',
				'Det här låter som ett kulturproblem, inte bara en personfråga. Har ni funderat på att omstrukturera hela organisationen?'
			]
		},
		'impact-urgency': {
			'cfo': [
				'Jag tror att ni underskattar den finansiella påverkan. De flesta företag i er situation har redan förlorat 40-60% av sin värdering.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
				'Jag har sett detta mönster förut - företag som väntar för länge brukar förlora sina investerare först.',
				'Det här är inte bara ett problem, det är en existentiell kris. Har ni funderat på att ta drastiska åtgärder?'
			],
			'tech': [
				'Jag tror att ni underskattar den tekniska påverkan. De flesta team i er situation har redan förlorat 50-70% av sin produktivitet.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 3-4x mer än de initialt tror.',
				'Jag har sett detta mönster förut - team som väntar för länge brukar förlora sina bästa utvecklare först.',
				'Det här är inte bara ett problem, det är en teknisk kris. Har ni funderat på att ta drastiska åtgärder?'
			],
			'sales': [
				'Jag tror att ni underskattar den säljmässiga påverkan. De flesta team i er situation har redan förlorat 30-50% av sin omsättning.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
				'Jag har sett detta mönster förut - säljteam som väntar för länge brukar förlora sina bästa kunder först.',
				'Det här är inte bara ett problem, det är en säljkris. Har ni funderat på att ta drastiska åtgärder?'
			],
			'operations': [
				'Jag tror att ni underskattar den operativa påverkan. De flesta företag i er situation har redan förlorat 40-60% av sin kapacitet.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
				'Jag har sett detta mönster förut - operations som väntar för länge brukar förlora sina bästa medarbetare först.',
				'Det här är inte bara ett problem, det är en operationskris. Har ni funderat på att ta drastiska åtgärder?'
			],
			'marketing': [
				'Jag tror att ni underskattar den marknadsmässiga påverkan. De flesta företag i er situation har redan förlorat 25-40% av sin marknadsandel.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
				'Jag har sett detta mönster förut - marknadsföring som väntar för länge brukar förlora sina bästa kunder först.',
				'Det här är inte bara ett problem, det är en marknadskris. Har ni funderat på att ta drastiska åtgärder?'
			],
			'hr': [
				'Jag tror att ni underskattar den personalmässiga påverkan. De flesta företag i er situation har redan förlorat 30-50% av sina bästa medarbetare.',
				'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
				'Jag har sett detta mönster förut - HR som väntar för länge brukar förlora sina bästa talanger först.',
				'Det här är inte bara ett problem, det är en personalmässig kris. Har ni funderat på att ta drastiska åtgärder?'
			]
		}
	};

	const clusterInsights = challengerInsights[currentCluster] || {};
	const roleSpecificInsights = clusterInsights[roleContext.role] || clusterInsights['default'] || [
		'Jag tror att ni underskattar problemets omfattning. De flesta företag i er situation har redan förlorat betydligt mer än de tror.',
		'Baserat på min erfarenhet brukar detta problem kosta företag 2-3x mer än de initialt tror.',
		'Jag har sett detta mönster förut - företag som väntar för länge brukar förlora sina bästa medarbetare först.'
	];

	const base = roleSpecificInsights[Math.floor(Math.random() * roleSpecificInsights.length)];
	return tailorByRole(base);
};


