import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from './src/theme/colors';

function App() {
	return (
		<View style={styles.container}>
			<StatusBar style="dark" />

			<Text
				accessibilityRole="header"
				style={styles.title}
			>
				Cicclo
			</Text>

			<Text style={styles.description}>Estrutura inicial da demonstração.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		backgroundColor: Colors.BACKGROUND,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: Colors.PRIMARY,
	},
	description: {
		marginTop: 12,
		fontSize: 16,
		textAlign: 'center',
		color: Colors.TEXT_SECONDARY,
	},
});

export default App;
