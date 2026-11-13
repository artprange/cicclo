import { StyleSheet } from 'react-native';

import { Colors } from '../../theme/colors';

const styles = StyleSheet.create({
	button: {
		minHeight: 48,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 14,
		backgroundColor: Colors.PRIMARY_DARK,
		flexDirection: 'row',
		gap: 10,
	},
	secondary: {
		backgroundColor: Colors.BACKGROUND,
		borderWidth: 1,
		borderColor: Colors.BORDER,
	},
	pressed: {
		opacity: 0.8,
	},
	disabled: {
		backgroundColor: Colors.DISABLED_BACKGROUND,
	},
	label: {
		color: Colors.SURFACE,
		fontSize: 16,
		fontWeight: '700',
		textAlign: 'center',
		flexShrink: 1,
	},
	secondaryLabel: {
		color: Colors.TEXT,
	},
	disabledLabel: {
		color: Colors.DISABLED_TEXT,
	},
	brand: {
		backgroundColor: Colors.BRAND_PURPLE,
	},
});

export { styles };
