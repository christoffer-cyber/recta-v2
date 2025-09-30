export interface UniversalQualityAnalysis {
	categoriesCovered: number;
	specificity: number;
	quantification: number;
	context: number;
	causality: number;
	businessImpact: boolean;
	timingContext: boolean;
	overallScore: number;
}

export function analyzeUniversalQuality(message: string, messageLower: string): UniversalQualityAnalysis {
	const analysis: UniversalQualityAnalysis = {
		categoriesCovered: 0,
		specificity: 0,
		quantification: 0,
		context: 0,
		causality: 0,
		businessImpact: false,
		timingContext: false,
		overallScore: 0
	};

	const situationIndicators = [
		'current','now','currently','present','existing','situation','state','status','growing','growth','development','expansion','scaling',
		'nu','nuvarande','läget','situationen','befintlig','nuläge','status','växande','växer','utveckling','tillväxt','skalning','expansion'
	];
	const hasSituation = situationIndicators.some(indicator => messageLower.includes(indicator));
	if (hasSituation) analysis.categoriesCovered++;

	const gapIndicators = [
		'missing','lack','need','problem','issue','challenge','difficulty','gap','bottleneck','blocking','struggle','struggling','failing','failure','insufficient','inadequate',
		'saknas','brist','behöver','problem','utmaning','svårighet','flaskhals','stoppar','räcker inte','inte tillräckligt','otillräcklig','kämpar','kämpar med','misslyckas','misslyckande'
	];
	const hasGap = gapIndicators.some(indicator => messageLower.includes(indicator));
	if (hasGap) analysis.categoriesCovered++;

	const impactIndicators = [
		'impact','affect','influence','result','consequence','outcome','performance','efficiency','productivity','revenue','cost','loss','profit','margin','growth','scaling','competitiveness','market position','customer satisfaction',
		'development','system','integration','scalability','technology','innovation','digital','automation','optimization','security','reliability','uptime','performance','speed','capacity',
		'sales','pipeline','conversion','marketing','leads','customers','acquisition','retention','churn','revenue','market share','brand','positioning','campaign','funnel',
		'operations','processes','delivery','quality','supply chain','logistics','manufacturing','production','service','support','customer service','satisfaction','retention',
		'strategy','vision','transformation','leadership','management','culture','team','organization','change','initiative','project','program','goals','objectives','mission',
		'påverkar','påverkan','konsekvens','utfall','prestanda','effektivitet','produktivitet','intäkt','omsättning','kostnad','förlust','lönsamhet','marginal','kassaflöde','cash flow','churn','tillväxt','skalning','konkurrenskraft','marknadsposition','kundnöjdhet','utveckling','system','integration','skalbarhet','teknologi','innovation','digital','automatisering','optimering','säkerhet','tillförlitlighet','drift','hastighet','kapacitet','försäljning','pipeline','konvertering','marknadsföring','leads','kunder','förvärv','behållning','marknadsandel','varumärke','positionering','kampanj','tratt','operationer','processer','leverans','kvalitet','leveranskedja','logistik','tillverkning','produktion','service','support','kundservice','strategi','vision','transformation','ledarskap','ledning','kultur','team','organisation','förändring','initiativ','projekt','program','mål','uppdrag'
	];
	const hasImpact = impactIndicators.some(indicator => messageLower.includes(indicator));
	if (hasImpact) {
		analysis.categoriesCovered++;
		analysis.businessImpact = true;
	}

	const stakeholderIndicators = [
		'team','customer','user','client','employee','manager','department','company','organization','stakeholder','staff','colleagues','partners','vendors','suppliers','investors','board','executives','leadership','users','end users','internal','external','cross-functional','department','division','unit','group','people','individuals','professionals','specialists','experts','practitioners',
		'teamet','kund','kunder','användare','medarbetare','chef','avdelning','bolag','företag','organisation','intressent','personal','kollegor','partners','leverantörer','investerare','styrelse','ledning','slutanvändare','intern','extern','tvärfunktionell','avdelning','division','enhet','grupp','människor','individer','professionella','specialister','experter','praktiker','våra','vårt','vår','behov','behoven','vårt team','våra kunder','våra användare'
	];
	const hasStakeholder = stakeholderIndicators.some(indicator => messageLower.includes(indicator));
	if (hasStakeholder) analysis.categoriesCovered++;

	const timingIndicators = [
		'urgent','deadline','timeline','schedule','timeframe','soon','immediate','priority','critical','important','now','month','quarter','year','timeline','milestone','launch','release','project','phase','stage','period','window','opportunity','timing','momentum','growth','expansion','scaling','funding','investment','capital','financing','investment','round','funding round',
		'brådskande','deadline','tidslinje','tidplan','snart','omedelbart','prioritet','kritiskt','viktigt','nu','månad','mån','kvartal','år','q1','q2','q3','q4','milstolpe','lansering','release','projekt','fas','steg','period','fönster','möjlighet','timing','momentum','tillväxt','expansion','skalning','finansiering','investering','kapital','finansieringsrunda','investeringsrunda'
	];
	const hasTiming = timingIndicators.some(indicator => messageLower.includes(indicator));
	if (hasTiming) { analysis.categoriesCovered++; analysis.timingContext = true; }

	const scopeIndicators = [
		'scale','size','volume','amount','number','percentage','growth','increase','decrease','expansion','reduction','magnitude','scope','reach','coverage','extent','range','capacity','throughput','output','input','demand','supply','market','global','local','regional','national','international','enterprise','startup','small','medium','large','huge','massive','significant','substantial','considerable','major','minor','micro','macro','10x','x10','2x','3x','5x','10x','100x','1000x',
		'skala','storlek','volym','antal','procent','tillväxt','ökning','minskning','expansion','reduktion','omfattning','räckvidd','täckning','utsträckning','omfång','kapacitet','genomströmning','utdata','indata','efterfrågan','utbud','marknad','global','lokal','regional','nationell','internationell','företag','startup','liten','mellan','stor','enorm','massiv','betydande','betydlig','avsevärd','stor','liten','mikro','makro','10x','x10','2x','3x','5x','10x','100x','1000x'
	];
	const hasScope = scopeIndicators.some(indicator => messageLower.includes(indicator));
	if (hasScope) analysis.categoriesCovered++;

	analysis.specificity = analyzeSpecificity(message, messageLower);
	analysis.quantification = analyzeQuantification(message, messageLower);
	analysis.context = analyzeContext(message, messageLower);
	analysis.causality = analyzeCausality(message, messageLower);
	analysis.overallScore = (analysis.specificity + analysis.quantification + analysis.context + analysis.causality) / 4;
	return analysis;
}

