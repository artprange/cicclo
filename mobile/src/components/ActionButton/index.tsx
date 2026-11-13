import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
	icon: Icon,
}: ActionButtonProps) {
	const isSecondary = variant === ButtonVariantEnum.SECONDARY;
	const isDisabled = disabled || loading;

	const iconColor = isDisabled
		? Colors.DISABLED_TEXT
		: isSecondary
			? Colors.TEXT
			: Colors.SURFACE;

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
			{loading ? (
				<ActivityIndicator
					size="small"
					color={Colors.DISABLED_TEXT}
				/>
			) : Icon ? (
				<View
					aria-hidden
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					pointerEvents="none"
				>
					<Icon
						size={20}
						strokeWidth={1.8}
						color={iconColor}
					/>
				</View>
			) : null}

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
