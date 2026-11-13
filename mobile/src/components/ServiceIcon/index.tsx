import { Shirt, Sparkles, WashingMachine, Wind } from 'lucide-react-native';
import { View } from 'react-native';

import { Colors } from '../../theme/colors';
import { styles } from './styles';
import type { ServiceIconProps } from './types';

function ServiceIcon({ serviceId }: ServiceIconProps) {
	const Icon =
		serviceId === 'wash' ? WashingMachine : serviceId === 'dry' ? Wind : Shirt;

	return (
		<View
			accessible={false}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={styles.container}
		>
			<Icon
				size={40}
				strokeWidth={1.8}
				color={Colors.PRIMARY_DARK}
			/>

			<View style={styles.sparkle}>
				<Sparkles
					size={18}
					strokeWidth={1.8}
					color={Colors.PRIMARY}
				/>
			</View>
		</View>
	);
}

export { ServiceIcon };
