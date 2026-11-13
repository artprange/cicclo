import type { LucideIcon } from 'lucide-react-native';

enum ButtonVariantEnum {
	PRIMARY = 'primary',
	SECONDARY = 'secondary',
	BRAND = 'brand',
}

type ActionButtonProps = {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	variant?: ButtonVariantEnum;
	loading?: boolean;
	icon?: LucideIcon;
};

export { ButtonVariantEnum };
export type { ActionButtonProps };
