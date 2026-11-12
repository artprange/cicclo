import { Pressable, Text } from 'react-native';

import { styles } from './styles';
import { ButtonVariantEnum } from './types';
import type { ActionButtonProps } from './types';

function ActionButton({
	label,
	onPress,
	disabled = false,
	variant = ButtonVariantEnum.PRIMARY,
}: ActionButtonProps) {
	const isSecondary = variant === ButtonVariantEnum.SECONDARY;

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				isSecondary && styles.secondary,
				pressed && !disabled && styles.pressed,
				disabled && styles.disabled,
			]}
		>
			<Text
				style={[
					styles.label,
					isSecondary && styles.secondaryLabel,
					disabled && styles.disabledLabel,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

export { ActionButton };
