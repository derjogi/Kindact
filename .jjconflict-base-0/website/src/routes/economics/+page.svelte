<script lang="ts">
	import { ExpandableSection, SectionHeading } from '$lib';
	import { Coins, TrendingDown, TrendingUp, Shield, Scale, Users, HelpCircle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Economics — Kindact</title>
	<meta
		name="description"
		content="Deep dive into Kindact's token economics: $CC creation, demurrage, fraud prevention, and value dynamics."
	/>
</svelte:head>

<article class="max-w-4xl mx-auto px-6 py-16">
	<!-- Header -->
	<header class="mb-16">
		<p class="text-sm font-semibold uppercase tracking-wide mb-3" style="color: var(--color-primary)">
			Deep Dive
		</p>
		<h1 class="text-4xl md:text-5xl font-bold mb-6" style="color: var(--color-text)">
			Economic System
		</h1>
		<p class="text-xl" style="color: var(--color-text-muted)">
			A detailed exploration of how $CC (Community Currency) works. This addresses the questions an
			economist would ask: How is supply controlled? What prevents fraud? Why should this token have
			value?
		</p>
	</header>

	<!-- What is $CC -->
	<section class="mb-16">
		<SectionHeading
			title="What Is $CC?"
			subtitle="Community Currency serves multiple roles, in order of priority."
		/>

		<div class="mt-8 overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr style="border-bottom: 2px solid var(--color-border)">
						<th class="text-left py-3 pr-4 font-semibold" style="color: var(--color-text)">Priority</th>
						<th class="text-left py-3 pr-4 font-semibold" style="color: var(--color-text)">Role</th>
						<th class="text-left py-3 font-semibold" style="color: var(--color-text)">Description</th>
					</tr>
				</thead>
				<tbody>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-primary)">1st</td>
						<td class="py-3 pr-4 font-semibold" style="color: var(--color-text)">Reward unit</td>
						<td class="py-3" style="color: var(--color-text-muted)">Incentivizes community-approved work as a rival to purely market-driven incentives.</td>
					</tr>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-primary)">2nd</td>
						<td class="py-3 pr-4 font-semibold" style="color: var(--color-text)">Impact-backed asset</td>
						<td class="py-3" style="color: var(--color-text-muted)">Each $CC is minted against verified work; when external buyers purchase the resulting Hypercerts for fiat, the proceeds flow into a reserve that gives $CC real monetary backing.</td>
					</tr>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-primary)">3rd</td>
						<td class="py-3 pr-4 font-semibold" style="color: var(--color-text)">Tradeable medium</td>
						<td class="py-3" style="color: var(--color-text-muted)">Enables contributors to convert effort into goods/services. Buyers directly support contributors.</td>
					</tr>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-primary)">4th</td>
						<td class="py-3 pr-4 font-semibold" style="color: var(--color-text)">Reputation signal</td>
						<td class="py-3" style="color: var(--color-text-muted)">Accumulated $CC signals past contribution. Blockchain provenance distinguishes earned from purchased.</td>
					</tr>
					<tr>
						<td class="py-3 pr-4 font-medium" style="color: var(--color-primary)">5th</td>
						<td class="py-3 pr-4 font-semibold" style="color: var(--color-text)">Access right</td>
						<td class="py-3" style="color: var(--color-text-muted)">Basic participation is free; extended features like vote delegation, AI summaries, and detailed statistics require $CC, creating baseline utility demand.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="mt-8">
			<ExpandableSection title="Why Tradeability Doesn't Undermine Reputation" summary="Economists often argue that tradeable reputation undermines trust. Here's how Kindact addresses this.">
				<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
					<li><strong style="color: var(--color-text)">Provenance transparency:</strong> The blockchain shows whether tokens were earned (minted from verified work) or purchased. "Earned $CC" and "purchased $CC" are distinguishable.</li>
					<li><strong style="color: var(--color-text)">Buying = supporting:</strong> When you purchase $CC from someone, you're directly funding a contributor. This is itself a reputable act—similar to "donate to the cause."</li>
					<li><strong style="color: var(--color-text)">Scarcity establishes meaning:</strong> In early stages, $CC is scarce and hard to buy; reputation is the primary value. By the time tokens circulate freely, the reputation signal is already established.</li>
				</ul>
			</ExpandableSection>
		</div>
	</section>

	<!-- Token Creation -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Coins size={24} />
			</div>
			<SectionHeading title="Token Creation: Minting" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			$CC tokens are <strong style="color: var(--color-text)">primarily minted when community-approved work is verifiably implemented</strong>—even partially (e.g. monthly progress for bigger projects). $CC can also be purchased from the reserve (backed by Hypercert sales). There is no pre-mine, no founder allocation, and no debt-based creation.
		</p>

		<div class="p-6 rounded-xl mb-6" style="background-color: var(--color-bg-alt)">
			<h4 class="font-semibold mb-4" style="color: var(--color-text)">How Reward Amounts Are Set</h4>
			<ol class="space-y-2 text-sm" style="color: var(--color-text-muted)">
				<li><strong style="color: var(--color-text)">1. Issue creator proposes</strong> an amount (optional)</li>
				<li><strong style="color: var(--color-text)">2. AI suggests</strong> a reward based on comparable tasks, scope, and impact</li>
				<li><strong style="color: var(--color-text)">3. Community adjusts</strong> through normal deliberation</li>
				<li><strong style="color: var(--color-text)">4. Voter-scaled caps</strong> limit maximum rewards—large rewards require broad support</li>
			</ol>
		</div>

		<ExpandableSection title="Voter Scaling Example" summary="Each additional voter multiplies the available reward cap.">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr style="border-bottom: 2px solid var(--color-border)">
							<th class="text-left py-2 pr-4 font-semibold" style="color: var(--color-text)">Voters</th>
							<th class="text-left py-2 font-semibold" style="color: var(--color-text)">Approximate Max Reward</th>
						</tr>
					</thead>
					<tbody style="color: var(--color-text-muted)">
						<tr style="border-bottom: 1px solid var(--color-border)"><td class="py-2 pr-4">1</td><td class="py-2">1.5 $CC</td></tr>
						<tr style="border-bottom: 1px solid var(--color-border)"><td class="py-2 pr-4">2</td><td class="py-2">~3.75 $CC</td></tr>
						<tr style="border-bottom: 1px solid var(--color-border)"><td class="py-2 pr-4">3</td><td class="py-2">~9.4 $CC</td></tr>
						<tr style="border-bottom: 1px solid var(--color-border)"><td class="py-2 pr-4">5</td><td class="py-2">~57 $CC</td></tr>
						<tr><td class="py-2 pr-4">10</td><td class="py-2">~1,000+ $CC</td></tr>
					</tbody>
				</table>
			</div>
			<p class="mt-4 text-xs" style="color: var(--color-text-muted)">Actual formula TBD; likely an S-curve with flatter exponent.</p>
		</ExpandableSection>
	</section>

	<!-- Supply Management -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<TrendingDown size={24} />
			</div>
			<SectionHeading title="Supply Management: Reactive Sinks" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Instead of hard issuance caps, Kindact uses <strong style="color: var(--color-text)">dynamic taxation</strong> that adjusts based on circulation metrics—analogous to how central banks adjust interest rates, but algorithmic and transparent.
		</p>

		<div class="overflow-x-auto mb-6">
			<table class="w-full text-sm">
				<thead>
					<tr style="border-bottom: 2px solid var(--color-border)">
						<th class="text-left py-3 pr-4 font-semibold" style="color: var(--color-text)">Mechanism</th>
						<th class="text-left py-3 pr-4 font-semibold" style="color: var(--color-text)">Tax Analogy</th>
						<th class="text-left py-3 font-semibold" style="color: var(--color-text)">Adjustment Trigger</th>
					</tr>
				</thead>
				<tbody style="color: var(--color-text-muted)">
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-text)">Demurrage rate</td>
						<td class="py-3 pr-4">Wealth tax</td>
						<td class="py-3">High mint/burn ratio → faster decay</td>
					</tr>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-text)">Transaction fees</td>
						<td class="py-3 pr-4">VAT / sales tax</td>
						<td class="py-3">High velocity or manipulation signals</td>
					</tr>
					<tr style="border-bottom: 1px solid var(--color-border)">
						<td class="py-3 pr-4 font-medium" style="color: var(--color-text)">Access fees</td>
						<td class="py-3 pr-4">Service/licensing fees</td>
						<td class="py-3">Basic participation is free; extended features require small $CC fees that are burned</td>
					</tr>
					<tr>
						<td class="py-3 pr-4 font-medium" style="color: var(--color-text)">Verification threshold</td>
						<td class="py-3 pr-4">Regulatory compliance</td>
						<td class="py-3">Large rewards require more scrutiny</td>
					</tr>
				</tbody>
			</table>
		</div>

		<ExpandableSection title="Base Demurrage: How It Works" summary="All tokens lose value at a continuous uniform rate, encouraging circulation.">
			<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
				<li>• All tokens lose value at a continuous uniform rate (e.g., 1% per month), regardless of activity. This guarantees a finite supply equilibrium and creates steady "use it or lose it" pressure—since goods and investments don't decay, spending preserves value.</li>
				<li>• <strong style="color: var(--color-text)">Older tokens move first (FIFO)</strong>—users can't choose which tokens to spend</li>
				<li>• <strong style="color: var(--color-text)">1 $CC = 1 $CC at any moment</strong>—no "old vs. new" confusion; value degrades smoothly</li>
				<li>• Applied <strong style="color: var(--color-text)">per identity</strong>, not per wallet</li>
			</ul>
			<p class="mt-4 text-sm" style="color: var(--color-text-muted)">
				<strong style="color: var(--color-text)">Why both demurrage AND transaction fees?</strong> Demurrage alone could be gamed via circular trades. Small transaction fees make circular gaming costly. Together: natural circulation pressure without penalizing genuine trade.
			</p>
		</ExpandableSection>
	</section>

	<!-- Token Value: Hypercerts -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<TrendingUp size={24} />
			</div>
			<SectionHeading title="Token Value: Hypercerts" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			$CC's value evolves through distinct phases. In the early stages, value is primarily <strong style="color: var(--color-text)">social</strong>: $CC functions as recognition—a visible record of contribution. Platform access fees for extended functionality create a small but steady baseline demand. Beyond that, early circulation depends on deliberate local arrangements: communities encouraging participating businesses to accept $CC.
		</p>

		<div class="p-6 rounded-xl mb-6" style="background-color: var(--color-bg-alt)">
			<h4 class="font-semibold mb-4" style="color: var(--color-text)">Two Complementary Instruments</h4>
			<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
				<li><strong style="color: var(--color-text)">$CC (the currency):</strong> Fungible, circulating, subject to demurrage. The internal economy's lifeblood—what implementers earn, what community members trade, what access fees are paid in.</li>
				<li><strong style="color: var(--color-text)">Hypercerts (the impact credentials):</strong> Each one tied to a specific piece of completed work, recording who did what, when, and with what verified results. Non-fungible, retirable, and designed to be held as proof of impact.</li>
			</ul>
		</div>

		<div class="space-y-4">
			<ExpandableSection title="How It Works" summary="When a Kindact issue is completed, both $CC and a Hypercert are generated.">
				<ol class="space-y-2 text-sm" style="color: var(--color-text-muted)">
					<li>1. <strong style="color: var(--color-text)">$CC is minted and goes to the implementer</strong> as their reward</li>
					<li>2. <strong style="color: var(--color-text)">A Hypercert is generated and held by Kindact</strong> as a platform asset</li>
					<li>3. External entities (carbon offset buyers, corporations needing ESG documentation, impact funds, progressive governments) can <strong style="color: var(--color-text)">purchase Hypercerts</strong> from Kindact on an open market</li>
					<li>4. Proceeds flow into a <strong style="color: var(--color-text)">fiat reserve</strong> that backs $CC—anyone can exchange $CC for fiat (or vice versa) through this reserve</li>
				</ol>
			</ExpandableSection>

			<ExpandableSection title="The Virtuous Cycle" summary="More work creates deeper backing for $CC.">
				<p class="text-sm mb-4" style="color: var(--color-text-muted)">
					More community-approved work → more Hypercerts → more sales to external buyers → deeper fiat reserve → more stable $CC → more confidence in the reward → more people willing to do good work.
				</p>
				<p class="text-sm" style="color: var(--color-text-muted)">
					The fiat reserve provides a <strong style="color: var(--color-text)">floor</strong>—a minimum redemption value backed by realized Hypercert sales. If $CC trades on an open market, the market price will also reflect the size and quality of Kindact's unsold Hypercert portfolio, growth trajectory, and expectation of future sales.
				</p>
			</ExpandableSection>

			<ExpandableSection title="Existing Proof This Works" summary="The infrastructure and market for verified impact credentials already exists.">
				<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
					<li><strong style="color: var(--color-text)">Optimism RetroPGF:</strong> Distributed <strong style="color: var(--color-text)">over $100 million</strong> to projects based on demonstrated impact rather than promises, with $1.3 billion reserved for future rounds.</li>
					<li><strong style="color: var(--color-text)">Gitcoin:</strong> Channeled <strong style="color: var(--color-text)">over $60 million</strong> to 5,000+ projects using quadratic funding. These programs prove that retroactive, impact-based funding works at scale.</li>
				</ul>
				<p class="mt-4 text-sm" style="color: var(--color-text-muted)">
					These programs are actively seeking new domains beyond crypto infrastructure. Kindact's completed, community-verified work produces exactly what they reward: auditable, community-assessed proof of real-world impact.
				</p>
			</ExpandableSection>
		</div>
	</section>

	<!-- Fraud Prevention -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Shield size={24} />
			</div>
			<SectionHeading title="Fraud Prevention" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Many token systems require staking collateral that gets slashed for misbehavior. Kindact takes a different approach, at least initially.
		</p>

		<div class="grid md:grid-cols-2 gap-4 mb-6">
			{#each [
				{ attack: 'Sybil attacks', mitigation: 'Verified human mechanisms make multiple identities very difficult' },
				{ attack: 'Collusion rings', mitigation: 'Same voter circle limited per month; small groups unlock small caps only' },
				{ attack: 'Rubber-stamp verification', mitigation: 'Verifiers must rotate; larger issues require more verifiers' },
				{ attack: 'Early-stage exploitation', mitigation: '$CC has near-zero value early → attack effort exceeds reward' }
			] as item}
				<div class="p-4 rounded-lg" style="background-color: var(--color-bg-alt)">
					<h4 class="font-semibold text-sm mb-1" style="color: var(--color-text)">{item.attack}</h4>
					<p class="text-sm" style="color: var(--color-text-muted)">{item.mitigation}</p>
				</div>
			{/each}
		</div>

		<ExpandableSection title="Core Safeguards" summary="Seven mechanisms that prevent abuse without requiring upfront staking.">
			<ol class="space-y-2 text-sm" style="color: var(--color-text-muted)">
				<li><strong style="color: var(--color-text)">1. Voter-scaled caps:</strong> Lone actors can only award minimal amounts</li>
				<li><strong style="color: var(--color-text)">2. Asymmetric voting:</strong> Negative votes reduce caps more than positive votes increase them</li>
				<li><strong style="color: var(--color-text)">3. Fluid voting:</strong> Rewards can be adjusted mid-implementation; community can catch abuse</li>
				<li><strong style="color: var(--color-text)">4. Verifier rotation:</strong> Same verifier can't approve the same issue repeatedly</li>
				<li><strong style="color: var(--color-text)">5. Rate-limiting new users:</strong> Can't propose high amounts until they have history</li>
				<li><strong style="color: var(--color-text)">6. Retroactive bans:</strong> Fraud detection → banned from proposing amounts or full platform ban</li>
				<li><strong style="color: var(--color-text)">7. Clawback with negative balance:</strong> Confirmed fraud triggers clawback from the scammer's wallet; if insufficient, the balance goes negative</li>
			</ol>
		</ExpandableSection>
	</section>

	<!-- Dispute Resolution -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Scale size={24} />
			</div>
			<SectionHeading title="Dispute Resolution" />
		</div>

		<div class="space-y-4">
			<ExpandableSection title="Initiating a Challenge" summary="Anyone can flag submitted proof with a comment and small deposit.">
				<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
					<li>• Anyone can flag a submitted proof with a comment</li>
					<li>• Small $CC deposit required (returned if challenge is upheld)</li>
					<li>• <strong style="color: var(--color-text)">Exponential backoff on wrong accusations:</strong> Wrong accusation → next accusation blocked for 1 month; 2 wrong within 2 months → 4 month wait, etc.</li>
				</ul>
			</ExpandableSection>

			<ExpandableSection title="Resolution Process" summary="How disputes are handled while unresolved.">
				<ol class="space-y-2 text-sm" style="color: var(--color-text-muted)">
					<li>1. Flagged dispute opens for community engagement</li>
					<li>2. While unresolved: payments halted, accused blocked from certain actions</li>
					<li>3. Restrictions loosen gradually if no verdict reached (prevents malicious accusations from dragging indefinitely)</li>
				</ol>
			</ExpandableSection>

			<ExpandableSection title="Default Thresholds" summary="Verdict requirements when community hasn't specified rules.">
				<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
					<li>• <strong style="color: var(--color-text)">Quorum:</strong> 2% of original voters OR 3 people, whichever is higher</li>
					<li>• <strong style="color: var(--color-text)">Agreement ratio:</strong> 80% to confirm fraud</li>
					<li>• If threshold not reached → accused unblocked over time by default</li>
				</ul>
			</ExpandableSection>
		</div>
	</section>

	<!-- Growth Stages -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Users size={24} />
			</div>
			<SectionHeading title="Growth Stages" />
		</div>

		<div class="space-y-4">
			{#each [
				{ stage: 'Stage 1: Seeding', users: '0-10 users', value: 'Reputation', risk: 'Minimal', desc: 'Early adopters participate because they believe in the vision.' },
				{ stage: 'Stage 2: Sprouting', users: '10-100 users', value: 'Marketplace utility', risk: 'Low', desc: 'First businesses might accept $CC. Community resources priced in $CC.' },
				{ stage: 'Stage 3: Growth', users: '100-10,000 users', value: 'Inter-community trade', risk: 'Moderate', desc: 'Token utility expands. External actors start paying attention.' },
				{ stage: 'Stage 4: Stability', users: '>10,000 users', value: 'Network effects', risk: 'Requires mature systems', desc: 'Wide distribution creates broad stakeholder base.' }
			] as s}
				<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
					<div class="flex items-baseline justify-between mb-2">
						<h4 class="font-semibold" style="color: var(--color-text)">{s.stage}</h4>
						<span class="text-xs" style="color: var(--color-text-muted)">{s.users}</span>
					</div>
					<p class="text-sm mb-2" style="color: var(--color-text-muted)">{s.desc}</p>
					<div class="flex gap-4 text-xs">
						<span><strong style="color: var(--color-text)">Primary value:</strong> <span style="color: var(--color-text-muted)">{s.value}</span></span>
						<span><strong style="color: var(--color-text)">Fraud risk:</strong> <span style="color: var(--color-text-muted)">{s.risk}</span></span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Open Questions -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<HelpCircle size={24} />
			</div>
			<SectionHeading title="Open Questions" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Several areas require ongoing refinement:
		</p>

		<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
			<li>• <strong style="color: var(--color-text)">Exact demurrage parameters:</strong> What's the optimal decay rate?</li>
			<li>• <strong style="color: var(--color-text)">Voter scaling formula:</strong> The 1.5× multiplier is illustrative; actual curve needs calibration</li>
			<li>• <strong style="color: var(--color-text)">Time bounds for disputes:</strong> Maximum resolution periods TBD</li>
			<li>• <strong style="color: var(--color-text)">Exchange rate dynamics:</strong> How will $CC interact with external currencies at scale?</li>
			<li>• <strong style="color: var(--color-text)">Legal and regulatory considerations:</strong> Securities laws, money transmission, cross-border issues</li>
		</ul>
	</section>

	<!-- Conclusion -->
	<section class="p-8 rounded-xl" style="background-color: var(--color-bg-alt)">
		<h2 class="text-2xl font-bold mb-4" style="color: var(--color-text)">Core Insight</h2>
		<p class="text-lg" style="color: var(--color-text-muted)">
			<strong style="color: var(--color-text)">If tokens are only minted for verified real-world value creation, traditional inflation concerns largely dissolve.</strong>
			The challenge shifts to verification and fraud prevention—which Kindact addresses through voter scaling, verifier rotation, fluid voting, and community-based dispute resolution.
		</p>
		<p class="mt-4 text-sm" style="color: var(--color-text-muted)">
			The system is intentionally minimal at launch, with built-in mechanisms for the community to add complexity as needed. This reflects Kindact's core philosophy: the platform governs itself.
		</p>
	</section>
</article>
