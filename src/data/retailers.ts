export interface Retailer {
	id: string;
	name: string;
	url: string;
	icon: string;
}

export const retailers: Retailer[] = [
	{
		id: 'paris',
		name: 'Paris',
		url: '#',
		icon: '🛒',
	},
	{
		id: 'falabella',
		name: 'Falabella',
		url: '#',
		icon: '🏬',
	},
	{
		id: 'ripley',
		name: 'Ripley',
		url: '#',
		icon: '🏪',
	},
	{
		id: 'easy',
		name: 'Easy',
		url: '#',
		icon: '🔧',
	},
];
