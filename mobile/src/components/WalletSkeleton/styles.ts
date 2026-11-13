import { StyleSheet } from 'react-native';

import { Colors } from '../../theme/colors';

const styles = StyleSheet.create({
	container: {
		gap: 28,
	},
	balance: {
		height: 220,
		borderRadius: 24,
		backgroundColor: Colors.BORDER,
	},
	icon: {
		width: 76,
		height: 76,
		borderRadius: 26,
		backgroundColor: Colors.BORDER,
	},
	heading: {
		width: '60%',
		height: 26,
		borderRadius: 8,
		backgroundColor: Colors.BORDER,
	},
	cards: {
		flexDirection: 'row',
		gap: 20,
	},
	stacked: {
		flexDirection: 'column',
	},
	card: {
		flex: 1,
		minHeight: 260,
		padding: 24,
		borderRadius: 20,
		backgroundColor: Colors.SURFACE,
		borderWidth: 1,
		borderColor: Colors.BORDER,
		gap: 20,
	},
	line: {
		height: 20,
		width: '65%',
		borderRadius: 8,
		backgroundColor: Colors.BORDER,
	},
	price: {
		height: 38,
		width: '55%',
		borderRadius: 8,
		backgroundColor: Colors.BORDER,
	},
	button: {
		height: 48,
		marginTop: 'auto',
		borderRadius: 12,
		backgroundColor: Colors.BORDER,
	},
});

export { styles };