export function analyzeSpecificity(message: string, messageLower: string): number {
	let score = 0;
	const genericPhrases = ['we need someone', 'looking for', 'hire', 'recruit', 'find', 'get'];
	const hasGeneric = genericPhrases.some(phrase => messageLower.includes(phrase));
	if (hasGeneric && message.length < 100) score = 1;
	const specificRoleIndicators = [
		'senior','junior','lead','principal','architect','engineer','developer','manager','director','specialist','coordinator','analyst','consultant','advisor','expert','practitioner',
		'tech lead','tech lead','frontend','backend','fullstack','devops','sre','data scientist','data engineer','ml engineer','ai engineer','mobile developer','web developer',
		'sales manager','account manager','business development','marketing manager','growth manager','revenue manager','partnership manager','customer success','sales director','cmo','cpo',
		'operations manager','process manager','quality manager','supply chain','logistics','production manager','service manager','support manager','customer service','operations director',
		'ceo','cto','cfo','coo','vp','vice president','head of','chief','executive','founder','co-founder','president','chairman',
		'ekonomifunktionen','ekonomi','ekonom','ekonomi-','ekonomi-avdelning','utvecklare','utveckling','teknik','försäljning','marknadsföring','operationer','ledning','chef','direktör','specialist','expert','praktiker'
	];
	if (specificRoleIndicators.some(indicator => messageLower.includes(indicator))) score = 2;
	const technicalIndicators = [
		'react','python','aws','kubernetes','microservices','api','database','frontend','backend','devops','node','javascript','typescript','java','c#','go','rust','php','ruby','swift','kotlin',
		'azure','gcp','docker','terraform','ansible','jenkins','gitlab','github','ci/cd','cicd','deployment','infrastructure','monitoring','logging','security',
		'machine learning','ml','ai','artificial intelligence','data science','analytics','big data','sql','nosql','mongodb','postgresql','mysql','redis','elasticsearch',
		'crm','erp','saas','paas','iaas','b2b','b2c','ecommerce','fintech','healthtech','edtech','martech','adtech','proptech',
		'utveckling','system','integration','skalbarhet','teknologi','innovation','digital','automatisering','optimering','säkerhet','tillförlitlighet','drift','hastighet','kapacitet'
	];
	if (technicalIndicators.some(indicator => messageLower.includes(indicator))) score = 3;
	const verySpecificIndicators = [
		'version','framework','tool','platform','technology','methodology','process','workflow','architecture','pattern','design','implementation','configuration','setup','deployment',
		'strategy','tactics','approach','method','technique','practice','standard','protocol','procedure','guideline','policy','rule','regulation','compliance','governance',
		'kpi','metric','measurement','indicator','benchmark','target','goal','objective','milestone','deadline','timeline','roadmap','budget','cost','roi','roas','ltv','cac',
		'version','ramverk','verktyg','plattform','teknologi','metodologi','process','arbetsflöde','arkitektur','mönster','design','implementering','konfiguration','setup','deployment','strategi','taktik','approach','metod','teknik','praxis','standard','protokoll','procedur','riktlinje','policy','regel','reglering','compliance','styrning','nyckeltal','mätvärde','indikator','riktmärke','mål','objektiv','milstolpe','deadline','tidslinje','vägkarta','budget','kostnad','roi','roas','ltv','cac'
	];
	if (verySpecificIndicators.some(indicator => messageLower.includes(indicator))) score = 4;
	return Math.min(score, 4);
}

