import type {
	CreateSessionResponse,
	LaundryService,
	OrderResponse,
	WalletResponse,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isCents(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isService(value: unknown): value is LaundryService {
	return (
		isRecord(value) &&
		isText(value.id) &&
		isText(value.name) &&
		isCents(value.priceCents)
	);
}

function isServiceList(value: unknown): value is LaundryService[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every((service: unknown) => isService(service))
	);
}

function isWallet(value: unknown): value is WalletResponse {
	return isRecord(value) && isCents(value.balanceCents);
}

function isSession(value: unknown): value is CreateSessionResponse {
	return (
		isRecord(value) && isText(value.sessionId) && isCents(value.balanceCents)
	);
}

function isOrder(value: unknown): value is OrderResponse {
	return (
		isRecord(value) &&
		isText(value.orderId) &&
		isText(value.serviceId) &&
		isCents(value.chargedCents) &&
		isCents(value.balanceAfterCents) &&
		value.status === 'confirmed' &&
		isText(value.createdAtUtc) &&
		Number.isFinite(Date.parse(value.createdAtUtc))
	);
}

export { isRecord, isServiceList, isWallet, isSession, isOrder };
