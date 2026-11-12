enum ButtonVariantEnum {
	PRIMARY = 'primary',
	SECONDARY = 'secondary',
}

interface ActionButtonProps {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	variant?: ButtonVariantEnum;
}

export { ButtonVariantEnum };
export type { ActionButtonProps };
