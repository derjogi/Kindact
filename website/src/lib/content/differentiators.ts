export interface Differentiator {
	title: string;
	description: string;
	icon: string;
}

export const differentiators: Differentiator[] = [
	{
		title: 'Parallel Layer, Not Replacement',
		description: 'Kindact doesn\'t seek to replace governments. It creates a voluntary framework that operates alongside existing institutions, complementing them where they work and filling gaps where they fail.',
		icon: 'layers'
	},
	{
		title: 'Anonymized Deliberation',
		description: 'During discussion, comments are shown without author identities. When you can\'t see who\'s posting, you\'re forced to evaluate ideas by their merits—crucial in polarized times.',
		icon: 'eye-off'
	},
	{
		title: 'Fluid, Ongoing Voting',
		description: 'Decisions are never truly "final." Votes can be changed, delegations revoked, and positions evolved as new information emerges—like how science updates understanding.',
		icon: 'refresh-cw'
	},
	{
		title: 'Rewards for Real Work',
		description: 'Tokens are primarily minted when community-approved work is verifiably implemented. Verified impact also generates Hypercerts that can attract external funding, creating a market for good deeds.',
		icon: 'award'
	}
];
