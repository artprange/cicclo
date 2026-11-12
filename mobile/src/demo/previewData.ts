interface LaundryService {
	id: string;
	name: string;
	priceCents: number;
}

interface DemoPreviewData {
	BALANCE_CENTS: number;
	SERVICES: readonly LaundryService[];
}

const PreviewData = {
	BALANCE_CENTS: 5000,
	SERVICES: [
		{
			id: 'wash',
			name: 'Lavagem',
			priceCents: 1890,
		},
		{
			id: 'dry',
			name: 'Secagem',
			priceCents: 2090,
		},
	],
} as const satisfies DemoPreviewData;

export { PreviewData };
export type { LaundryService };
