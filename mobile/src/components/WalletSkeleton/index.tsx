import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, View } from 'react-native';

import { styles } from './styles';
import type { WalletSkeletonProps } from './types';

const AnimationConstants = {
	DURATION_MS: 700,
	MIN_OPACITY: 0.45,
} as const;

function WalletSkeleton({ compact }: WalletSkeletonProps) {
	const opacity = useRef(new Animated.Value(1)).current;
	const [reduceMotion, setReduceMotion] = useState(true);

	useEffect(() => {
		let active = true;

		void AccessibilityInfo.isReduceMotionEnabled()
			.then((enabled) => {
				if (active) {
					setReduceMotion(enabled);
				}
			})
			.catch((error: unknown) => {
				console.warn('Could not read the reduced-motion preference.', error);
			});

		const subscription = AccessibilityInfo.addEventListener(
			'reduceMotionChanged',
			setReduceMotion,
		);

		return () => {
			active = false;
			subscription.remove();
		};
	}, []);

	useEffect(() => {
		opacity.setValue(1);

		if (reduceMotion) {
			return;
		}

		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: AnimationConstants.MIN_OPACITY,
					duration: AnimationConstants.DURATION_MS,
					useNativeDriver: Platform.OS !== 'web',
					isInteraction: false,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: AnimationConstants.DURATION_MS,
					useNativeDriver: Platform.OS !== 'web',
					isInteraction: false,
				}),
			]),
		);

		animation.start();

		return () => {
			animation.stop();
		};
	}, [opacity, reduceMotion]);

	return (
		<Animated.View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel="Carregando serviços e saldo"
			accessibilityState={{ busy: true }}
			style={[styles.container, { opacity }]}
		>
			<View style={styles.balance} />
			<View style={styles.heading} />

			<View style={[styles.cards, compact && styles.stacked]}>
				{[0, 1].map((index) => (
					<View
						key={index}
						style={styles.card}
					>
						<View style={styles.icon} />
						<View style={styles.line} />
						<View style={styles.price} />
						<View style={styles.line} />
						<View style={styles.button} />
					</View>
				))}
			</View>
		</Animated.View>
	);
}

export { WalletSkeleton };
