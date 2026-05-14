# Disagreements, Schisms, and Meta-Governance in Kindact

*A deep dive into how Kindact handles internal conflicts and governs itself*

---

## Part 1: How Disagreements Are Handled

### The Fundamental Insight: Kindact Is an Incentive Layer

Kindact does not grant permissions or enforce decisions. It provides **economic incentives** ($CC rewards) for community-approved work. This distinction dissolves many conflicts that would be serious in traditional organizations:

- Kindact cannot *stop* anyone from acting
- It can only choose whether to *reward* certain actions
- Real-world constraints (laws, permits, physical space) still apply

### Why Most "Schisms" Don't Apply

Many organizational conflicts stem from resource scarcity or organizational control. Kindact's design eliminates these:

**Unlimited $CC**: Unlike traditional budgets, $CC is not capped. Multiple competing approaches can be rewarded simultaneously if they each have community support. A climate group doesn't need to choose between funding tree planting OR solar panels—both can proceed.

**Issue-based structure**: There are no "Kindact groups" to split from. Users engage with *issues*, not organizations. If a composting community creates housing policy issues, members who only care about composting simply don't participate in housing votes. No schism needed.

**No organizational control**: There's no leadership to capture, no treasury to fight over, no membership to exclude people from.

### Scenarios Explored

#### Implementation Disagreements

*Example: A community agrees plastic waste is a problem but splits on approach—ban plastics vs. incentivize alternatives.*

**Resolution**: Both approaches can be rewarded simultaneously. The community might:
- Reward work on lobbying for bans (getting vendors to stop using plastic, pushing local government)
- Reward work on developing/subsidizing alternatives
- Through deliberation, surface nuance (some plastics exempted, alternatives subsidized for specific use cases)

The structured discussion should help factions understand each other's reasoning and potentially converge.

#### Scope Creep

*Example: A neighborhood composting group starts taking on broader political issues.*

**Resolution**: This isn't really a Kindact problem. Kindact is issue-based, not group-based. If some members create housing policy issues, others just don't vote on them. There's no "group scope" to creep—only issues people choose to engage with.

#### Resource Allocation

*Example: Limited funds, competing priorities for tree planting vs. solar project.*

**Resolution**: $CC is unlimited (limited only by voter participation). Both can be rewarded. This removes zero-sum thinking that creates faction warfare.

#### Physical Mutual Exclusivity

*Example: A road corridor can only be a bus lane OR a bike lane, not both.*

**Resolution**: This is a real-world constraint, not a Kindact constraint. Both factions could get issues approved and receive rewards for preparatory work (planning, advocacy, design). When implementation hits physical reality:

- Ideally, overlapping stakeholder notifications surface the conflict early
- Real-world approval processes (city council) would also catch it
- If both proceed to the point of conflict, the community must decide which gets built
- If neither reaches the high approval threshold (~80%), neither proceeds

The high threshold means genuine disagreement pauses action rather than slim majorities steamrolling minorities.

#### Genuine Opposition

*Example: Reformists vs. direct action activists in a climate group. Reformists believe direct action will set back the cause.*

**Resolution**: Both factions can create separate issues for their approaches. Neither can *stop* the other—they can only:
- Argue on each other's issues to try shifting votes
- Choose not to reward the other's approach (by voting against)
- Publicly distance themselves using platform transparency as proof

If reformists vote against activist issues and vice versa, neither may reach the approval threshold—which correctly reflects genuine community disagreement.

**Remaining concerns**: Factions might engage in blocking wars (continuously downvoting each other) or issue spam (creating endless similar issues to circumvent blocks). Platform mechanics to address:
- Issues require different voting circles within a month to prevent conspirator loops
- Meta-issues might emerge to help factions agree on "some action is better than none"
- These dynamics require ongoing platform evolution

### The High Approval Threshold

A key design choice: even a ~20% minority has significant blocking power. This is intentional:

