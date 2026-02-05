export interface Step {
	number: number;
	name: string;
	title: string;
	summary: string;
	details: string;
	icon: string;
}

export const steps: Step[] = [
	{
		number: 1,
		name: 'Identify',
		title: 'Creating Issues',
		summary: 'Anyone can identify a problem worth addressing.',
		details: 'Unlike traditional politics where only elected representatives can propose solutions, Kindact allows anyone to create an issue. You don\'t need a fully-formed solution—the community can collaboratively work it out. AI helps with duplicate detection, improvement suggestions, and categorization.',
		icon: 'lightbulb'
	},
	{
		number: 2,
		name: 'Deliberate',
		title: 'Bias-Adjusted Discussion',
		summary: 'Communities discuss with mechanisms that reduce echo chambers.',
		details: 'Users contribute through comments, structured pro/con arguments, and wiki-style proposal updates. Anonymization forces evaluation by merit rather than identity. Randomized display prevents popular ideas from dominating. AI continuously synthesizes the discussion into a living document.',
		icon: 'messages'
	},
	{
		number: 3,
		name: 'Decide',
		title: 'Fluid Voting',
		summary: 'Decisions are made through voting, delegation, or consensus.',
		details: 'Votes can be changed at any time as new information emerges. Delegated voting lets you assign your vote on specific topics to someone you trust—always revocable. A conviction mechanism prevents constant upheaval while allowing course corrections. Basic eligibility tests ensure voters understand what\'s being decided.',
		icon: 'vote'
	},
	{
		number: 4,
		name: 'Implement',
		title: 'Execution & Verification',
		summary: 'Approved solutions are executed with proof of implementation.',
		details: 'Implementers file regular reports documenting what was done, how long it took, and what impact was achieved. Verification happens through photo/video evidence, third-party auditors, cryptographic proofs, and peer confirmation.',
		icon: 'hammer'
	},
	{
		number: 5,
		name: 'Reward',
		title: 'Economic Incentives',
		summary: 'Contributors receive tokens that recognize their positive impact.',
		details: 'Tokens ($CC) are exclusively minted when community-approved work is verifiably implemented. This creates a direct link between doing good and receiving economic value. Dynamic taxation (demurrage, fees) keeps value circulating toward ongoing contribution rather than hoarding.',
		icon: 'coins'
	}
];
