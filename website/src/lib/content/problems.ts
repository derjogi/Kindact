export interface Problem {
	level: string;
	title: string;
	summary: string;
	details: string[];
}

export const problems: Problem[] = [
	{
		level: 'Individual',
		title: 'Feeling Powerless',
		summary: 'Eco-anxiety, economic insecurity, and a sense that our voices don\'t matter.',
		details: [
			'People experience eco-anxiety and despair about the state of the world.',
			'Economic inequality leaves many wondering if they\'ll ever achieve financial security.',
			'Fear that AI and automation will make skills obsolete.',
			'Social polarization makes speaking one\'s mind feel risky.'
		]
	},
	{
		level: 'Social',
		title: 'Communities Fragmenting',
		summary: 'Lost local institutions, polarized discourse, and intergenerational injustice.',
		details: [
			'We\'ve lost the local institutions that used to bring communities together: clubs, unions, religious groups, neighborhood associations.',
			'We can no longer have conversations with people who vote differently than we do.',
			'We\'ve created intergenerational injustice, leaving our children a worse world than we inherited.'
		]
	},
	{
		level: 'National',
		title: 'Governance Failing',
		summary: 'Short-term thinking, slow laws, and race-to-the-bottom policies.',
		details: [
			'Governments lack the capacity to respond to modern challenges.',
			'Leaders focus on the next election rather than the next generation.',
			'Laws move so slowly that by the time they\'re passed, the problems they address have already evolved.',
			'Nation-states\' obligation to care for their citizens forces race-to-the-bottom policies that ultimately harm everyone.'
		]
	},
	{
		level: 'Global',
		title: 'Existential Risks',
		summary: 'Climate collapse, AI race, and crumbling international order.',
		details: [
			'We\'re causing ecological collapse that threatens the natural systems we depend on.',
			'Climate change is making large parts of the planet increasingly dangerous to live in.',
			'The AI race poses genuine existential risks to humanity\'s future.',
			'The international order that prevented world wars is crumbling.'
		]
	}
];
