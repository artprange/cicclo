import { StyleSheet } from 'react-native';

import { Colors } from '../../theme/colors';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND,
	},
	page: {
		flexGrow: 1,
		alignItems: 'center',
		padding: 40,
	},
	compactPage: {
		padding: 20,
	},
	content: {
		width: '100%',
		maxWidth: 960,
		gap: 28,
		paddingBottom: 96,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
		gap: 12,
	},
	brand: {
		fontSize: 40,
		fontWeight: '800',
		letterSpacing: -2,
		color: Colors.PRIMARY,
	},
	badge: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: Colors.PRIMARY_LIGHT,
	},
	badgeText: {
		fontSize: 13,
		fontWeight: '700',
		color: Colors.PRIMARY_DARKER,
	},
	introduction: {
		gap: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: Colors.TEXT_SECONDARY,
	},
	balanceCard: {
		padding: 28,
		borderRadius: 24,
		gap: 10,
		backgroundColor: Colors.PRIMARY_DARK,
	},
	balanceLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.SURFACE,
	},
	balanceValue: {
		fontSize: 44,
		fontWeight: '800',
		color: Colors.SURFACE,
	},
	balanceCaption: {
		fontSize: 14,
		lineHeight: 21,
		color: Colors.SURFACE,
	},
	sectionHeading: {
		gap: 6,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	services: {
		flexDirection: 'row',
		gap: 20,
	},
	servicesStacked: {
		flexDirection: 'column',
	},
	serviceCard: {
		flex: 1,
		minWidth: 0,
		padding: 24,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: Colors.BORDER,
		backgroundColor: Colors.SURFACE,
		gap: 12,
	},
	serviceEyebrow: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
		color: Colors.PRIMARY_DARK,
	},
	serviceName: {
		fontSize: 22,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	servicePrice: {
		marginTop: 8,
		fontSize: 32,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	serviceCaption: {
		marginBottom: 8,
		fontSize: 14,
		color: Colors.TEXT_SECONDARY,
	},
	feedback: {
		padding: 18,
		borderRadius: 14,
		backgroundColor: Colors.PRIMARY_LIGHT,
	},
	feedbackText: {
		fontSize: 15,
		lineHeight: 23,
		color: Colors.PRIMARY_DARKER,
	},

	previewTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	overlay: {
		flex: 1,
		backgroundColor: Colors.OVERLAY,
	},
	modalContainer: {
		flexGrow: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	modalCard: {
		width: '100%',
		maxWidth: 440,
		padding: 24,
		borderRadius: 24,
		backgroundColor: Colors.SURFACE,
		gap: 20,
	},
	modalTitle: {
		fontSize: 26,
		fontWeight: '700',
		color: Colors.TEXT,
	},
	summary: {
		padding: 20,
		borderRadius: 14,
		backgroundColor: Colors.BACKGROUND,
		gap: 8,
	},
	summaryPrice: {
		fontSize: 28,
		fontWeight: '700',
		color: Colors.PRIMARY_DARK,
	},
	modalActions: {
		gap: 12,
	},
	toast: {
		position: 'absolute',
		alignSelf: 'center',
		width: '90%',
		maxWidth: 600,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		borderRadius: 16,
		backgroundColor: Colors.TEXT,
	},
	toastText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 21,
		color: Colors.SURFACE,
	},
	toastClose: {
		minHeight: 44,
		justifyContent: 'center',
		paddingHorizontal: 8,
	},
	toastCloseText: {
		fontSize: 14,
		fontWeight: '700',
		color: Colors.SURFACE,
	},
});

export { styles };
