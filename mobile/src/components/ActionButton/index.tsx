import { ActivityIndicator, Pressable, Text } from 'react-native';

import { Colors } from '../../theme/colors';
import { styles } from './styles';
import { ButtonVariantEnum } from './types';
import type { ActionButtonProps } from './types';

function ActionButton({
	label,
	onPress,
	disabled = false,
	loading = false,
	variant = ButtonVariantEnum.PRIMARY,
}: ActionButtonProps) {
	const isSecondary = variant === ButtonVariantEnum.SECONDARY;
	const isDisabled = disabled || loading;

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: isDisabled, busy: loading }}
			disabled={isDisabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				isSecondary && styles.secondary,
				variant === ButtonVariantEnum.BRAND && styles.brand,
				pressed && !isDisabled && styles.pressed,
				isDisabled && styles.disabled,
			]}
		>
			{loading && (
				<ActivityIndicator
					size="small"
					color={Colors.DISABLED_TEXT}
				/>
			)}

			<Text
				style={[
					styles.label,
					isSecondary && styles.secondaryLabel,
					isDisabled && styles.disabledLabel,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

export { ActionButton };
