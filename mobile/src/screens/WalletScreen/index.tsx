import { useState } from 'react';
import {
	Modal,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../components/ActionButton';
import { ButtonVariantEnum } from '../../components/ActionButton/types';
import { PreviewData } from '../../demo/previewData';
import type { LaundryService } from '../../demo/previewData';
import { formatCurrency } from '../../utils/formatCurrency';
import { styles } from './styles';

const ScreenConstants = {
	COMPACT_WIDTH: 640,
} as const;

function WalletScreen() {
	const { width } = useWindowDimensions();
	const isCompact = width < ScreenConstants.COMPACT_WIDTH;

	const [selectedService, setSelectedService] = useState<LaundryService | null>(
		null,
	);

	const [feedback, setFeedback] = useState<string | null>(null);

	function handleSelectService(service: LaundryService) {
		setFeedback(null);
		setSelectedService(service);
	}

	function handleCloseConfirmation() {
		setSelectedService(null);
	}

	function handleConfirmPreview() {
		if (selectedService === null) {
			return;
		}

		setFeedback(
			`Prévia de ${selectedService.name.toLowerCase()} concluída. ` +
				'Nenhuma solicitação foi enviada e o saldo não foi alterado.',
		);

		setSelectedService(null);
	}

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
									`Saldo ilustrativo: ` +
									formatCurrency(PreviewData.BALANCE_CENTS)
								}
								style={styles.balanceValue}
							>
								{formatCurrency(PreviewData.BALANCE_CENTS)}
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
							{PreviewData.SERVICES.map((service) => (
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
										onPress={() => handleSelectService(service)}
									/>
								</View>
							))}
						</View>

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

						<View style={styles.previewNotice}>
							<Text style={styles.previewTitle}>Prévia da interface</Text>

							<Text style={styles.description}>
								Os valores são ilustrativos. Nesta etapa, as solicitações não
								são enviadas e o saldo permanece inalterado.
							</Text>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<Modal
				visible={selectedService !== null}
				transparent
				animationType="fade"
				onRequestClose={handleCloseConfirmation}
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
									Esta é uma prévia. Confirmar não descontará saldo nem iniciará
									uma máquina.
								</Text>

								<View style={styles.modalActions}>
									<ActionButton
										label="Confirmar prévia"
										onPress={handleConfirmPreview}
									/>

									<ActionButton
										label="Voltar"
										variant={ButtonVariantEnum.SECONDARY}
										onPress={handleCloseConfirmation}
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
