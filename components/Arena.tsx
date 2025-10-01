"use client";

import { useState, useMemo, useEffect } from "react";
import { ClusterType, ClusterProgress, CLUSTERS, getClusterById } from "@/lib/clusters";
import { getNextAdaptiveQuestion, generatePhaseTransition, RoleContext } from "@/lib/cluster-engine";
import type { CumulativeProgress } from "@/lib/engine-types";

interface ConversationMessage {
	role: "assistant" | "user";
	content: string;
}

interface SessionState {
	messages: ConversationMessage[];
	currentCluster: ClusterType;
	clusterProgress: Record<ClusterType, ClusterProgress>;
	phaseCompleted: boolean;
	timestamp: number;
}

// Session persistence utilities
const SESSION_KEY = 'recta-arena-session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const saveSessionState = (state: Omit<SessionState, 'timestamp'>) => {
	try {
		const sessionState: SessionState = {
			...state,
			timestamp: Date.now()
		};
		localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
		console.log('💾 Session state saved');
	} catch (error) {
		console.warn('⚠️ Failed to save session state:', error);
	}
};

const loadSessionState = (): SessionState | null => {
	try {
		const saved = localStorage.getItem(SESSION_KEY);
		if (!saved) return null;
		
		const sessionState: SessionState = JSON.parse(saved);
		
		// Check if session is expired
		if (Date.now() - sessionState.timestamp > SESSION_EXPIRY) {
			clearSessionState();
			return null;
		}
		
		console.log('💾 Session state loaded');
		return sessionState;
	} catch (error) {
		console.warn('⚠️ Failed to load session state:', error);
		clearSessionState();
		return null;
	}
};

const clearSessionState = () => {
	try {
		localStorage.removeItem(SESSION_KEY);
		console.log('💾 Session state cleared');
	} catch (error) {
		console.warn('⚠️ Failed to clear session state:', error);
	}
};

// Simple markdown formatter for assistant messages
const formatMarkdown = (text: string): string => {
	return text
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\n/g, '<br/>')
		.replace(/^• /gm, '&bull; ')
		.replace(/^- /gm, '&bull; ');
};

