type LaundryService = {
	id: string;
	name: string;
	priceCents: number;
};

type WalletResponse = {
	balanceCents: number;
};

type CreateSessionResponse = WalletResponse & {
	sessionId: string;
};

type OrderResponse = {
	orderId: string;
	serviceId: string;
	chargedCents: number;
	balanceAfterCents: number;
	status: 'confirmed';
	createdAtUtc: string;
};

enum ApiErrorCodeEnum {
	SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
	NETWORK_ERROR = 'NETWORK_ERROR',
	INVALID_RESPONSE = 'INVALID_RESPONSE',
	CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
	HTTP_ERROR = 'HTTP_ERROR',
	INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}

export { ApiErrorCodeEnum };
export type {
	LaundryService,
	WalletResponse,
	CreateSessionResponse,
	OrderResponse,
};
