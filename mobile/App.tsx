import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WalletScreen } from './src/screens/WalletScreen';

function App() {
	return (
		<SafeAreaProvider>
			<StatusBar style="dark" />
			<WalletScreen />
		</SafeAreaProvider>
	);
}

export default App;