export function Arena() {
	// Initialize state with session restoration
	const [currentCluster, setCurrentCluster] = useState<ClusterType>('pain-point');
	const [clusterProgress, setClusterProgress] = useState<Record<ClusterType, ClusterProgress>>(() => {
		const initial: Record<ClusterType, ClusterProgress> = {} as Record<ClusterType, ClusterProgress>;
		CLUSTERS.forEach(cluster => {
			initial[cluster.id] = {
				confidence: 0,
				status: 'not-started',
				collectedInfo: []
			};
		});
		initial['pain-point'].status = 'in-progress';
		return initial;
	});

	const [messages, setMessages] = useState<ConversationMessage[]>([
		{
			role: "assistant",
			content:
				"Välkommen till Recta. Vi kommer att leda dig genom en strukturerad analys för att säkerställa välgrundade rekryteringsbeslut. Börja med att kort beskriva er nuvarande rekryteringssituation.",
		},
	]);
	const [input, setInput] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [phaseCompleted, setPhaseCompleted] = useState<boolean>(false);
	const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
	const [sessionRestored, setSessionRestored] = useState<boolean>(false);
	const [debugMode, setDebugMode] = useState<boolean>(false);
	const [roleContext, setRoleContext] = useState<RoleContext | null>(null);
	const [cumulativeProgress, setCumulativeProgress] = useState<CumulativeProgress | null>(null);
	const [quickResponses, setQuickResponses] = useState<string[]>([]);
	const [serverAnalysis, setServerAnalysis] = useState<{ confidence: number; quality: 'low' | 'medium' | 'high'; categoriesCovered: number; missingInsights: string[] } | null>(null);
	const [serverCanProgress, setServerCanProgress] = useState<boolean>(false);
	
	// Report generation state
	const [report, setReport] = useState<{
		content: string;
		timestamp: string;
		phase: number;
		informationGaps: Array<{
			priority: 'High' | 'Medium' | 'Low';
			question: string;
			suggestedFollowUp: string;
		}>;
		isDraft: boolean;
	} | null>(null);
	const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
	const [showReportModal, setShowReportModal] = useState<boolean>(false);

	const currentClusterData = useMemo(() => getClusterById(currentCluster), [currentCluster]);
	const currentProgress = clusterProgress[currentCluster];
	const currentIndex = useMemo(() => CLUSTERS.findIndex(c => c.id === currentCluster), [currentCluster]);
	// Show progression CTA when server says it's possible AND confidence meets threshold (70%)
	const canShowNext = useMemo(() => {
		const conf = Math.round(serverAnalysis?.confidence || currentProgress.confidence);
		return !!serverCanProgress && conf >= 70;
	}, [serverCanProgress, serverAnalysis, currentProgress]);
	const overallConfidence = useMemo(() => {
		const total = Object.values(clusterProgress).reduce((sum, progress) => sum + progress.confidence, 0);
		return Math.round(total / CLUSTERS.length);
	}, [clusterProgress]);

	// Session restoration on component mount
	useEffect(() => {
		const savedState = loadSessionState();
		if (savedState) {
			console.log('🔄 Restoring session state...');
			setMessages(savedState.messages);
			setCurrentCluster(savedState.currentCluster);
			setClusterProgress(savedState.clusterProgress);
			setPhaseCompleted(savedState.phaseCompleted);
			setSessionRestored(true);
		} else {
			setSessionRestored(true);
		}
	}, []);

// Note: Role context now comes from server; cumulative progression disabled for now
useEffect(() => {
	// Keep hook for future server-driven cumulative logic
}, [messages, currentCluster]);

	// Save state after each message
	useEffect(() => {
		if (sessionRestored && messages.length > 1) {
			saveSessionState({
				messages,
				currentCluster,
				clusterProgress,
				phaseCompleted
			});
		}
	}, [messages, currentCluster, clusterProgress, phaseCompleted, sessionRestored]);

	// Clear session when analysis is completed
	useEffect(() => {
		if (phaseCompleted) {
			console.log('🎉 Analysis completed - clearing session state');
			clearSessionState();
		}
	}, [phaseCompleted]);

	// Handle starting fresh
	const handleStartFresh = () => {
		if (confirm('Är du säker på att du vill börja om? Alla dina svar kommer att försvinna.')) {
			clearSessionState();
			// Also clear any legacy/progressive keys that might linger
			try { localStorage.removeItem('recta_cluster_progress'); } catch {}
			// Reset to initial state
			setMessages([
				{
					role: "assistant",
					content:
						"Välkommen till Recta. Vi kommer att leda dig genom en strukturerad analys för att säkerställa välgrundade rekryteringsbeslut. Börja med att kort beskriva er nuvarande rekryteringssituation.",
				},
			]);
			setCurrentCluster('pain-point');
			setClusterProgress(() => {
				const initial: Record<ClusterType, ClusterProgress> = {} as Record<ClusterType, ClusterProgress>;
				CLUSTERS.forEach(cluster => {
					initial[cluster.id] = {
						confidence: 0,
						status: 'not-started',
						collectedInfo: []
					};
				});
				initial['pain-point'].status = 'in-progress';
				return initial;
			});
			setPhaseCompleted(false);
			setIsTransitioning(false);
			setError('');
			setInput('');
			setQuickResponses([]);
			setServerAnalysis(null);
			setServerCanProgress(false);
			setRoleContext(null);
			setReport(null);
			setShowReportModal(false);
			console.log('🔄 Started fresh session');
		}
	};

	async function handleSendMessage(customMessage?: string) {
		const raw = customMessage ?? input.trim();
		const messageToSend = typeof raw === 'string' ? raw : input.trim();
		if (!messageToSend || isLoading || phaseCompleted) return;
		setError("");
		const userMessage: ConversationMessage = { role: "user", content: messageToSend };
		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);
		setInput("");
		setQuickResponses([]); // Clear quick responses when sending a message
		setIsLoading(true);

		try {
			// Debug: Log user message
			console.log('🔍 DEBUG - User message:', messageToSend);
			console.log('🔍 DEBUG - Current cluster:', currentCluster);
			
			// Call Claude API for actual conversation (server-authoritative analysis)
			console.log('🔍 DEBUG - Calling Claude API...');
			
			// Add client-side timeout protection
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 22000);
			const res = await fetch("/api/arena/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					messages: nextMessages,
					currentCluster: currentCluster,
					clusterProgress: clusterProgress[currentCluster]
				}),
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			console.log('🔍 DEBUG - API response status:', res.status);
			
			const data = await res.json();
			console.log('🔍 DEBUG - API response data:', data);
			
			if (!res.ok || data?.error) {
				throw new Error(data?.error || "Något gick fel vid förfrågan.");
			}

			// Use Claude's response and server analysis
			const assistantResponse = data.message ?? "";
			const quickResponseSuggestions = data.quickResponses ?? [];
			const serverRole: RoleContext | null = data.roleContext || null;
			const serverAnal = data.analysis || null;
			const apiCanProgress: boolean = !!data.canProgressToNext;
			console.log('🔍 DEBUG - Claude response:', assistantResponse);
			console.log('🔍 DEBUG - Quick response suggestions:', quickResponseSuggestions);
			console.log('🔍 DEBUG - Server roleContext:', serverRole);
			console.log('🔍 DEBUG - Server analysis:', serverAnal);
			console.log('🔍 DEBUG - Server canProgressToNext:', apiCanProgress);
			
			// Update quick responses state
			setQuickResponses(quickResponseSuggestions);

			// Update local role context and analysis from server
			if (serverRole) setRoleContext(serverRole);
			if (serverAnal) {
				setServerAnalysis(serverAnal);
				console.log('🔍 ARENA - Server confidence received:', serverAnal.confidence);
			}
			setServerCanProgress(apiCanProgress);

			// IMMEDIATELY update cluster progress using server confidence
			if (serverAnal?.confidence !== undefined) {
				setClusterProgress(prev => {
					const updated = {
						...prev,
						[currentCluster]: {
							...prev[currentCluster],
							status: prev[currentCluster].status || 'in-progress',
							confidence: Math.round(serverAnal.confidence)
						}
					};
					console.log('🔍 ARENA - Updated clusterProgress with server confidence:', Math.round(serverAnal.confidence));
					console.log('🔍 ARENA - New currentProgress will be:', updated[currentCluster].confidence);
					return updated;
				});
			}

			// Phase completion from server
			if (apiCanProgress) {
				console.log('🔍 ARENA - Phase completion detected - ALL requirements met');
				// Trigger extraction if this was the last phase
				if (currentCluster === 'alternatives-risks') {
					try {
						const resExtract = await fetch('/api/extract', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ messages: nextMessages })
						});
						console.log('🔍 ARENA - Extraction triggered, status:', resExtract.status);
					} catch (e) {
						console.warn('⚠️ ARENA - Extraction trigger failed', e);
					}
				}
				setPhaseCompleted(true);
			}
			
			const assistantMessage: ConversationMessage = { role: "assistant", content: String(assistantResponse ?? '') };
			setMessages((prev) => [...prev, assistantMessage]);

		} catch (e: any) {
			if (e?.name === 'AbortError') {
				setError('Tidsgräns nåddes vid kontakt med assistenten. Försök igen.');
			} else {
				setError(e?.message || "Ett oväntat fel inträffade.");
			}
		} finally {
			setIsLoading(false);
		}
	}

	// Report generation function
	async function handleGenerateReport() {
		const readyForFinalReport = currentIndex === (CLUSTERS.length - 1) && (overallConfidence > 85) && !!roleContext;
		if (!readyForFinalReport) {
			setError('Rapport kan bara genereras när sista fasen är aktiv och total säkerhet > 85%.');
			return;
		}

		setIsGeneratingReport(true);
		setError('');

		try {
			const currentPhase = currentIndex + 1;
			
			const response = await fetch('/api/reports/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationHistory: messages,
					roleContext,
					currentPhase
				})
			});

			if (!response.ok) {
				let message = 'Failed to generate report';
				try {
					const errorData = await response.json();
					message = errorData.error || message;
				} catch {}
				throw new Error(message);
			}

			const data = await response.json();
			setReport({
				content: data.report,
				timestamp: data.timestamp,
				phase: data.phase,
				informationGaps: data.informationGaps || [],
				isDraft: data.isDraft
			});
			setShowReportModal(true);
			
			console.log('📊 Report generated successfully');
		} catch (error: any) {
			console.error('Failed to generate report:', error);
			setError(error.message || 'Failed to generate report');
		} finally {
			setIsGeneratingReport(false);
		}
	}

	function handleNextPhase() {
		const currentIndex = CLUSTERS.findIndex(c => c.id === currentCluster);
		if (currentIndex < CLUSTERS.length - 1) {
			setIsTransitioning(true);
			
			// Show clearing message briefly
			const clearingMessage: ConversationMessage = {
				role: "assistant",
				content: "Rensar konversation och förbereder nästa fas..."
			};
			setMessages([clearingMessage]);
			
			// Brief transition delay for "chapter turning" effect
			setTimeout(() => {
				const nextCluster = CLUSTERS[currentIndex + 1].id;
				setCurrentCluster(nextCluster);
				
				// Update progress status
				setClusterProgress(prev => ({
					...prev,
					[currentCluster]: { ...prev[currentCluster], status: 'completed' },
					[nextCluster]: { ...prev[nextCluster], status: 'in-progress' }
				}));

				// Reset phase completion state
				setPhaseCompleted(false);
				
				// Clear conversation history and start fresh with phase introduction
				const transition = generatePhaseTransition(currentCluster, nextCluster);
				const freshStartMessage: ConversationMessage = { 
					role: "assistant", 
					content: transition.message 
				};
				setMessages([freshStartMessage]);
				
				setIsTransitioning(false);
			}, 1500); // 1.5 second transition for clearing effect
		}
	}

	function handleExploreMore() {
		// Reset phase completion to allow more exploration
		setPhaseCompleted(false);
		
		// Add a message indicating user wants to explore more
		const exploreMessage: ConversationMessage = {
			role: "assistant",
			content: "Perfekt! Låt oss utforska mer i denna fas. Vad skulle du vilja fördjupa dig i?"
		};
		setMessages(prev => [...prev, exploreMessage]);
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	}

	// Show loading state while restoring session
	if (!sessionRestored) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
					<p className="text-slate-600">Laddar session...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-6xl px-6 py-8">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* LEFT: Conversation area (70%) */}
					<section className="lg:col-span-8">
						<header className="mb-4 flex items-center justify-between">
							<h1 className="text-xl font-semibold text-blue-900">Recta - Strategisk Rekryteringsanalys</h1>
							<div className="flex gap-2">
								<button
									onClick={() => setDebugMode(!debugMode)}
									className={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors ${
										debugMode 
											? 'bg-blue-100 text-blue-700 border-blue-200' 
											: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
									}`}
									title="Visa scoring-detaljer"
								>
									{debugMode ? 'Dölj detaljer' : 'Visa scoring-detaljer'}
								</button>
								<button
									onClick={handleStartFresh}
									className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
									title="Börja om från början"
								>
									Börja om
								</button>
							</div>
						</header>

						<div className="rounded-lg border border-slate-200 bg-white shadow-sm">
							{/* Messages */}
							<div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
								{messages.map((m, i) => (
									<div key={i} className={m.role === "assistant" ? "text-left" : "text-right"}>
										<div
											className={
												"inline-block max-w-[85%] rounded-md px-4 py-2 text-sm " +
												(m.role === "assistant"
													? "bg-slate-50 text-slate-900 border border-slate-200"
													: "bg-blue-900 text-white")
											}
										>
											{m.role === "assistant" ? (
												<div 
													className="prose prose-sm max-w-none"
													dangerouslySetInnerHTML={{ 
														__html: formatMarkdown(m.content) 
													}}
												/>
											) : (
												m.content
											)}
										</div>
									</div>
								))}
								{isLoading && (
									<div className="text-left">
										<div className="inline-block rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">Tänker…</div>
									</div>
								)}
							</div>

						{/* Phase Completion UI */}
							{phaseCompleted && (
								<div className="border-t border-slate-200 p-6">
									<div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
										<div className="mb-4">
											<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
												<span className="text-2xl">✓</span>
											</div>
											<h3 className="text-lg font-semibold text-green-900">
												Fas {CLUSTERS.findIndex(c => c.id === currentCluster) + 1} slutförd
											</h3>
											<p className="mt-2 text-sm text-green-700">
												{currentClusterData?.title}
											</p>
										</div>
										
										<p className="mb-6 text-sm text-green-800">
											Är du redo att gå vidare till nästa fas där vi kommer att utforska {CLUSTERS[CLUSTERS.findIndex(c => c.id === currentCluster) + 1]?.title.toLowerCase()}?
										</p>
										
										<div className="flex gap-3 justify-center">
											<button
												onClick={handleExploreMore}
												className="rounded-md border border-green-300 bg-white px-4 py-2 text-sm text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
											>
												Utforska mer i denna fas
											</button>
											<button
												onClick={handleNextPhase}
												disabled={isTransitioning}
												className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
											>
												{isTransitioning ? "Går vidare..." : "Nästa fas →"}
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Input - Hidden when phase completed */}
							{!phaseCompleted && (
								<div className="border-t border-slate-200 p-4">
									{error && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
									
									{/* Quick Response Suggestions */}
									{quickResponses.length > 0 && (
										<div className="mb-3">
											<div className="text-xs text-slate-500 mb-2">Snabb svar:</div>
											<div className="flex flex-wrap gap-2">
												{quickResponses.map((response, index) => (
													<button
														key={index}
														onClick={() => handleSendMessage(response)}
														disabled={isLoading}
														className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
													>
														{response}
													</button>
												))}
											</div>
										</div>
									)}
									
									<div className="flex gap-2">
										<input
											type="text"
											value={input}
											onChange={(e) => setInput(e.target.value)}
											onKeyDown={onKeyDown}
											placeholder="Beskriv er rekryteringssituation..."
											className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
										/>
										<button onClick={() => handleSendMessage()} disabled={isLoading} className="rounded-md bg-blue-900 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-500">
											Skicka
										</button>
									</div>
								</div>
							)}
						</div>
					</section>

					{/* RIGHT: Cluster Progress (30%) */}
					<aside className="space-y-4 lg:col-span-4">
						{/* Current Phase */}
						<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
							<h2 className="text-base font-semibold text-blue-900">Aktuell fas</h2>
							{currentClusterData && (
								<div className="mt-3">
									<div className="flex items-center gap-2">
										<span className="text-lg">{currentClusterData.icon}</span>
										<span className="text-sm font-medium text-blue-900">{currentClusterData.title}</span>
									</div>
									<p className="mt-2 text-xs text-slate-600">{currentClusterData.description}</p>
									
									{/* Role Context */}
									{roleContext && (
										<div className="mt-2 p-2 bg-blue-50 rounded text-xs">
											<span className="text-blue-700 font-medium">
												{roleContext.role} ({roleContext.seniority})
											</span>
										</div>
									)}
									
									{/* Cumulative Progress */}
									{cumulativeProgress && (
										<div className="mt-3">
											<div className="flex items-center justify-between text-xs text-slate-500">
												<span>Insikter samlade</span>
									<span>{cumulativeProgress.insightsGathered}/{cumulativeProgress.requiredInsights}</span>
											</div>
											<div className="mt-1 h-2 w-full rounded-full bg-slate-200">
												<div 
										className={`h-2 rounded-full bg-blue-500`}
									style={{ width: `${(cumulativeProgress.insightsGathered / Math.max(1, cumulativeProgress.requiredInsights)) * 100}%` }}
												/>
											</div>
									{false && (
												<div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700 font-medium">
													✅ Tillräckliga insikter samlade för {roleContext?.role || 'denna rolltyp'}
													<br />
													<span className="text-green-600">Redo att gå vidare till nästa fas</span>
												</div>
											)}
									{false && (
												<div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 font-medium">
													🎯 Alla kritiska insikter samlade
													<br />
													<span className="text-blue-600">Fas komplett - redo för nästa steg</span>
												</div>
											)}
										</div>
									)}
									
									{/* Fallback to old progress display */}
									{!cumulativeProgress && (
										<div className="mt-3">
											<div className="flex items-center justify-between text-xs text-slate-500">
												<span>Framsteg</span>
												<span>{Math.round(serverAnalysis?.confidence || currentProgress.confidence)}%</span>
											</div>
											<div className="mt-1 h-2 w-full rounded-full bg-slate-200">
												<div 
													className="h-2 rounded-full bg-yellow-500" 
													style={{ width: `${Math.round(serverAnalysis?.confidence || currentProgress.confidence)}%` }}
												/>
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Debug Mode Panel */}
			{debugMode && (
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
								<h2 className="text-base font-semibold text-blue-900 mb-3">Scoring-detaljer</h2>
					<div className="space-y-3 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-slate-600">Kategorier täckta:</span>
							<span className="font-medium text-blue-900">
								{serverAnalysis?.categoriesCovered || 0}/6
							</span>
						</div>
						{(serverAnalysis?.missingInsights?.length || 0) > 0 && (
							<div>
								<span className="text-slate-600">Saknar:</span>
								<div className="mt-1 flex flex-wrap gap-1">
									{serverAnalysis?.missingInsights?.slice(0,6).map((item, idx) => (
										<span key={idx} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">{item}</span>
									))}
								</div>
							</div>
						)}

						{/* Progression signal (pre-completion) */}
						{!phaseCompleted && canShowNext && (
							<div className="border-t border-slate-200 p-4">
								<div className="rounded-md border border-green-200 bg-green-50 p-4 flex items-center justify-between">
									<div className="text-sm text-green-800">
										✅ Tillräcklig framsteg för att gå vidare till nästa fas
									</div>
									<button
										onClick={handleNextPhase}
										className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										Gå vidare →
									</button>
								</div>
							</div>
						)}
						<div className="pt-2 border-t border-blue-200">
							<div className="flex items-center justify-between">
								<span className="text-slate-600">Aktuell poäng:</span>
								<span className="font-bold text-blue-900">
									{(() => {
										const displayConfidence = Math.round(serverAnalysis?.confidence || currentProgress.confidence);
										console.log('🔍 ARENA - Debug panel: serverAnalysis.confidence =', serverAnalysis?.confidence);
										console.log('🔍 ARENA - Debug panel: currentProgress.confidence =', currentProgress.confidence);
										console.log('🔍 ARENA - Debug panel: displaying =', displayConfidence);
										return displayConfidence;
									})()}%
								</span>
							</div>
							<div className="flex items-center justify-between text-xs text-slate-500">
								<span>Kvalitet:</span>
								<span>{serverAnalysis?.quality || 'unknown'}</span>
							</div>
						</div>
					</div>
							</div>
						)}

						{/* Phase Completion */}
					{(() => {
						console.log('🔍 ARENA - Right sidebar completion check (serverCanProgress/conf>=70):', canShowNext);
						return canShowNext;
					})() && (
							<div className="rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm">
								<h2 className="text-base font-semibold text-green-900">Fas slutförd!</h2>
								<p className="mt-2 text-sm text-green-700">Denna fas är tillräckligt utforskad för att gå vidare.</p>
								<button 
									onClick={handleNextPhase}
									className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									Nästa fas →
								</button>
							</div>
						)}

						{/* Overall Progress */}
						<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
							<h2 className="text-base font-semibold text-blue-900">Övergripande framsteg</h2>
							<div className="mt-3">
								<div className="flex items-center justify-between text-xs text-slate-500">
									<span>Total säkerhet</span>
									<span>{overallConfidence}%</span>
								</div>
								<div className="mt-1 h-2 w-full rounded-full bg-slate-200">
									<div 
										className="h-2 rounded-full bg-blue-500" 
										style={{ width: `${overallConfidence}%` }}
									/>
								</div>
							</div>
							<div className="mt-4 space-y-2">
								{CLUSTERS.map((cluster) => {
									const progress = clusterProgress[cluster.id];
									const isActive = cluster.id === currentCluster;
									return (
										<div 
											key={cluster.id}
											className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${
												isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-600'
											}`}
										>
											<div className="flex items-center gap-2">
												<span>{cluster.icon}</span>
										<span>{cluster.title}</span>
											</div>
											<span className={progress.status === 'completed' ? 'text-green-600' : progress.status === 'in-progress' ? 'text-blue-600' : 'text-slate-400'}>
												{progress.status === 'completed' ? '✓' : progress.status === 'in-progress' ? '●' : '○'}
											</span>
										</div>
									);
								})}
							</div>
						</div>

					{/* Generate Report Button */}
					{currentIndex === (CLUSTERS.length - 1) && overallConfidence > 85 && roleContext && (
							<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
								<h2 className="text-base font-semibold text-blue-900">Rapport</h2>
								<p className="mt-2 text-sm text-slate-600">
								Generera slutrapport baserat på fullständig analys
								</p>
								<button
									onClick={handleGenerateReport}
									disabled={isGeneratingReport}
									className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
								{isGeneratingReport ? 'Genererar...' : 'Generera slutrapport'}
								</button>
								{report && (
									<div className="mt-3 text-xs text-slate-500">
										Senast genererad: {new Date(report.timestamp).toLocaleString('sv-SE')}
										{report.isDraft && <span className="ml-2 text-orange-600">(Utkast)</span>}
									</div>
								)}
							</div>
						)}

						{/* Information Gaps */}
						{report && report.informationGaps.length > 0 && (
							<div className="rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm">
								<h2 className="text-base font-semibold text-orange-900">Information som saknas</h2>
								<p className="mt-2 text-sm text-orange-700">
									Fortsätt konversationen för att fylla i dessa luckor, sedan generera om rapporten.
								</p>
								<div className="mt-3 space-y-2">
									{report.informationGaps.map((gap, index) => (
										<div key={index} className="rounded border border-orange-200 bg-white p-3">
											<div className="flex items-center gap-2">
												<span className={`text-xs font-medium px-2 py-1 rounded ${
													gap.priority === 'High' ? 'bg-red-100 text-red-700' :
													gap.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
													'bg-gray-100 text-gray-700'
												}`}>
													{gap.priority}
												</span>
												<span className="text-sm font-medium text-slate-900">{gap.question}</span>
											</div>
											{gap.suggestedFollowUp && (
												<p className="mt-1 text-xs text-slate-600">{gap.suggestedFollowUp}</p>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</aside>
				</div>
			</div>

			{/* Report Modal */}
			{showReportModal && report && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="max-w-4xl w-full mx-4 max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
						<div className="flex items-center justify-between p-6 border-b border-slate-200">
							<div>
								<h2 className="text-xl font-semibold text-slate-900">
									{report.isDraft ? 'Utkast - Rekryteringsanalys' : 'Slutrapport - Rekryteringsanalys'}
								</h2>
								<p className="text-sm text-slate-500">
									Genererad {new Date(report.timestamp).toLocaleString('sv-SE')} • Fas {report.phase}/6
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => {
										const blob = new Blob([report.content], { type: 'text/markdown' });
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.href = url;
										a.download = `rekryteringsanalys-${new Date().toISOString().split('T')[0]}.md`;
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
										URL.revokeObjectURL(url);
									}}
									className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
								>
									Ladda ner
								</button>
								<button
									onClick={() => setShowReportModal(false)}
									className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
								>
									Stäng
								</button>
							</div>
						</div>
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
							<div className="prose max-w-none">
								<pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
									{report.content}
								</pre>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
