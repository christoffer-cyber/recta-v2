import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-white text-slate-900">
			{/* Hero */}
			<section className="relative border-b border-slate-200 bg-white">
				{/* Subtle abstract accent */}
				<div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
					<svg className="absolute right-[-10%] top-[-20%] h-[600px] w-[600px] opacity-[0.08]" viewBox="0 0 600 600" fill="none">
						<defs>
							<radialGradient id="rg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 300) rotate(90) scale(300)">
								<stop offset="0%" stopColor="#1e3a8a" />
								<stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
							</radialGradient>
						</defs>
						<circle cx="300" cy="300" r="280" fill="url(#rg)" />
						<g stroke="#1e3a8a" strokeOpacity="0.25">
							{Array.from({ length: 14 }).map((_, i) => (
								<circle key={i} cx="300" cy="300" r={(i + 1) * 18} />
							))}
						</g>
					</svg>
				</div>

				<div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
					<div className="max-w-4xl">
						<p className="text-xs font-medium uppercase tracking-wider text-slate-500">{APP_NAME}</p>
						<h1 className="mt-3 text-4xl font-semibold leading-tight text-blue-900 sm:text-6xl">Strukturerad beslutsanalys för strategiska rekryteringar</h1>
						<p className="mt-4 max-w-2xl text-lg text-slate-700">Eliminera kostsamma rekryteringsmisslyckanden genom en disciplinerad, evidensbaserad analysprocess.</p>
						<p className="mt-2 max-w-2xl text-slate-600">Validera organisatorisk beredskap, identifiera risker och jämför alternativ innan beslut fattas.</p>
						<div className="mt-10">
							<Link
								href="/arena"
								className="inline-flex items-center rounded-md bg-blue-900 px-7 py-3 text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
							>
								Påbörja Strategisk Analys
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Value Propositions */}
			<section className="bg-white">
				<div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
					<h2 className="text-2xl font-semibold text-blue-900 sm:text-3xl">Affärskritisk tydlighet inför rekryteringsbeslut</h2>
					<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-semibold text-blue-900">Riskminimering och styrning</h3>
							<p className="mt-2 text-sm text-slate-600">Identifiera kritiska risker, definiera mitigeringar och säkra beslutsunderlag som tål granskning.</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-semibold text-blue-900">Validerad organisatorisk beredskap</h3>
							<p className="mt-2 text-sm text-slate-600">Pröva antaganden mot faktiska behov, resurser och målbilder innan investering i en nyckelrekrytering.</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-semibold text-blue-900">Alternativanalys och ROI-fokus</h3>
							<p className="mt-2 text-sm text-slate-600">Jämför scenarier, kvantifiera effekter och stöd beslut som maximerar affärsvärde över tid.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Method summary */}
			<section className="bg-slate-50">
				<div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
					<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-semibold text-blue-900">Disciplinerad metodik i sex faser</h3>
							<p className="mt-2 text-sm text-slate-600">En konsekvent process för att skapa klarhet och beslutskraft: från rollramverk och framgångsprofil till riskbedömning, avvägningar och formell rekommendation.</p>
							<ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
								<li>Strukturerade frågeställningar och evidensinsamling</li>
								<li>Standardiserade beslutsunderlag och sammanställningar</li>
								<li>Spårbar logik för motiverade rekommendationer</li>
							</ul>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-semibold text-blue-900">Professionell framtoning och leverans</h3>
							<p className="mt-2 text-sm text-slate-600">Resultatet är en stringent, professionell rapport som kan delas med ledning och styrelse, med tydlig rational och rekommenderad väg framåt.</p>
							<div className="mt-6">
								<Link href="/arena" className="inline-flex items-center rounded-md bg-blue-900 px-5 py-3 text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-yellow-500">
									Påbörja Strategisk Analys
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
