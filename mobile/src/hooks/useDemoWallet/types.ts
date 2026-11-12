import type { LaundryService } from '../../api/types';

interface PurchaseIntent {
	sessionId: string;
	service: LaundryService;
	idempotencyKey: string;
	submitted: boolean;
}

export type { PurchaseIntent };
