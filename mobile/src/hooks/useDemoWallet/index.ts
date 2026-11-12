import { useCallback, useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';

import {
	ApiError,
	createOrder,
	createSession,
	getServices,
	getWallet,
} from '../../api';
import { ApiErrorCodeEnum } from '../../api/types';
import type { LaundryService } from '../../api/types';
import { readSessionId, writeSessionId } from '../../session/sessionStore';
import { PurchaseIntent } from './types';

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
	const [requiresNewSession, setRequiresNewSession] = useState(false);

	const [loadError, setLoadError] = useState<string | null>(null);
	const [purchaseError, setPurchaseError] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);

	const sessionIdRef = useRef<string | null>(null);
	const intentRef = useRef<PurchaseIntent | null>(null);
	const requestRunningRef = useRef(false);

	const handleExpiredSession = useCallback(() => {
		writeSessionId(null);
		sessionIdRef.current = null;
		intentRef.current = null;

		setSelectedService(null);
		setBalanceCents(null);
		setPurchaseError(null);
		setLoadError(null);
		setRequiresNewSession(true);

		setFeedback(
			'Sua sessão não está mais disponível. Isso pode ocorrer quando ' +
				'o servidor reinicia. Crie uma nova demonstração para continuar.',
		);
	}, []);

	const loadDemo = useCallback(async () => {
		if (requestRunningRef.current || intentRef.current !== null) {
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

				setFeedback('Nova demonstração criada. Sua carteira está pronta.');
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

	function selectService(service: LaundryService) {
		if (
			requestRunningRef.current ||
			intentRef.current !== null ||
			sessionIdRef.current === null ||
			loadError !== null ||
			requiresNewSession
		) {
			return;
		}

		try {
			intentRef.current = {
				sessionId: sessionIdRef.current,
				service,
				idempotencyKey: randomUUID(),
				submitted: false,
			};

			setPurchaseError(null);
			setFeedback(null);
			setSelectedService(service);
		} catch (error) {
			console.error('Could not create the purchase intention.', error);

			setFeedback(
				'Não foi possível preparar a solicitação. ' +
					'Na Web, utilize localhost ou uma conexão HTTPS.',
			);
		}
	}

	function closeConfirmation() {
		if (requestRunningRef.current || intentRef.current?.submitted === true) {
			return;
		}

		intentRef.current = null;
		setSelectedService(null);
		setPurchaseError(null);
	}

	async function confirmPurchase() {
		const intent = intentRef.current;

		if (intent === null || requestRunningRef.current) {
			return;
		}

		requestRunningRef.current = true;
		intent.submitted = true;

		setIsSubmitting(true);
		setPurchaseError(null);

		try {
			const order = await createOrder(
				intent.sessionId,
				intent.service.id,
				intent.idempotencyKey,
			);

			if (order.serviceId !== intent.service.id) {
				throw new ApiError(
					'A resposta recebida não corresponde ao serviço solicitado.',
					ApiErrorCodeEnum.INVALID_RESPONSE,
					true,
				);
			}

			setBalanceCents(order.balanceAfterCents);

			setFeedback(
				`Solicitação fictícia de ${intent.service.name.toLowerCase()} ` +
					'aceita. Nenhuma máquina física foi acionada.',
			);

			intentRef.current = null;
			setSelectedService(null);
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.code === ApiErrorCodeEnum.SESSION_NOT_FOUND
			) {
				handleExpiredSession();
			} else if (error instanceof ApiError && !error.retryable) {
				intentRef.current = null;
				setSelectedService(null);
				setFeedback(error.message);
			} else {
				setPurchaseError(
					`${getErrorMessage(error)} ` +
						'O resultado da compra ainda não foi confirmado. ' +
						'Tente novamente para consultar a mesma operação.',
				);
			}
		} finally {
			requestRunningRef.current = false;
			setIsSubmitting(false);
		}
	}

	const canPurchase =
		!isLoading &&
		!isSubmitting &&
		!requiresNewSession &&
		loadError === null &&
		balanceCents !== null;

	return {
		services,
		balanceCents,
		selectedService,
		isLoading,
		isSubmitting,
		requiresNewSession,
		loadError,
		purchaseError,
		feedback,
		canPurchase,
		loadDemo,
		selectService,
		closeConfirmation,
		confirmPurchase,
	};
}

export { useDemoWallet };
