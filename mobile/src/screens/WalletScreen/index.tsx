import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ActionButton } from '../../components/ActionButton';
import { ButtonVariantEnum } from '../../components/ActionButton/types';
import { WalletSkeleton } from '../../components/WalletSkeleton';
import { useDemoWallet } from '../../hooks/useDemoWallet';
import { formatCurrency } from '../../utils/formatCurrency';
import { styles } from './styles';

const ScreenConstants = {
	COMPACT_WIDTH: 640,
} as const;

function WalletScreen() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const isCompact = width < ScreenConstants.COMPACT_WIDTH;

	const {
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
		dismissFeedback,
	} = useDemoWallet();

	const balanceLabel =
		balanceCents === null ? '—' : formatCurrency(balanceCents);

	const modalVisible = selectedService !== null || isResetOpen;

	const dialogTitle =
		dialogError?.title ??
		(isResetOpen ? 'Reiniciar demonstração?' : 'Conferir solicitação');

	const confirmLabel = isSubmitting
		? 'Aguarde…'
		: operationError !== null
			? 'Tentar novamente'
			: isResetOpen
				? 'Reiniciar demonstração'
				: 'Confirmar solicitação';

	return (
		<>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView
					contentContainerStyle={[styles.page, isCompact && styles.compactPage]}
				>
					<View style={styles.content}>
						<View style={styles.header}>
							<Text
								accessibilityRole="header"
								style={styles.brand}
							>
								cicclo
							</Text>

							<View style={styles.badge}>
								<Text style={styles.badgeText}>Demonstração</Text>
							</View>
						</View>

						<View style={styles.introduction}>
							<Text
								accessibilityRole="header"
								style={styles.title}
							>
								Sua lavanderia, sem complicação.
							</Text>

							<Text style={styles.description}>
								Escolha o serviço e confira os detalhes antes de continuar.
							</Text>
						</View>

						{isLoading ? (
							<WalletSkeleton compact={isCompact} />
						) : requiresNewSession || loadError !== null ? (
							<View style={styles.sectionHeading}>
								<Text
									accessibilityRole="alert"
									style={styles.description}
								>
									{requiresNewSession
										? 'Sua sessão não está mais disponível. O servidor pode ter sido reiniciado. Crie uma nova demonstração para continuar.'
										: loadError}
								</Text>

								<ActionButton
									label={
										requiresNewSession
											? 'Criar nova demonstração'
											: 'Tentar novamente'
									}
									onPress={() => void loadDemo()}
								/>
							</View>
						) : (
							<>
								<View style={styles.balanceCard}>
									<Text style={styles.balanceLabel}>Saldo da demonstração</Text>

									<Text
										accessibilityLabel={`Saldo disponível: ${balanceLabel}`}
										accessibilityLiveRegion="polite"
										style={styles.balanceValue}
									>
										{balanceLabel}
									</Text>

									<Text style={styles.balanceCaption}>
										Carteira fictícia · sem pagamentos reais
									</Text>
								</View>

								<View style={styles.sectionHeading}>
									<Text
										accessibilityRole="header"
										style={styles.sectionTitle}
									>
										Serviços disponíveis
									</Text>

									<Text style={styles.description}>
										Um cuidado para cada etapa.
									</Text>
								</View>

								<View
									style={[styles.services, isCompact && styles.servicesStacked]}
								>
									{services.map((service) => (
										<View
											key={service.id}
											style={styles.serviceCard}
										>
											<Text style={styles.serviceEyebrow}>AUTOATENDIMENTO</Text>

											<Text
												accessibilityRole="header"
												style={styles.serviceName}
											>
												{service.name}
											</Text>

											<Text style={styles.servicePrice}>
												{formatCurrency(service.priceCents)}
											</Text>

											<Text style={styles.serviceCaption}>
												Valor por solicitação
											</Text>

											<ActionButton
												label={`Solicitar ${service.name.toLowerCase()}`}
												disabled={!canInteract}
												onPress={() => selectService(service)}
											/>
										</View>
									))}
								</View>

								<ActionButton
									label="Reiniciar demonstração"
									variant={ButtonVariantEnum.SECONDARY}
									disabled={!canInteract}
									onPress={openReset}
								/>
							</>
						)}
					</View>
				</ScrollView>

				{feedback !== null && (
					<View style={[styles.toast, { bottom: insets.bottom + 16 }]}>
						<Text
							accessibilityLiveRegion="polite"
							style={styles.toastText}
						>
							{feedback.text}
						</Text>

						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Fechar mensagem"
							onPress={dismissFeedback}
							style={styles.toastClose}
						>
							<Text style={styles.toastCloseText}>Fechar</Text>
						</Pressable>
					</View>
				)}
			</SafeAreaView>

			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={closeDialog}
			>
				<SafeAreaView style={styles.overlay}>
					<ScrollView contentContainerStyle={styles.modalContainer}>
						<View
							accessibilityViewIsModal
							style={styles.modalCard}
						>
							<Text style={styles.serviceEyebrow}>
								{dialogError !== null ? 'ATENÇÃO' : 'CONFIRMAÇÃO'}
							</Text>

							<Text
								accessibilityRole="header"
								accessibilityLiveRegion="polite"
								style={styles.modalTitle}
							>
								{dialogTitle}
							</Text>

							{dialogError !== null ? (
								<>
									<Text
										accessibilityRole="alert"
										style={styles.description}
									>
										{dialogError.message}
									</Text>

									<ActionButton
										label="Entendi"
										onPress={closeDialog}
									/>
								</>
							) : (
								<>
									{selectedService !== null && (
										<View style={styles.summary}>
											<Text style={styles.serviceName}>
												{selectedService.name}
											</Text>

											<Text style={styles.summaryPrice}>
												{formatCurrency(selectedService.priceCents)}
											</Text>
										</View>
									)}

									<Text style={styles.description}>
										{isResetOpen
											? 'O saldo desta sessão voltará ao valor inicial e as solicitações anteriores serão apagadas. Outras sessões não serão afetadas.'
											: 'O valor será descontado da sua carteira fictícia após a confirmação da solicitação.'}
									</Text>

									{operationError !== null && (
										<Text
											accessibilityRole="alert"
											style={styles.feedbackText}
										>
											{operationError}
										</Text>
									)}

									<View style={styles.modalActions}>
										<ActionButton
											label={confirmLabel}
											loading={isSubmitting}
											onPress={() => void confirmOperation()}
										/>

										<ActionButton
											label="Voltar"
											variant={ButtonVariantEnum.SECONDARY}
											disabled={isSubmitting || operationError !== null}
											onPress={closeDialog}
										/>
									</View>
								</>
							)}
						</View>
					</ScrollView>
				</SafeAreaView>
			</Modal>
		</>
	);
}

export { WalletScreen };
