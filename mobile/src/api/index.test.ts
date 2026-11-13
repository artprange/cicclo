import { Platform } from 'react-native';

import { createOrder, getServices, getWallet, ApiError } from './index';
import { ApiErrorCodeEnum } from './types';
import {
	TestData,
	jsonResponse,
	mockHttp,
	orderResponse,
} from '../../tests/http';

let http: ReturnType<typeof mockHttp>;
const originalDev = __DEV__;

beforeEach(() => {
	process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
	http = mockHttp();
});

afterEach(() => {
	delete process.env.EXPO_PUBLIC_API_URL;
	Object.defineProperty(globalThis, '__DEV__', {
		value: originalDev,
		configurable: true,
		writable: true,
	});
	jest.useRealTimers();
});

test('sends only the service id with session and idempotency headers', async () => {
	http.mockResolvedValueOnce(jsonResponse(orderResponse()));
	await expect(
		createOrder(TestData.SESSION_ID, 'wash', 'purchase-key'),
	).resolves.toEqual(orderResponse());
	expect(http).toHaveBeenCalledWith(
		'https://api.example.test/api/orders',
		expect.objectContaining({
			method: 'POST',
			body: JSON.stringify({ serviceId: 'wash' }),
			headers: expect.objectContaining({
				'X-Demo-Session': TestData.SESSION_ID,
				'Idempotency-Key': 'purchase-key',
				'Content-Type': 'application/json',
			}),
		}),
	);
});

test('uses same-origin paths on production web even with a configured local URL', async () => {
	jest.replaceProperty(Platform, 'OS', 'web');
	Object.defineProperty(globalThis, '__DEV__', {
		value: false,
		configurable: true,
		writable: true,
	});
	process.env.EXPO_PUBLIC_API_URL = 'http://localhost:10000';
	http.mockResolvedValueOnce(jsonResponse(TestData.SERVICES));
	await getServices();
	expect(http.mock.calls[0][0]).toBe('/api/services');
});

test('rejects missing development configuration before making a request', async () => {
	delete process.env.EXPO_PUBLIC_API_URL;
	await expect(getServices()).rejects.toMatchObject({
		code: ApiErrorCodeEnum.CONFIGURATION_ERROR,
		retryable: false,
	});
	expect(http).not.toHaveBeenCalled();
});

test.each([409, 404, 400])(
	'preserves a non-retryable HTTP %i error',
	async (status) => {
		http.mockResolvedValueOnce(
			jsonResponse(
				{ code: 'EXPECTED_ERROR', detail: 'Request rejected.' },
				status,
			),
		);
		await expect(getServices()).rejects.toMatchObject({
			code: 'EXPECTED_ERROR',
			message: 'Request rejected.',
			retryable: false,
		});
	},
);

test.each([500, 408, 429])('allows retry after HTTP %i', async (status) => {
	http.mockResolvedValueOnce(jsonResponse({}, status));
	await expect(getServices()).rejects.toMatchObject({
		code: ApiErrorCodeEnum.HTTP_ERROR,
		retryable: true,
	});
});

test.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, '5000', null])(
	'rejects invalid monetary data: %s',
	async (balanceCents) => {
		http.mockResolvedValueOnce(jsonResponse({ balanceCents }));
		await expect(getWallet(TestData.SESSION_ID)).rejects.toMatchObject({
			code: ApiErrorCodeEnum.INVALID_RESPONSE,
		});
	},
);

test('rejects HTML instead of treating a SPA fallback as a valid API response', async () => {
	http.mockResolvedValueOnce(new Response('<html>Not JSON</html>'));
	await expect(getServices()).rejects.toBeInstanceOf(ApiError);
});

test('converts network failures into retryable errors', async () => {
	http.mockRejectedValueOnce(new TypeError('Offline'));
	await expect(getServices()).rejects.toMatchObject({
		code: ApiErrorCodeEnum.NETWORK_ERROR,
		retryable: true,
	});
});

test('aborts a stalled request and clears its timeout', async () => {
	jest.useFakeTimers();
	http.mockImplementationOnce(
		(_url, options) =>
			new Promise((_resolve, reject) => {
				options?.signal?.addEventListener(
					'abort',
					() => reject(new Error('Aborted')),
					{ once: true },
				);
			}),
	);
	const request = expect(getServices()).rejects.toMatchObject({
		code: ApiErrorCodeEnum.NETWORK_ERROR,
		retryable: true,
	});
	await jest.advanceTimersByTimeAsync(10000);
	await request;
	expect(http.mock.calls[0][1]?.signal?.aborted).toBe(true);
	expect(jest.getTimerCount()).toBe(0);
});