export function analyzeQuantification(message: string, messageLower: string): number {
	let score = 0;
	const numberPattern = /\b\d+[\d,.]*\b/g;
	const rangePattern = /\b\d+[\d,.]*\s?[–-]\s?\d+[\d,.]*\b/g;
	const numbers = [ ...(message.match(rangePattern) || []), ...(message.match(numberPattern) || []) ];
	if (numbers && numbers.length > 0) { score += Math.min(numbers.length, 2); }
	const timeIndicators = ['day','week','month','quarter','year','hour','minute','second','dag','vecka','månad','kvartal','år','timme','minut','sekund','mån'];
	if (timeIndicators.some(indicator => messageLower.includes(indicator))) score += 1;
	const percentagePattern = /\d+%/g;
	if (message.match(percentagePattern)) score += 1;
	const moneyPattern = /(\$|€|£)?\s?\d+[\d,\.]*\s?(k|m|mn|mnkr|tkr|kr|million|thousand)?/gi;
	if (message.match(moneyPattern)) score += 1;
	return Math.min(score, 4);
}

export function analyzeContext(message: string, messageLower: string): number {
	let score = 0;
	const businessContext = ['company','organization','startup','enterprise','team','department','project','product','företag','bolag','organisation','teamet','avdelning','projekt','produkt','växande företag','växande bolag'];
	if (businessContext.some(indicator => messageLower.includes(indicator))) score += 1;
	const industryContext = ['tech','finance','healthcare','retail','manufacturing','consulting','agency','saas'];
	if (industryContext.some(indicator => messageLower.includes(indicator))) score += 1;
	const marketContext = ['market','competition','customer','user','client','demand','growth','expansion','marknad','konkurrens','kund','användare','efterfrågan','tillväxt','expansion','växande'];
	if (marketContext.some(indicator => messageLower.includes(indicator))) score += 1;
	const strategicContext = ['strategy','goal','objective','mission','vision','roadmap','plan','initiative'];
	if (strategicContext.some(indicator => messageLower.includes(indicator))) score += 1;
	return Math.min(score, 4);
}

export function analyzeCausality(message: string, messageLower: string): number {
	let score = 0;
	const causalIndicators = [
		'because','due to','as a result','therefore','since','caused by','leads to','results in',
		'eftersom','på grund av','som ett resultat','därför','leder till','resulterar i','uppstår när','medför',
		'medan','samtidigt som','trots att','fastän','därför att','eftersom att','på grund av att'
	];
	if (causalIndicators.some(indicator => messageLower.includes(indicator))) score += 2;
	const problemSolution = [
		'solve','fix','address','resolve','improve','enhance','optimize','streamline',
		'lösa','åtgärda','hantera','förbättra','optimera','effektivisera','måste',
		'behöver','kräver','saknar','brist','problem','utmaning','svårighet'
	];
	if (problemSolution.some(indicator => messageLower.includes(indicator))) score += 1;
	const consequenceIndicators = [
		'if not','otherwise','without','failing to','unable to','cannot','will not',
		'om inte','annars','utan','kan inte','kommer inte',
		'förlorat','förlorar','missar','missat','går miste om','tappar','tappat',
		'inte kunde','inte kan','inte klarar','inte lyckas','inte fungerar'
	];
	if (consequenceIndicators.some(indicator => messageLower.includes(indicator))) score += 1;
	const comparativeImpact = [ 'while','whereas','compared to','versus','vs','but','however', 'medan','samtidigt','jämfört med','mot','men','dock','däremot', 'växer','växte','når','nådde','ökar','ökade','minskar','minskat' ];
	if (comparativeImpact.some(indicator => messageLower.includes(indicator))) score += 1;
	return Math.min(score, 4);
}


