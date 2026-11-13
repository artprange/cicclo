import { Platform } from 'react-native';

import { ApiErrorCodeEnum } from './types';
import {
	isOrder,
	isRecord,
	isServiceList,
	isSession,
	isWallet,
} from './validators';

const ApiConstants = {
	TIMEOUT_MS: 10000,
} as const;

const ApiRoutes = {
	SERVICES: '/api/services',
	SESSIONS: '/api/demo/sessions',
	WALLET: '/api/wallet',
	ORDERS: '/api/orders',
	RESET: '/api/demo/sessions/reset',
} as const;

type RequestOptions = {
	method?: 'GET' | 'POST';
	sessionId?: string;
	idempotencyKey?: string;
	body?: {
		serviceId: string;
	};
};

class ApiError extends Error {
	constructor(
		message: string,
		readonly code: string,
		readonly retryable: boolean,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

function getBaseUrl(): string {
	if (Platform.OS === 'web' && !__DEV__) {
		return '';
	}

	const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

	if (!configuredUrl) {
		throw new ApiError(
			'Configure EXPO_PUBLIC_API_URL para acessar a API local.',
			ApiErrorCodeEnum.CONFIGURATION_ERROR,
			false,
		);
	}

	return configuredUrl.replace(/\/+$/, '');
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

async function request<T>(
	path: string,
	validate: (value: unknown) => value is T,
	options: RequestOptions = {},
): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), ApiConstants.TIMEOUT_MS);

	try {
		const headers: Record<string, string> = {
			Accept: 'application/json',
		};

		if (options.sessionId !== undefined) {
			headers['X-Demo-Session'] = options.sessionId;
		}

		if (options.idempotencyKey !== undefined) {
			headers['Idempotency-Key'] = options.idempotencyKey;
		}

		if (options.body !== undefined) {
			headers['Content-Type'] = 'application/json';
		}

		const response = await fetch(`${getBaseUrl()}${path}`, {
			method: options.method ?? 'GET',
			headers,
			body:
				options.body === undefined ? undefined : JSON.stringify(options.body),
			signal: controller.signal,
		});

		const data = parseJson(await response.text());

		if (!response.ok) {
			const code =
				isRecord(data) && typeof data.code === 'string'
					? data.code
					: ApiErrorCodeEnum.HTTP_ERROR;

			const message =
				isRecord(data) && typeof data.detail === 'string'
					? data.detail
					: 'Não foi possível concluir a solicitação.';

			throw new ApiError(
				message,
				code,
				response.status >= 500 ||
					response.status === 408 ||
					response.status === 429,
			);
		}

		if (!validate(data)) {
			throw new ApiError(
				'A API retornou uma resposta inesperada.',
				ApiErrorCodeEnum.INVALID_RESPONSE,
				true,
			);
		}

		return data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		throw new ApiError(
			controller.signal.aborted
				? 'NOsso sistema está instável. Tente novamente mais tarde.'
				: 'Alguma coisa quebrou :(',
			ApiErrorCodeEnum.NETWORK_ERROR,
			true,
		);
	} finally {
		clearTimeout(timeout);
	}
}

function getServices() {
	return request(ApiRoutes.SERVICES, isServiceList);
}

function createSession() {
	return request(ApiRoutes.SESSIONS, isSession, {
		method: 'POST',
	});
}

function getWallet(sessionId: string) {
	return request(ApiRoutes.WALLET, isWallet, { sessionId });
}

function createOrder(
	sessionId: string,
	serviceId: string,
	idempotencyKey: string,
) {
	return request(ApiRoutes.ORDERS, isOrder, {
		method: 'POST',
		sessionId,
		idempotencyKey,
		body: { serviceId },
	});
}

function resetSession(sessionId: string) {
	return request(ApiRoutes.RESET, isWallet, {
		method: 'POST',
		sessionId,
	});
}

export {
	ApiError,
	getServices,
	createSession,
	getWallet,
	createOrder,
	resetSession,
};
