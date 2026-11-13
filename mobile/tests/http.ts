import type { OrderResponse } from '../src/api/types';

const TestData = {
	SESSION_ID: '11111111-1111-4111-8111-111111111111',
	SERVICES: [
		{ id: 'wash', name: 'Lavagem', priceCents: 1890 },
		{ id: 'dry', name: 'Secagem', priceCents: 2090 },
	],
} as const;

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function orderResponse(
	balanceAfterCents = 3110,
	serviceId = 'wash',
): OrderResponse {
	return {
		orderId: '22222222-2222-4222-8222-222222222222',
		serviceId,
		chargedCents: serviceId === 'wash' ? 1890 : 2090,
		balanceAfterCents,
		status: 'confirmed',
		createdAtUtc: '2026-11-13T12:00:00Z',
	};
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((complete) => {
		resolve = complete;
	});
	return { promise, resolve };
}

function mockHttp() {
	return jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
		throw new Error('Unexpected HTTP request in test.');
	});
}

export { TestData, jsonResponse, orderResponse, deferred, mockHttp };
