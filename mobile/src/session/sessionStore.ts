import { Platform } from 'react-native';

const SessionConstants = {
	STORAGE_KEY: 'cicclo.demo.sessionId',
} as const;

let memorySessionId: string | null = null;
let initialized = false;

function readSessionId(): string | null {
	if (initialized) {
		return memorySessionId;
	}

	initialized = true;

	if (Platform.OS === 'web' && typeof window !== 'undefined') {
		try {
			memorySessionId = window.sessionStorage.getItem(
				SessionConstants.STORAGE_KEY,
			);
		} catch (error) {
			console.warn(
				'Session storage is unavailable; using memory instead.',
				error,
			);
		}
	}

	return memorySessionId;
}

function writeSessionId(sessionId: string | null): void {
	initialized = true;
	memorySessionId = sessionId;

	if (Platform.OS === 'web' && typeof window !== 'undefined') {
		try {
			if (sessionId === null) {
				window.sessionStorage.removeItem(SessionConstants.STORAGE_KEY);
			} else {
				window.sessionStorage.setItem(SessionConstants.STORAGE_KEY, sessionId);
			}
		} catch (error) {
			console.warn(
				'Session storage is unavailable; keeping the session in memory.',
				error,
			);
		}
	}
}

export { readSessionId, writeSessionId };
