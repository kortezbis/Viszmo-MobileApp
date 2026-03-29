import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';

const { width } = Dimensions.get('window');

const SkeletonCard = ({ style, index }: { style?: any; index: number }) => {
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startShimmer = () => {
            shimmerValue.setValue(0);
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 1500,
                delay: index * 200, // Staggered delay for each card
                useNativeDriver: true,
            }).start(() => startShimmer());
        };
        startShimmer();
    }, [shimmerValue, index]);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[styles.cardBase, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(14, 165, 233, 0.15)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export default function DeckSkeleton() {
    return (
        <View style={styles.container}>
            <View style={styles.stack}>
                {/* We'll show 3 cards in a stack */}
                <SkeletonCard index={2} style={[styles.card, styles.cardBack2]} />
                <SkeletonCard index={1} style={[styles.card, styles.cardBack1]} />
                <SkeletonCard index={0} style={[styles.card, styles.cardFront]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    stack: {
        position: 'relative',
        width: width - 80,
        height: 200,
        alignItems: 'center',
    },
    cardBase: {
        backgroundColor: '#0F172A',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(14, 165, 233, 0.2)',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardFront: {
        zIndex: 3,
        transform: [{ translateY: 0 }, { scale: 1 }],
    },
    cardBack1: {
        zIndex: 2,
        transform: [{ translateY: 20 }, { scale: 0.94 }],
        opacity: 0.6,
    },
    cardBack2: {
        zIndex: 1,
        transform: [{ translateY: 40 }, { scale: 0.88 }],
        opacity: 0.3,
    },
});
