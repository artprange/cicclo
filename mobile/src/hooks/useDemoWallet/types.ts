import type { LaundryService } from '../../api/types';

type PurchaseIntent = {
	sessionId: string;
	service: LaundryService;
	idempotencyKey: string;
	submitted: boolean;
};

type ResetIntent = {
	sessionId: string;
	submitted: boolean;
};

type DialogError = {
	title: string;
	message: string;
};

type FeedbackMessage = {
	id: number;
	text: string;
};

export type { PurchaseIntent, ResetIntent, DialogError, FeedbackMessage };
