import { useCallback, useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';

import {
	ApiError,
	createOrder,
	createSession,
	getServices,
	getWallet,
	resetSession,
} from '../../api';
import { ApiErrorCodeEnum } from '../../api/types';
import type { LaundryService } from '../../api/types';
import { readSessionId, writeSessionId } from '../../session/sessionStore';
import type {
	DialogError,
	FeedbackMessage,
	PurchaseIntent,
	ResetIntent,
} from './types';

const FeedbackConstants = {
	DURATION_MS: 6000,
} as const;

function getErrorMessage(error: unknown): string {
	return error instanceof ApiError
		? error.message
		: 'Ocorreu um erro inesperado. Tente novamente.';
}

function useDemoWallet() {
	const [services, setServices] = useState<LaundryService[]>([]);
	const [balanceCents, setBalanceCents] = useState<number | null>(null);
	const [selectedService, setSelectedService] = useState<LaundryService | null>(
		null,
	);

	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isResetOpen, setIsResetOpen] = useState(false);
	const [requiresNewSession, setRequiresNewSession] = useState(false);

	const [loadError, setLoadError] = useState<string | null>(null);
	const [operationError, setOperationError] = useState<string | null>(null);
	const [dialogError, setDialogError] = useState<DialogError | null>(null);
	const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

	const sessionIdRef = useRef<string | null>(null);
	const purchaseRef = useRef<PurchaseIntent | null>(null);
	const resetRef = useRef<ResetIntent | null>(null);
	const requestRunningRef = useRef(false);
	const feedbackIdRef = useRef(0);

	const showFeedback = useCallback((text: string) => {
		feedbackIdRef.current += 1;

		setFeedback({
			id: feedbackIdRef.current,
			text,
		});
	}, []);

	useEffect(() => {
		if (feedback === null) {
			return;
		}

		const timeout = setTimeout(() => {
			setFeedback((current) => (current?.id === feedback.id ? null : current));
		}, FeedbackConstants.DURATION_MS);

		return () => clearTimeout(timeout);
	}, [feedback]);

	const clearDialog = useCallback(() => {
		purchaseRef.current = null;
		resetRef.current = null;

		setSelectedService(null);
		setIsResetOpen(false);
		setOperationError(null);
		setDialogError(null);
	}, []);

	const handleExpiredSession = useCallback(() => {
		writeSessionId(null);
		sessionIdRef.current = null;

		clearDialog();
		setBalanceCents(null);
		setLoadError(null);
		setRequiresNewSession(true);
		setFeedback(null);
	}, [clearDialog]);

	const loadDemo = useCallback(async () => {
		if (
			requestRunningRef.current ||
			purchaseRef.current !== null ||
			resetRef.current !== null
		) {
			return;
		}

		requestRunningRef.current = true;
		setIsLoading(true);
		setLoadError(null);
		setFeedback(null);

		try {
			const catalog = await getServices();
			const storedSessionId = readSessionId();

			if (storedSessionId !== null) {
				const wallet = await getWallet(storedSessionId);

				sessionIdRef.current = storedSessionId;
				setBalanceCents(wallet.balanceCents);
			} else {
				const session = await createSession();

				writeSessionId(session.sessionId);
				sessionIdRef.current = session.sessionId;
				setBalanceCents(session.balanceCents);
			}

			setServices(catalog);
			setRequiresNewSession(false);
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.code === ApiErrorCodeEnum.SESSION_NOT_FOUND
			) {
				handleExpiredSession();
			} else {
				setLoadError(getErrorMessage(error));
			}
		} finally {
			requestRunningRef.current = false;
			setIsLoading(false);
		}
	}, [handleExpiredSession]);

	useEffect(() => {
		void loadDemo();
	}, [loadDemo]);

	const canInteract =
		!isLoading &&
		!isSubmitting &&
		!requiresNewSession &&
		loadError === null &&
		balanceCents !== null &&
		selectedService === null &&
		!isResetOpen;

	function selectService(service: LaundryService) {
		if (
			!canInteract ||
			requestRunningRef.current ||
			purchaseRef.current !== null ||
			resetRef.current !== null ||
			sessionIdRef.current === null
		) {
			return;
		}

		try {
			purchaseRef.current = {
				sessionId: sessionIdRef.current,
				service,
				idempotencyKey: randomUUID(),
				submitted: false,
			};

			setOperationError(null);
			setDialogError(null);
			setFeedback(null);
			setSelectedService(service);
		} catch (error) {
			console.error('Could not create the purchase intention.', error);

			showFeedback(
				'Não foi possível preparar a solicitação. ' +
					'Na Web, utilize localhost ou HTTPS.',
			);
		}
	}

	function openReset() {
		if (
			!canInteract ||
			requestRunningRef.current ||
			purchaseRef.current !== null ||
			resetRef.current !== null ||
			sessionIdRef.current === null
		) {
			return;
		}

		resetRef.current = {
			sessionId: sessionIdRef.current,
			submitted: false,
		};

		setOperationError(null);
		setDialogError(null);
		setFeedback(null);
		setIsResetOpen(true);
	}

	function closeDialog() {
		if (
			requestRunningRef.current ||
			purchaseRef.current?.submitted === true ||
			resetRef.current?.submitted === true
		) {
			return;
		}

		clearDialog();
	}

	async function confirmOperation() {
		const purchase = purchaseRef.current;
		const reset = resetRef.current;

		if (requestRunningRef.current || (purchase === null && reset === null)) {
			return;
		}

		requestRunningRef.current = true;
		setIsSubmitting(true);
		setOperationError(null);

		try {
			if (reset !== null) {
				reset.submitted = true;

				const wallet = await resetSession(reset.sessionId);

				setBalanceCents(wallet.balanceCents);
				clearDialog();
				showFeedback('Demonstração reiniciada. Sua carteira foi restaurada.');
			} else if (purchase !== null) {
				purchase.submitted = true;

				const order = await createOrder(
					purchase.sessionId,
					purchase.service.id,
					purchase.idempotencyKey,
				);

				if (order.serviceId !== purchase.service.id) {
					throw new ApiError(
						'A resposta não corresponde ao serviço solicitado.',
						ApiErrorCodeEnum.INVALID_RESPONSE,
						true,
					);
				}

				setBalanceCents(order.balanceAfterCents);
				clearDialog();

				showFeedback(
					`Solicitação de ${purchase.service.name.toLowerCase()} ` +
						'concluída!',
				);
			}
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.code === ApiErrorCodeEnum.SESSION_NOT_FOUND
			) {
				handleExpiredSession();
			} else if (error instanceof ApiError && !error.retryable) {
				purchaseRef.current = null;
				resetRef.current = null;

				setDialogError({
					title:
						error.code === ApiErrorCodeEnum.INSUFFICIENT_FUNDS
							? 'Saldo insuficiente'
							: 'Não foi possível concluir',
					message: error.message,
				});
			} else {
				setOperationError(
					`${getErrorMessage(error)} ` +
						'O resultado ainda não foi confirmado. ' +
						'Tente novamente antes de iniciar outra operação.',
				);
			}
		} finally {
			requestRunningRef.current = false;
			setIsSubmitting(false);
		}
	}

	return {
		services,
		balanceCents,
		selectedService,
		isLoading,
		isSubmitting,
		isResetOpen,
		requiresNewSession,
		loadError,
		operationError,
		dialogError,
		feedback,
		canInteract,
		loadDemo,
		selectService,
		openReset,
		closeDialog,
		confirmOperation,
		dismissFeedback: () => setFeedback(null),
	};
}

export { useDemoWallet };
