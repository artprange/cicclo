import { StyleSheet } from 'react-native';

import { Colors } from '../../theme/colors';

const styles = StyleSheet.create({
	container: {
		width: 76,
		height: 76,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 26,
		backgroundColor: Colors.PRIMARY_LIGHT,
	},
	sparkle: {
		position: 'absolute',
		top: -5,
		right: -5,
		width: 28,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 14,
		backgroundColor: Colors.SURFACE,
	},
});

export { styles };
