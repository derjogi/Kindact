/**
 * Phase 2 Prototype: Berlin Jurisdictional Claims Scenario
 */

async function runPhase2() {
    console.log("🚀 Starting Phase 2: Jurisdictional Claims...");

    console.log("\n👥 Agents Involved:");
    console.log("- Outsider (Non-resident)");
    console.log("- Berlin Resident (Observer)");

    // 1. Author Seed Berlin-Housing Claim in Registry
    console.log("\n[System] -> Global Registry Cell:");
    const berlinClaim = {
        claimId: "jc:berlin-housing-rules-v1",
        scope: { geographic: ["h3:881f1d4895fffff"], topicTags: ["#housing"] },
        overlay: { decisionEngine: "consensus_neighbor_agreement" },
        verificationTier: "geotagged_evidence_required"
    };
    console.log("Action: create_jurisdictional_claim(berlinClaim)");
    console.log("✅ Berlin Housing claim registered.");

    // 2. Outsider tries to create a Berlin issue WITHOUT evidence
    console.log("\n[Outsider] -> Housing Cell:");
    console.log("Action: create_housing_issue({ title: 'Cheap Berlin Rent', location: 'Berlin', has_geotagged_evidence: false })");
    console.log("❌ REJECTED: Geotagged evidence required for this jurisdiction.");

    // 3. Outsider tries to evade by tagging "Global" but using Berlin evidence
    console.log("\n[Outsider] -> Housing Cell (Evading):");
    console.log("Action: create_housing_issue({ title: 'Cheap Berlin Rent', location: 'Global', has_geotagged_evidence: true })");
    const issueHash = "uhCkk...evaded_issue";
    console.log(`✅ Issue created (Tagged Global): ${issueHash}`);

    // 4. Berlin Observer flags the binding-invalid
    console.log("\n[Berlin Resident] -> Watching Housing Cell...");
    console.log(`🔍 Detected Berlin-related issue tagged 'Global': ${issueHash}`);
    console.log(`[Berlin Resident] -> challenge_issue_binding({ issue_hash: '${issueHash}', reason: 'Binding invalid: Berlin rules apply.' })`);
    console.log("✅ Challenge submitted. Issue status moved to 'Challenged'.");

    console.log("\n✨ Phase 2 Scenario Complete!");
}

runPhase2().catch(console.error);
