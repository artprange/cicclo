enum ButtonVariantEnum {
	PRIMARY = 'primary',
	SECONDARY = 'secondary',
}

type ActionButtonProps = {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	variant?: ButtonVariantEnum;
	loading?: boolean;
};

export { ButtonVariantEnum };
export type { ActionButtonProps };