- Genuine disagreement should pause action, not get steamrolled
- If an issue can't achieve ~80% approval, the community hasn't reached sufficient consensus
- This encourages deliberation and compromise rather than faction warfare

---

## Part 2: Meta-Governance

Meta-governance covers disputes about the platform's rules themselves: voting thresholds, competence tests, token economics, moderation policies, algorithms, and more.

### The Core Principle: Eat Your Own Cooking

Platform rules are governed through the same issue-based process as everything else:

1. **Issue identification**: Someone identifies a problem with current rules
2. **Deliberation**: Community discusses proposals, surfaces trade-offs
3. **Voting**: High approval threshold required
4. **Implementation**: Developers submit code changes to a protected branch
5. **Technical review**: Multiple rotating reviewers check for bugs, malicious code
6. **Merge approval**: Community approves merge with threshold based on impact scope
7. **Conviction**: Changes accumulate conviction over time; reversals require conviction to "cool off"

### Quorum Scaling

Not all meta-governance changes are equal:

- Changes affecting few people (e.g., edge case in stakeholder definition) might require only 0.1% of total users to vote
- Widespread changes might require 1%+
- **Constitutional-level changes** (one-person-one-vote, open-source requirement) require supermajority of total users (66%+)

The approval ratio stays high regardless—only the quorum scales.

### Bootstrap and Initial Legitimacy

**Q: Who sets the initial parameters before there's a community?**

A: The founding developers. Legitimacy comes from adoption—if the initial parameters are unacceptable, people won't use the platform. This is "market validation" for governance design.

### Technical Review as Trust Point

**Q: Who reviews code changes? Isn't this centralization?**

A: Reviews use the same verification mechanism as other work:
- Issues specify required reviewer expertise (e.g., "must be reviewed by [developer tag]")
- Multiple reviewers required
- Reviewers must rotate (same reviewer can't repeatedly approve the same issue type)

This distributes trust across the developer community rather than concentrating it.

### Delegation Concentration

**Q: If many users delegate meta-governance votes to a few expert developers, don't those developers gain too much power?**

A: Delegation is instantly revocable. If a delegate votes against a user's interests, the user takes back their voting power immediately. This creates accountability without requiring everyone to be a governance expert.

### Constitutional Protections

**Q: Can the community vote to remove one-person-one-vote or make the code closed-source?**

A: Some changes require extremely high quorums (66%+ of total users). These thresholds are:
- Initially set by founding developers
- Themselves changeable only with the same high bar

This creates practical constitutional protection without making anything truly immutable.

### Example: Changing Competence Test Strictness

1. Problem identified: Test excludes people with legitimate stakes (e.g., diaspora community members planning to return)
2. Proposal: Replace strict verification with text field ("What's your stake?"), add retroactive review mechanism for controversial cases
3. Deliberation: Community weighs trade-offs (accessibility vs. gaming risk)
4. Vote: 90% approval
5. Implementation: Developer creates fix on separate branch
6. Review: Multiple developers verify no bugs or malicious code
7. Merge vote: Since this affects minority of users (~10%), quorum is scaled down (0.1% instead of 1%), but still needs high approval
8. Deployment: Fix merged to production
9. Ongoing: If votes turn negative over time (approval drops below 50%), conviction cools off, and change can be reverted

---

## Summary

Kindact's approach to disagreements and self-governance:

1. **Incentive layer, not enforcement**: Can't stop action, only reward it
2. **Issue-based, not organization-based**: Schisms dissolve into issue-level disengagement
3. **Unlimited $CC**: Removes zero-sum resource competition
4. **High approval thresholds**: Minorities have blocking power, forcing genuine consensus
5. **Self-referential governance**: Platform rules use the same issue-based process
6. **Quorum scaling**: Impact determines participation requirements
7. **Constitutional protection**: Core principles require supermajority of total users
8. **Revocable delegation**: Expertise concentration without power lock-in
9. **Conviction mechanism**: Stability without rigidity
