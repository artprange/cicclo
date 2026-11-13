import { act, renderHook } from '@testing-library/react-native';

import { useDemoWallet } from './index';
import { writeSessionId } from '../../session/sessionStore';
import {
	TestData,
	deferred,
	jsonResponse,
	mockHttp,
	orderResponse,
} from '../../../tests/http';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'purchase-key' }));

afterEach(() => {
	delete process.env.EXPO_PUBLIC_API_URL;
});

test('sends one order when confirmation is invoked twice before React renders', async () => {
	process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
	writeSessionId(null);
	const http = mockHttp();
	http.mockResolvedValueOnce(jsonResponse(TestData.SERVICES));
	http.mockResolvedValueOnce(
		jsonResponse({ sessionId: TestData.SESSION_ID, balanceCents: 5000 }, 201),
	);
	const pending = deferred<Response>();
	http.mockReturnValueOnce(pending.promise);
	const { result } = await renderHook(() => useDemoWallet());
	await act(() => result.current.selectService(result.current.services[0]));
	let first!: Promise<void>;
	let second!: Promise<void>;
	await act(() => {
		first = result.current.confirmOperation();
		second = result.current.confirmOperation();
		result.current.closeDialog();
		result.current.openReset();
	});
	expect(http).toHaveBeenCalledTimes(3);
	expect(result.current.isSubmitting).toBe(true);
	expect(result.current.selectedService?.id).toBe('wash');
	expect(result.current.isResetOpen).toBe(false);
	await act(async () => {
		pending.resolve(jsonResponse(orderResponse()));
		await Promise.all([first, second]);
	});
	expect(result.current.balanceCents).toBe(3110);
	expect(result.current.canInteract).toBe(true);
});
