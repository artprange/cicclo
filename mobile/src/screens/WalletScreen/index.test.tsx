import { AccessibilityInfo } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { WalletScreen } from './index';
import { writeSessionId } from '../../session/sessionStore';
import { formatCurrency } from '../../utils/formatCurrency';
import {
	TestData,
	deferred,
	jsonResponse,
	mockHttp,
	orderResponse,
} from '../../../tests/http';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));

let http: ReturnType<typeof mockHttp>;

beforeEach(() => {
	process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
	writeSessionId(null);
	jest
		.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
		.mockResolvedValue(true);
	let key = 0;
	jest
		.mocked(randomUUID)
		.mockImplementation(
			() => `00000000-0000-4000-8000-${String(++key).padStart(12, '0')}`,
		);
	http = mockHttp();
});

afterEach(() => {
	delete process.env.EXPO_PUBLIC_API_URL;
});

function queueLoad(balanceCents = 5000) {
	http.mockResolvedValueOnce(jsonResponse(TestData.SERVICES));
	http.mockResolvedValueOnce(
		jsonResponse(
			{
				sessionId: TestData.SESSION_ID,
				balanceCents,
			},
			201,
		),
	);
}

function balance(value: number) {
	return screen.getByLabelText(`Saldo disponível: ${formatCurrency(value)}`);
}

async function press(name: string) {
	await userEvent
		.setup()
		.press(screen.getByRole('button', { name, disabled: name === 'Aguarde…' }));
}

test('shows loading until the server provides the catalog and wallet', async () => {
	const pending = deferred<Response>();
	http.mockReturnValueOnce(pending.promise);
	http.mockResolvedValueOnce(
		jsonResponse(
			{
				sessionId: TestData.SESSION_ID,
				balanceCents: 4321,
			},
			201,
		),
	);
	await render(<WalletScreen />);
	expect(screen.getByRole('progressbar')).toBeBusy();
	expect(
		screen.queryByRole('button', { name: 'Solicitar lavagem' }),
	).not.toBeOnTheScreen();
	await act(async () => pending.resolve(jsonResponse(TestData.SERVICES)));
	expect(balance(4321)).toBeOnTheScreen();
	expect(screen.getByText(formatCurrency(1890))).toBeOnTheScreen();
	expect(screen.getByText(formatCurrency(2090))).toBeOnTheScreen();
});

test('cancels a purchase without sending an order and shows only the selected service in the dialog', async () => {
	queueLoad();
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	expect(
		screen.getByRole('button', { name: 'Confirmar solicitação' }),
	).toBeEnabled();
	expect(
		screen.getAllByRole('button', {
			name: 'Solicitar lavagem',
			includeHiddenElements: true,
		}),
	).toHaveLength(1);
	await press('Cancelar');
	expect(
		screen.queryByRole('button', { name: 'Confirmar solicitação' }),
	).not.toBeOnTheScreen();
	expect(balance(5000)).toBeOnTheScreen();
	expect(http).toHaveBeenCalledTimes(2);
});

