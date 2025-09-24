import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-white text-slate-900">
			{/* Hero */}
			<section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 to-blue-800">
				<div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
					<div className="mx-auto max-w-3xl text-center text-white">
						<p className="text-sm font-semibold uppercase tracking-wider text-yellow-500">{APP_NAME}</p>
						<h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Recta - Strategisk Rekryteringsförberedelse</h1>
						<p className="mt-4 text-lg text-blue-100">Eliminera dåliga rekryteringar genom AI-driven analys</p>
						<p className="mt-2 text-blue-200">Strukturerad 6-stegs process som avslöjar dolda behov och minimerar risker</p>
						<div className="mt-10">
							<Link
								href="/arena"
								className="inline-flex items-center rounded-md bg-yellow-500 px-8 py-4 text-blue-900 shadow-lg transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-blue-900"
							>
								Starta Analys
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="bg-white">
				<div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
					<h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Varför {APP_NAME}?</h2>
					<p className="mt-2 text-slate-600">Byggt för beslutsfattare som kräver tydlighet, struktur och precision.</p>
					<div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
							<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">1</div>
							<h3 className="text-base font-semibold text-blue-900">6-stegs strukturerad process</h3>
							<p className="mt-2 text-sm text-slate-600">Guidar dig genom tydliga steg för att säkerställa komplett analys före beslut.</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
							<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">2</div>
							<h3 className="text-base font-semibold text-blue-900">AI-guidad informationsinsamling</h3>
							<p className="mt-2 text-sm text-slate-600">Ställ rätt frågor och upptäck dolda behov med AI-stöd i realtid.</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
							<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">3</div>
							<h3 className="text-base font-semibold text-blue-900">Professionell rapportgenerering</h3>
							<p className="mt-2 text-sm text-slate-600">Skapa en tydlig och professionell PDF-rapport för beslut och delning.</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
							<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">4</div>
							<h3 className="text-base font-semibold text-blue-900">Riskminimering och alternativanalys</h3>
							<p className="mt-2 text-sm text-slate-600">Identifiera risker, jämför alternativ och ta välgrundade beslut.</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
