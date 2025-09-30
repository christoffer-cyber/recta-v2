import { ConversationTestRunner } from './conversation-test-runner.js';

async function main() {
	const runner = new ConversationTestRunner();
	
	try {
		const report = await runner.runAllTests();
		runner.displayReport(report);
		
		// Exit with appropriate code
		process.exit(report.failedTests > 0 ? 1 : 0);
	} catch (error) {
		console.error('❌ Test runner failed:', error);
		process.exit(1);
	}
}

// Run the main function
main();
