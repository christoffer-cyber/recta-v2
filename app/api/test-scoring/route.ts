import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/cluster-engine';

// Test scenarios for different roles and industries
const testScenarios = [
    // TECH ROLES
    {
        category: "Tech Roles",
        tests: [
            {
                name: "Senior Backend Developer - Scaling Team",
                messages: [
                    "Vi behöver en Senior Backend Developer för vårt skalningsteam",
                    "Vi har problem med vår nuvarande backend-arkitektur som inte klarar av vår tillväxt. Våra API:er blir långsamma när vi får mer trafik och vi behöver någon som kan implementera microservices för att hantera vår skalning.",
                    "Detta påverkar våra användare negativt eftersom applikationen blir långsam och ibland kraschar. Vi förlorar kunder till konkurrenter och vår utveckling stannar upp. Vi behöver någon som kan öka vår systemprestanda med 300% och implementera automatisk skalning.",
                    "Vårt utvecklingsteam på 8 personer kämpar med denna utmaning varje dag. Vi behöver en expert som kan leda oss genom denna transformation och lära oss moderna arkitekturprinciper. Detta är kritiskt för vår framtid eftersom vi planerar att expandera till nya marknader nästa kvartal."
                ],
                expectedProgression: [15, 35, 65, 80]
            },
            {
                name: "Tech Lead - System Integration",
                messages: [
                    "Vi behöver en Tech Lead för vår systemintegration",
                    "Vi har flera separata system som inte kommunicerar med varandra. Våra kunddata finns i olika databaser och vi kan inte få en helhetsbild av våra kunder. Detta skapar problem för vår försäljning och kundservice.",
                    "Detta kostar oss miljoner i förlorade möjligheter eftersom våra säljare inte vet vilka kunder som redan har våra produkter. Vi behöver någon som kan skapa en enhetlig dataplattform som kan hantera 100,000+ kunder och integrera med våra befintliga system.",
                    "Vi har en deadline på 6 månader för att få detta på plats innan vår stora produktlansering. Vårt team på 12 utvecklare behöver ledning och expertis för att lyckas med denna komplexa integration. Detta är avgörande för vår konkurrenskraft på marknaden."
                ],
                expectedProgression: [20, 40, 70, 85]
            }
        ]
    },
    
    // SALES ROLES
    {
        category: "Sales Roles",
        tests: [
            {
                name: "Säljchef - Nordiska Marknaden",
                messages: [
                    "Vi behöver en säljchef för nordiska marknaden",
                    "Vår nuvarande säljorganisation fungerar inte i de nordiska länderna. Vi har svårt att nå rätt kunder och vår pipeline är tom. Vi behöver någon som förstår de nordiska marknaderna och kan bygga upp vår närvaro där.",
                    "Detta påverkar vår omsättning negativt eftersom vi missar stora möjligheter i Norden. Vi förlorar miljoner i potentiell försäljning varje kvartal. Vi behöver någon som kan öka vår konvertering med 40% och bygga upp en pipeline på 2 miljoner SEK per månad.",
                    "Vårt säljteam på 6 personer behöver ledning och strategi för att lyckas i Norden. Vi har en aggressiv tillväxtplan som kräver att vi når 10 miljoner SEK i omsättning nästa år. Detta är kritiskt för vår expansion och vår position på marknaden."
                ],
                expectedProgression: [18, 38, 68, 82]
            },
            {
                name: "Account Manager - Enterprise Sales",
                messages: [
                    "Vi behöver en Account Manager för enterprise-försäljning",
                    "Vi har problem med att behålla våra stora kunder. Våra enterprise-kunder lämnar oss för konkurrenter och vi förlorar miljoner i återkommande intäkter. Vi behöver någon som kan bygga starka relationer med våra största kunder.",
                    "Detta påverkar vår lönsamhet eftersom enterprise-kunder ger oss högre marginaler. Vi förlorar 5 miljoner SEK per år i churn och vår kundnöjdhet är låg. Vi behöver någon som kan öka vår kundbehållning med 60% och öka vår genomsnittliga kontraktsstorlek med 200%.",
                    "Vi har en kritisk period framför oss eftersom flera av våra största kontrakt går ut nästa kvartal. Vårt team behöver expertis för att förhandla förnyelser och utöka våra relationer. Detta är avgörande för vår framtida tillväxt och stabilitet."
                ],
                expectedProgression: [22, 42, 72, 88]
            }
        ]
    },
    
    // OPERATIONS ROLES
    {
        category: "Operations Roles",
        tests: [
            {
                name: "Operations Manager - Leveransprocesser",
                messages: [
                    "Vi behöver en Operations Manager för våra leveransprocesser",
                    "Våra leveransprocesser fungerar inte effektivt. Vi har problem med att leverera i tid och våra kunder är missnöjda. Vi behöver någon som kan optimera våra processer och förbättra vår leveransprestanda.",
                    "Detta påverkar vår kundnöjdhet eftersom vi missar leveransdatum och får klagomål. Vi förlorar kunder och vår rykte lider. Vi behöver någon som kan minska vår leveranstid med 50% och öka vår leveransprecision till 98%.",
                    "Vi har en aggressiv tillväxtplan som kräver att vi kan hantera 3x fler leveranser nästa år. Vårt team på 15 personer behöver ledning och processförbättringar. Detta är kritiskt för vår skalning och vår konkurrenskraft på marknaden."
                ],
                expectedProgression: [16, 36, 66, 78]
            },
            {
                name: "Quality Manager - Produktionsprocesser",
                messages: [
                    "Vi behöver en Quality Manager för våra produktionsprocesser",
                    "Våra produktionsprocesser har kvalitetsproblem som påverkar våra produkter. Vi får klagomål från kunder och vår rykte lider. Vi behöver någon som kan implementera kvalitetskontrollsystem och förbättra våra processer.",
                    "Detta kostar oss miljoner i återkallningar och kundkompensationer. Vi förlorar förtroende och vår marknadsandel minskar. Vi behöver någon som kan minska våra kvalitetsproblem med 80% och implementera ISO 9001-certifiering.",
                    "Vi har en deadline på 4 månader för att få våra kvalitetsprocesser på plats innan vår stora produktlansering. Vårt team på 20 personer behöver expertis och ledning. Detta är avgörande för vår framtid och vår position på marknaden."
                ],
                expectedProgression: [19, 39, 69, 83]
            }
        ]
    },
    
    // LEADERSHIP ROLES
    {
        category: "Leadership Roles",
        tests: [
            {
                name: "CMO - Växande Team",
                messages: [
                    "Vi behöver en CMO för vårt växande team",
                    "Vår marknadsföring fungerar inte för vår tillväxt. Vi har svårt att nå rätt kunder och vår varumärkesposition är svag. Vi behöver någon som kan utveckla en stark marknadsstrategi och bygga upp vårt varumärke.",
                    "Detta påverkar vår tillväxt eftersom vi inte kan konkurrera effektivt. Vi förlorar marknadsandelar och vår omsättning stagnerar. Vi behöver någon som kan öka vår marknadsandel med 25% och bygga upp ett starkt varumärke som kunder litar på.",
                    "Vi har en aggressiv tillväxtplan som kräver att vi når 50 miljoner SEK i omsättning nästa år. Vårt team på 25 personer behöver strategisk ledning och expertis. Detta är kritiskt för vår framtid och vår position på marknaden."
                ],
                expectedProgression: [21, 41, 71, 86]
            },
            {
                name: "CTO - Teknisk Transformation",
                messages: [
                    "Vi behöver en CTO för vår tekniska transformation",
                    "Vår tekniska organisation behöver omvandling för att möta framtida utmaningar. Vi har legacy-system som begränsar vår innovation och vårt team behöver ledning för att utveckla moderna lösningar. Vi behöver någon som kan driva vår tekniska strategi.",
                    "Detta påverkar vår konkurrenskraft eftersom vi inte kan utveckla nya produkter snabbt nog. Vi förlorar marknadsandelar till mer innovativa konkurrenter. Vi behöver någon som kan modernisera vår tech-stack och öka vår utvecklingshastighet med 200%.",
                    "Vi har en kritisk period framför oss eftersom vi behöver lansera vår nästa generationsprodukt nästa år. Vårt team på 30 utvecklare behöver strategisk ledning och expertis. Detta är avgörande för vår framtid och vår position på marknaden."
                ],
                expectedProgression: [23, 43, 73, 87]
            }
        ]
    }
];

