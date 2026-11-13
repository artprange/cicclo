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
import { ServiceIcon } from '../../components/ServiceIcon';
import { WalletSkeleton } from '../../components/WalletSkeleton';
import { useDemoWallet } from '../../hooks/useDemoWallet';
import { formatCurrency } from '../../utils/formatCurrency';
import { styles } from './styles';
import { BrandLogo } from '../../components/BrandLogo';

const ScreenConstants = {
	COMPACT_WIDTH: 640,
	TOAST_BOTTOM_SPACING: 16,
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

	const canCloseDialog = !isSubmitting && operationError === null;

	const dialogTitle =
		dialogError?.title ??
		(isResetOpen ? 'Reiniciar demonstração?' : 'Confirmar solicitação');

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
							<BrandLogo />
						</View>

						<View style={styles.introduction}>
							<Text
								accessibilityRole="header"
								style={styles.title}
							>
								Roupa limpa, alma leve.
							</Text>

							<Text style={styles.description}>
								Escolha o cuidado que suas roupas precisam.
							</Text>
						</View>

						{isLoading ? (
							<WalletSkeleton compact={isCompact} />
						) : requiresNewSession || loadError !== null ? (
							<View style={styles.loadError}>
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
									<Text
										accessibilityRole="header"
										style={styles.walletTitle}
									>
										Minha carteira
									</Text>

									<Text style={styles.balanceLabel}>Saldo disponível</Text>

									<Text
										accessibilityLabel={`Saldo disponível: ${balanceLabel}`}
										accessibilityLiveRegion="polite"
										style={styles.balanceValue}
									>
										{balanceLabel}
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
											<View style={isCompact && styles.serviceIconCompact}>
												<ServiceIcon serviceId={service.id} />
											</View>

											<Text
												accessibilityRole="header"
												style={[
													styles.serviceName,
													isCompact && styles.serviceTextCompact,
												]}
											>
												{service.name}
											</Text>

											<Text
												style={[
													styles.servicePrice,
													isCompact && styles.serviceTextCompact,
												]}
											>
												{formatCurrency(service.priceCents)}
											</Text>

											<Text
												style={[
													styles.serviceCaption,
													isCompact && styles.serviceTextCompact,
												]}
											>
												Valor por solicitação
											</Text>

											<ActionButton
												label={`Solicitar ${service.name.toLowerCase()}`}
												variant={ButtonVariantEnum.BRAND}
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
					<View
						style={[
							styles.toast,
							{
								bottom: insets.bottom + ScreenConstants.TOAST_BOTTOM_SPACING,
							},
						]}
					>
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
					<ScrollView
						contentContainerStyle={styles.modalContainer}
						keyboardShouldPersistTaps="handled"
					>
						<Pressable
							accessible={false}
							disabled={!canCloseDialog}
							onPress={closeDialog}
							style={styles.modalBackdrop}
						/>

						<View
							accessibilityViewIsModal
							style={styles.modalCard}
						>
							<View style={styles.modalHeader}>
								<Text style={styles.serviceEyebrow}>
									{dialogError !== null ? 'ATENÇÃO' : 'CONFIRMAÇÃO'}
								</Text>

								<Pressable
									accessibilityRole="button"
									accessibilityLabel="Fechar diálogo"
									accessibilityState={{
										disabled: !canCloseDialog,
									}}
									disabled={!canCloseDialog}
									onPress={closeDialog}
									style={[
										styles.modalClose,
										!canCloseDialog && styles.modalCloseDisabled,
									]}
								>
									<Text style={styles.modalCloseText}>Fechar</Text>
								</Pressable>
							</View>

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
											: 'O valor será descontado da sua carteira após a confirmação. Nenhuma máquina física será acionada.'}
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
											variant={ButtonVariantEnum.BRAND}
											loading={isSubmitting}
											onPress={() => void confirmOperation()}
										/>

										<ActionButton
											label="Cancelar"
											variant={ButtonVariantEnum.SECONDARY}
											disabled={!canCloseDialog}
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
