import { Platform } from 'react-native';

const SessionConstants = {
	KEY: 'cicclo.demo.sessionId',
	ID: '11111111-1111-4111-8111-111111111111',
} as const;

let storage: { getItem: jest.Mock; setItem: jest.Mock; removeItem: jest.Mock };
const originalStorage = Object.getOwnPropertyDescriptor(
	window,
	'sessionStorage',
);

beforeEach(() => {
	jest.replaceProperty(Platform, 'OS', 'web');
	storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
	Object.defineProperty(window, 'sessionStorage', {
		value: storage,
		configurable: true,
	});
});

afterEach(() => {
	if (originalStorage)
		Object.defineProperty(window, 'sessionStorage', originalStorage);
	else Reflect.deleteProperty(window, 'sessionStorage');
});

function freshStore(): typeof import('./sessionStore') {
	let store!: typeof import('./sessionStore');
	jest.isolateModules(() => {
		const native =
			jest.requireActual<typeof import('react-native')>('react-native');
		jest.replaceProperty(native.Platform, 'OS', Platform.OS);
		store =
			jest.requireActual<typeof import('./sessionStore')>('./sessionStore');
	});
	return store;
}

test('restores the identifier from sessionStorage on first access', () => {
	storage.getItem.mockReturnValue(SessionConstants.ID);
	const store = freshStore();
	expect(store.readSessionId()).toBe(SessionConstants.ID);
	expect(store.readSessionId()).toBe(SessionConstants.ID);
	expect(storage.getItem).toHaveBeenCalledTimes(1);
	expect(storage.getItem).toHaveBeenCalledWith(SessionConstants.KEY);
});

test('persists only the identifier and removes it when the session expires', () => {
	const store = freshStore();
	store.writeSessionId(SessionConstants.ID);
	expect(storage.setItem).toHaveBeenCalledTimes(1);
	expect(storage.setItem).toHaveBeenCalledWith(
		SessionConstants.KEY,
		SessionConstants.ID,
	);
	store.writeSessionId(null);
	expect(storage.removeItem).toHaveBeenCalledWith(SessionConstants.KEY);
	expect(store.readSessionId()).toBeNull();
});

test('keeps the session in memory when browser storage is blocked', () => {
	const warning = jest
		.spyOn(console, 'warn')
		.mockImplementation(() => undefined);
	storage.getItem.mockImplementation(() => {
		throw new Error('Blocked');
	});
	storage.setItem.mockImplementation(() => {
		throw new Error('Blocked');
	});
	const store = freshStore();
	expect(store.readSessionId()).toBeNull();
	store.writeSessionId(SessionConstants.ID);
	expect(store.readSessionId()).toBe(SessionConstants.ID);
	expect(warning).toHaveBeenCalledTimes(2);
});

test('uses memory without accessing browser storage on native platforms', () => {
	jest.replaceProperty(Platform, 'OS', 'ios');
	const store = freshStore();
	store.writeSessionId(SessionConstants.ID);
	expect(store.readSessionId()).toBe(SessionConstants.ID);
	expect(storage.getItem).not.toHaveBeenCalled();
	expect(storage.setItem).not.toHaveBeenCalled();
});