export async function GET(request: NextRequest) {
    try {
        console.log("🧪 Universal Scoring System Test Suite");
        console.log("=====================================");
        console.log("Testing system across different roles and industries...\n");
        
        const results = [];
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        for (const category of testScenarios) {
            console.log(`\n📁 ${category.category}`);
            console.log("=".repeat(category.category.length + 3));
            
            const categoryResults = {
                category: category.category,
                tests: []
            };
            
            for (const test of category.tests) {
                console.log(`\n🔍 ${test.name}`);
                console.log("-".repeat(test.name.length + 3));
                
                totalTests++;
                let testPassed = true;
                const actualProgression = [];
                const testResults = {
                    name: test.name,
                    messages: [],
                    passed: false,
                    actualProgression: [],
                    expectedProgression: test.expectedProgression
                };
                
                for (let i = 0; i < test.messages.length; i++) {
                    const message = test.messages[i];
                    console.log(`\nMessage ${i + 1}: "${message.substring(0, 50)}..."`);
                    
                    try {
                        const analysis = analyzeMessage(message, 'pain-point');
                        const confidence = analysis.confidence;
                        actualProgression.push(confidence);
                        
                        console.log(`  ✅ Confidence: ${confidence}%`);
                        console.log(`  ✅ Quality: ${analysis.quality}`);
                        console.log(`  ✅ Matched Info: ${analysis.matchedInfo.length} items`);
                        
                        testResults.messages.push({
                            message: message.substring(0, 100) + "...",
                            confidence,
                            quality: analysis.quality,
                            matchedInfo: analysis.matchedInfo.length,
                            missingInfo: analysis.missingInfo.length
                        });
                        
                        // Check if confidence is within expected range
                        const expected = test.expectedProgression[i];
                        const tolerance = 15; // Allow 15% tolerance
                        if (Math.abs(confidence - expected) > tolerance) {
                            console.log(`  ⚠️  Expected: ${expected}% (tolerance: ±${tolerance}%)`);
                            testPassed = false;
                        }
                        
                    } catch (error) {
                        console.log(`  ❌ Error: ${error.message}`);
                        testPassed = false;
                        testResults.messages.push({
                            message: message.substring(0, 100) + "...",
                            error: error.message
                        });
                    }
                }
                
                // Check progression pattern
                if (actualProgression.length > 1) {
                    const isProgressive = actualProgression.every((val, i) => 
                        i === 0 || val >= actualProgression[i - 1] - 5
                    );
                    
                    if (!isProgressive) {
                        console.log(`  ⚠️  Progression not smooth: ${actualProgression.join(' → ')}`);
                        testPassed = false;
                    } else {
                        console.log(`  ✅ Smooth progression: ${actualProgression.join(' → ')}`);
                    }
                }
                
                testResults.actualProgression = actualProgression;
                testResults.passed = testPassed;
                categoryResults.tests.push(testResults);
                
                if (testPassed) {
                    console.log(`\n✅ Test PASSED`);
                    passedTests++;
                } else {
                    console.log(`\n❌ Test FAILED`);
                    failedTests++;
                }
            }
            
            results.push(categoryResults);
        }
        
        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 TEST SUMMARY");
        console.log("=".repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
        console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
        
        const summary = {
            totalTests,
            passedTests,
            failedTests,
            passRate: Math.round(passedTests/totalTests*100),
            results
        };
        
        if (failedTests === 0) {
            console.log("\n🎉 All tests passed! The universal scoring system is working correctly.");
        } else {
            console.log("\n⚠️  Some tests failed. The system may need adjustments.");
        }
        
        return NextResponse.json(summary);
        
    } catch (error) {
        console.error("Test execution error:", error);
        return NextResponse.json(
            { error: "Test execution failed", details: error.message },
            { status: 500 }
        );
    }
}