test('disables repeated confirmation while pending and uses the server balance', async () => {
	queueLoad();
	const pending = deferred<Response>();
	http.mockReturnValueOnce(pending.promise);
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(screen.getByRole('button', { name: 'Aguarde…' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
	await press('Aguarde…');
	expect(http).toHaveBeenCalledTimes(3);
	await act(async () => pending.resolve(jsonResponse(orderResponse(2876))));
	expect(balance(2876)).toBeOnTheScreen();
	expect(
		screen.getByRole('button', { name: 'Solicitar lavagem' }),
	).toBeEnabled();
});

test('retries an uncertain purchase with the same key before allowing a new intention', async () => {
	queueLoad();
	http.mockRejectedValueOnce(new TypeError('Offline'));
	http.mockResolvedValueOnce(jsonResponse(orderResponse()));
	http.mockResolvedValueOnce(jsonResponse(orderResponse(1020, 'dry')));
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(screen.getByRole('alert')).toHaveTextContent(
		/O resultado ainda não foi confirmado/,
	);
	expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
	await press('Tentar novamente');
	expect(balance(3110)).toBeOnTheScreen();
	const firstHeaders = http.mock.calls[2][1]?.headers;
	expect(http.mock.calls[3][1]?.headers).toEqual(firstHeaders);
	expect(jest.mocked(randomUUID)).toHaveBeenCalledTimes(1);
	await press('Solicitar secagem');
	await press('Confirmar solicitação');
	expect(balance(1020)).toBeOnTheScreen();
	expect(http.mock.calls[4][1]?.headers).not.toEqual(firstHeaders);
});

test('keeps the balance on insufficient funds and allows dismissing the error', async () => {
	queueLoad(1020);
	http.mockResolvedValueOnce(
		jsonResponse(
			{
				code: 'INSUFFICIENT_FUNDS',
				detail: 'Saldo insuficiente para este serviço.',
			},
			409,
		),
	);
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(
		screen.getByRole('header', { name: 'Saldo insuficiente' }),
	).toBeOnTheScreen();
	await press('Entendi');
	expect(balance(1020)).toBeOnTheScreen();
	expect(
		screen.getByRole('button', { name: 'Solicitar lavagem' }),
	).toBeEnabled();
});

test('requires confirmation to reset and uses a new purchase key afterwards', async () => {
	queueLoad();
	http.mockResolvedValueOnce(jsonResponse(orderResponse()));
	http.mockResolvedValueOnce(jsonResponse({ balanceCents: 5000 }));
	http.mockResolvedValueOnce(jsonResponse(orderResponse()));
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	await press('Reiniciar demonstração');
	await press('Cancelar');
	expect(http).toHaveBeenCalledTimes(3);
	expect(balance(3110)).toBeOnTheScreen();
	await press('Reiniciar demonstração');
	await press('Reiniciar demonstração');
	expect(balance(5000)).toBeOnTheScreen();
	expect(http.mock.calls[3][0]).toBe(
		'https://api.example.test/api/demo/sessions/reset',
	);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(http.mock.calls[4][1]?.headers).not.toEqual(
		http.mock.calls[2][1]?.headers,
	);
});

test('restores an existing session instead of creating a wallet on mount', async () => {
	writeSessionId(TestData.SESSION_ID);
	http.mockResolvedValueOnce(jsonResponse(TestData.SERVICES));
	http.mockResolvedValueOnce(jsonResponse({ balanceCents: 1020 }));
	await render(<WalletScreen />);
	expect(balance(1020)).toBeOnTheScreen();
	expect(http.mock.calls[1][0]).toBe('https://api.example.test/api/wallet');
	expect(http.mock.calls[1][1]?.method).toBe('GET');
});

test('asks to create a new demo after an expired session and recovers', async () => {
	writeSessionId(TestData.SESSION_ID);
	http.mockResolvedValueOnce(jsonResponse(TestData.SERVICES));
	http.mockResolvedValueOnce(jsonResponse({ code: 'SESSION_NOT_FOUND' }, 404));
	queueLoad();
	await render(<WalletScreen />);
	expect(screen.getByRole('alert')).toHaveTextContent(
		/Sua sessão não está mais disponível/,
	);
	await press('Criar nova demonstração');
	expect(balance(5000)).toBeOnTheScreen();
	expect(http.mock.calls[3][0]).toBe(
		'https://api.example.test/api/demo/sessions',
	);
});

test('shows a recoverable load error without rendering purchase buttons', async () => {
	http.mockRejectedValueOnce(new TypeError('Offline'));
	queueLoad();
	await render(<WalletScreen />);
	expect(screen.getByRole('alert')).toBeOnTheScreen();
	expect(
		screen.queryByRole('button', { name: 'Solicitar lavagem' }),
	).not.toBeOnTheScreen();
	await press('Tentar novamente');
	expect(balance(5000)).toBeOnTheScreen();
});

test('rejects an order for another service without accepting its balance', async () => {
	queueLoad();
	http.mockResolvedValueOnce(jsonResponse(orderResponse(2910, 'dry')));
	http.mockResolvedValueOnce(jsonResponse(orderResponse()));
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(screen.getByRole('alert')).toHaveTextContent(
		/não corresponde ao serviço/,
	);
	expect(balance(5000)).toBeOnTheScreen();
	await press('Tentar novamente');
	expect(balance(3110)).toBeOnTheScreen();
	expect(http.mock.calls[3][1]?.headers).toEqual(
		http.mock.calls[2][1]?.headers,
	);
});

test('requires a new demo when the session expires during purchase', async () => {
	queueLoad();
	http.mockResolvedValueOnce(jsonResponse({ code: 'SESSION_NOT_FOUND' }, 404));
	await render(<WalletScreen />);
	await press('Solicitar lavagem');
	await press('Confirmar solicitação');
	expect(
		screen.getByRole('button', { name: 'Criar nova demonstração' }),
	).toBeEnabled();
	expect(
		screen.queryByLabelText('Saldo disponível: ' + formatCurrency(5000)),
	).not.toBeOnTheScreen();
	expect(http).toHaveBeenCalledTimes(3);
});

test('retries an uncertain reset for the same session before allowing purchases', async () => {
	queueLoad(1020);
	http.mockRejectedValueOnce(new TypeError('Offline'));
	http.mockResolvedValueOnce(jsonResponse({ balanceCents: 5000 }));
	await render(<WalletScreen />);
	await press('Reiniciar demonstração');
	await press('Reiniciar demonstração');
	expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
	expect(balance(1020)).toBeOnTheScreen();
	await press('Tentar novamente');
	expect(balance(5000)).toBeOnTheScreen();
	expect(http.mock.calls[3][0]).toEqual(http.mock.calls[2][0]);
	expect(http.mock.calls[3][1]?.headers).toEqual(
		http.mock.calls[2][1]?.headers,
	);
});
