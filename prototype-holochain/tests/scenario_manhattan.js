/**
 * Phase 1 Prototype: Manhattan Wind Turbine Scenario
 *
 * This script simulates the interaction between 3 agents and 2 DNAs.
 */

async function runPrototype() {
    console.log("🚀 Starting Kindact Holochain Prototype...");

    console.log("\n👥 Agents Involved:");
    console.log("- Manhattan Resident (Creator)");
    console.log("- NYC Resident (Subscriber)");
    console.log("- Nairobi Engineer (Guest Contributor)");

    // 2. Manhattan Resident creates an issue
    console.log("\n[Manhattan Resident] -> Manhattan Cell:");
    console.log("Action: create_issue({ title: 'Manhattan Wind Turbine', status: 'Draft' })");
    const issueHash = "uhCkk...issue_hash";
    console.log(`✅ Issue created: ${issueHash}`);

    // 3. Publish to Global Registry
    console.log("\n[Conductor] -> Global Registry Cell:");
    console.log(`Action: publish_anchor_link({ anchor_name: '#wind-power', issue_id: '${issueHash}' })`);
    console.log("✅ Anchor link published to registry.");

    // 4. NYC Resident subscribes
    console.log("\n[NYC Resident] -> Subscribes to '#new-york'");
    console.log("✅ Watching registry for updates...");

    // 5. Nairobi Engineer discovers and joins
    console.log("\n[Nairobi Engineer] -> Global Registry Cell:");
    console.log("Action: get_issues_for_anchor('#wind-power')");
    console.log(`🔍 Found Issue: ${issueHash}`);

    console.log("\n[Nairobi Engineer] -> Requesting Guest Access to Manhattan Cell...");
    console.log("[Manhattan Resident] -> grant_guest_access(issue_hash)");
    const capSecret = "0000...secret";
    console.log(`✅ Cap Secret issued: ${capSecret}`);

    // 6. Nairobi Engineer posts a comment
    console.log("\n[Nairobi Engineer] -> Manhattan Cell (using Guest Cap):");
    console.log("Action: post_comment({ content: 'I can help with the turbine specs!', issue_id: issue_hash })");
    console.log("✅ Comment posted successfully.");

    console.log("\n✨ Prototype Scenario Complete!");
}

runPrototype().catch(console.error);
