import {
	ActivityIndicator,
	Modal,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../components/ActionButton';
import { ButtonVariantEnum } from '../../components/ActionButton/types';
import { useDemoWallet } from '../../hooks/useDemoWallet';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { styles } from './styles';

const ScreenConstants = {
	COMPACT_WIDTH: 640,
} as const;

function WalletScreen() {
	const { width } = useWindowDimensions();
	const isCompact = width < ScreenConstants.COMPACT_WIDTH;

	const {
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
	} = useDemoWallet();

	const balanceLabel =
		balanceCents === null ? '—' : formatCurrency(balanceCents);

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

						<View style={styles.balanceCard}>
							<Text style={styles.balanceLabel}>Saldo da demonstração</Text>

							<Text
								accessibilityLabel={
									balanceCents === null
										? 'Saldo indisponível'
										: `Saldo disponível: ${balanceLabel}`
								}
								accessibilityLiveRegion="polite"
								style={styles.balanceValue}
							>
								{balanceLabel}
							</Text>

							<Text style={styles.balanceCaption}>
								Carteira fictícia · sem pagamentos reais
							</Text>
						</View>

						{isLoading && (
							<View style={styles.sectionHeading}>
								<ActivityIndicator
									size="large"
									color={Colors.PRIMARY_DARK}
								/>

								<Text
									accessibilityLiveRegion="polite"
									style={styles.description}
								>
									Carregando sua demonstração…
								</Text>
							</View>
						)}

						{feedback !== null && (
							<View style={styles.feedback}>
								<Text
									accessibilityLiveRegion="polite"
									style={styles.feedbackText}
								>
									{feedback}
								</Text>
							</View>
						)}

						{loadError !== null && (
							<View style={styles.feedback}>
								<Text
									accessibilityRole="alert"
									style={styles.feedbackText}
								>
									{loadError}
								</Text>
							</View>
						)}

						{!isLoading && (requiresNewSession || loadError !== null) && (
							<ActionButton
								label={
									requiresNewSession
										? 'Criar nova demonstração'
										: 'Tentar novamente'
								}
								onPress={() => void loadDemo()}
							/>
						)}

						{!isLoading && !requiresNewSession && loadError === null && (
							<>
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
												disabled={!canPurchase}
												onPress={() => selectService(service)}
											/>
										</View>
									))}
								</View>
							</>
						)}

						<View style={styles.previewNotice}>
							<Text style={styles.previewTitle}>Sobre esta demonstração</Text>

							<Text style={styles.description}>
								As solicitações usam uma carteira fictícia. Reiniciar o servidor
								apaga as sessões e seus saldos. Nenhuma máquina física é
								acionada.
							</Text>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<Modal
				visible={selectedService !== null}
				transparent
				animationType="fade"
				onRequestClose={closeConfirmation}
			>
				<SafeAreaView style={styles.overlay}>
					<ScrollView contentContainerStyle={styles.modalContainer}>
						{selectedService !== null && (
							<View
								accessibilityViewIsModal
								style={styles.modalCard}
							>
								<Text style={styles.serviceEyebrow}>CONFIRMAÇÃO</Text>

								<Text
									accessibilityRole="header"
									style={styles.modalTitle}
								>
									Conferir solicitação
								</Text>

								<View style={styles.summary}>
									<Text style={styles.serviceName}>{selectedService.name}</Text>

									<Text style={styles.summaryPrice}>
										{formatCurrency(selectedService.priceCents)}
									</Text>
								</View>

								<Text style={styles.description}>
									O valor será descontado da sua carteira fictícia após a
									confirmação da solicitação.
								</Text>

								{purchaseError !== null && (
									<Text
										accessibilityRole="alert"
										style={styles.feedbackText}
									>
										{purchaseError}
									</Text>
								)}

								{isSubmitting && (
									<ActivityIndicator
										color={Colors.PRIMARY_DARK}
										accessibilityLabel="Enviando solicitação"
									/>
								)}

								<View style={styles.modalActions}>
									<ActionButton
										label={
											isSubmitting
												? 'Enviando…'
												: purchaseError !== null
													? 'Tentar novamente'
													: 'Confirmar solicitação'
										}
										disabled={isSubmitting}
										onPress={() => void confirmPurchase()}
									/>

									<ActionButton
										label="Voltar"
										variant={ButtonVariantEnum.SECONDARY}
										disabled={isSubmitting || purchaseError !== null}
										onPress={closeConfirmation}
									/>
								</View>
							</View>
						)}
					</ScrollView>
				</SafeAreaView>
			</Modal>
		</>
	);
}

export { WalletScreen };
