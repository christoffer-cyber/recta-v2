import { CONVERSATION_SCENARIOS, TestResult, TestReport, TestScenario } from './conversation-scenarios.js';
import { analyzeMessage, updateClusterProgress, canProgressToNext, detectRoleContext, calculateCumulativeProgress } from '../lib/cluster-engine.js';
import type { ClusterProgress } from '../lib/clusters.js';

export class ConversationTestRunner {
	private results: TestResult[] = [];

	async runAllTests(): Promise<TestReport> {
		console.log('🚀 Starting automated conversation testing...\n');
		
		this.results = [];
		
		for (const scenario of CONVERSATION_SCENARIOS) {
			console.log(`📋 Testing: ${scenario.name}`);
			console.log(`   Description: ${scenario.description}`);
			
			const result = await this.runScenario(scenario);
			this.results.push(result);
			
			// Display immediate results
			const status = result.passed ? '✅ PASS' : '❌ FAIL';
			console.log(`   ${status} - Final confidence: ${result.confidence}%`);
			console.log(`   Expected: ${scenario.expectedProgression.join(' → ')}%`);
			console.log(`   Actual: ${result.actualProgression.join(' → ')}%`);
			
			if (!result.passed) {
				console.log(`   Issues: ${result.errors.join(', ')}`);
			}
			console.log('');
		}
		
		return this.generateReport();
	}

	private async runScenario(scenario: TestScenario): Promise<TestResult> {
		const actualProgression: number[] = [];
		const errors: string[] = [];
        let currentProgress: ClusterProgress = {
            confidence: 0,
            status: 'not-started',
            collectedInfo: []
        };

		// Detect role context from all messages
		const roleContext = detectRoleContext(scenario.messages);
		console.log(`🔍 Role context detected: ${roleContext.role} (${roleContext.seniority})`);

		// Process each user message in the scenario
		for (let i = 0; i < scenario.messages.length; i++) {
			const message = scenario.messages[i];
			
			if (message.role === 'user') {
				// Analyze the user message with role context
				const analysis = analyzeMessage(message.content, scenario.cluster, roleContext);
				
				// Update progress
				currentProgress = updateClusterProgress(currentProgress, analysis, message.content);
				
				// Record confidence
				actualProgression.push(currentProgress.confidence);
				
				// Check for progression issues
				if (i > 0 && actualProgression[i] < actualProgression[i - 1]) {
					errors.push(`Confidence regression: ${actualProgression[i - 1]}% → ${actualProgression[i]}%`);
				}
			}
		}

		// Validate against expected progression
		const passed = this.validateProgression(scenario, actualProgression, errors);
		
		// Get final analysis with role context
		const finalMessage = scenario.messages[scenario.messages.length - 1];
		const finalAnalysis = analyzeMessage(finalMessage.content, scenario.cluster, roleContext);
		
		// Calculate cumulative progress
		const cumulativeProgress = calculateCumulativeProgress(scenario.messages, scenario.cluster, roleContext);
		console.log(`🔍 Cumulative progress: ${cumulativeProgress.gatheredInsights.length}/${cumulativeProgress.totalInsights} insights, readiness: ${cumulativeProgress.phaseReadiness}`);
		
		return {
			scenario,
			actualProgression,
			passed,
			confidence: currentProgress.confidence,
			categories: finalAnalysis.matchedInfo,
			missingInfo: finalAnalysis.missingInfo,
			errors
		};
	}

	private validateProgression(scenario: TestScenario, actual: number[], errors: string[]): boolean {
		let passed = true;
		
		// Check if we have the right number of data points
		if (actual.length !== scenario.expectedProgression.length) {
			errors.push(`Wrong number of progression points: expected ${scenario.expectedProgression.length}, got ${actual.length}`);
			passed = false;
		}
		
		// Check each progression point
		for (let i = 0; i < Math.min(actual.length, scenario.expectedProgression.length); i++) {
			const expected = scenario.expectedProgression[i];
			const tolerance = scenario.tolerance;
			const minExpected = expected - tolerance;
			const maxExpected = expected + tolerance;
			
			if (actual[i] < minExpected || actual[i] > maxExpected) {
				errors.push(`Point ${i + 1}: expected ${expected}% (±${tolerance}%), got ${actual[i]}%`);
				passed = false;
			}
		}
		
		// Check final confidence meets completion criteria
		const finalConfidence = actual[actual.length - 1];
		if (finalConfidence < scenario.completionCriteria.minConfidence) {
			errors.push(`Final confidence ${finalConfidence}% below minimum ${scenario.completionCriteria.minConfidence}%`);
			passed = false;
		}
		
		return passed;
	}

	private generateReport(): TestReport {
		const totalTests = this.results.length;
		const passedTests = this.results.filter(r => r.passed).length;
		const failedTests = totalTests - passedTests;
		const passRate = (passedTests / totalTests) * 100;
		
		// Calculate average confidence
		const averageConfidence = this.results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
		
		// Find common issues
		const allErrors = this.results.flatMap(r => r.errors);
		const errorCounts = allErrors.reduce((acc, error) => {
			acc[error] = (acc[error] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		const commonIssues = Object.entries(errorCounts)
			.filter(([_, count]) => count > 1)
			.sort((a, b) => b[1] - a[1])
			.map(([error, _]) => error);
		
		// Generate recommendations
		const recommendations: string[] = [];
		
		if (passRate < 80) {
			recommendations.push('Consider recalibrating confidence scoring thresholds');
		}
		
		if (averageConfidence < 50) {
			recommendations.push('Confidence scores may be too low - review base scoring');
		}
		
		if (commonIssues.some(issue => issue.includes('regression'))) {
			recommendations.push('Address confidence regression issues in scoring logic');
		}
		
		if (commonIssues.some(issue => issue.includes('categories'))) {
			recommendations.push('Review category detection patterns');
		}
		
		return {
			totalTests,
			passedTests,
			failedTests,
			passRate,
			results: this.results,
			summary: {
				averageConfidence,
				commonIssues,
				recommendations
			}
		};
	}

	displayReport(report: TestReport): void {
		console.log('📊 CONVERSATION TEST REPORT');
		console.log('=' .repeat(50));
		console.log(`Total Tests: ${report.totalTests}`);
		console.log(`Passed: ${report.passedTests} (${report.passRate.toFixed(1)}%)`);
		console.log(`Failed: ${report.failedTests}`);
		console.log(`Average Confidence: ${report.summary.averageConfidence.toFixed(1)}%`);
		console.log('');
		
		if (report.summary.commonIssues.length > 0) {
			console.log('🔍 Common Issues:');
			report.summary.commonIssues.forEach(issue => {
				console.log(`   • ${issue}`);
			});
			console.log('');
		}
		
		if (report.summary.recommendations.length > 0) {
			console.log('💡 Recommendations:');
			report.summary.recommendations.forEach(rec => {
				console.log(`   • ${rec}`);
			});
			console.log('');
		}
		
		console.log('📋 Detailed Results:');
		console.log('-'.repeat(50));
		
		report.results.forEach((result, index) => {
			const status = result.passed ? '✅' : '❌';
			console.log(`${index + 1}. ${status} ${result.scenario.name}`);
			console.log(`   Expected: ${result.scenario.expectedProgression.join(' → ')}%`);
			console.log(`   Actual: ${result.actualProgression.join(' → ')}%`);
			console.log(`   Final: ${result.confidence}%`);
			
			if (!result.passed && result.errors.length > 0) {
				console.log(`   Errors: ${result.errors.join(', ')}`);
			}
			console.log('');
		});
	}
}
