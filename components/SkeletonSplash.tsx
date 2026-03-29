import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ style }: { style?: any }) => {
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startShimmer = () => {
            shimmerValue.setValue(0);
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }).start(() => startShimmer());
        };
        startShimmer();
    }, [shimmerValue]);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[styles.skeletonBase, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(14, 165, 233, 0.05)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export default function SkeletonSplash() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.glow, 'transparent']}
                style={styles.headerGlow}
            />

            <View style={styles.content}>
                {/* Profile/Header area */}
                <View style={styles.headerSkeleton}>
                    <SkeletonItem style={styles.avatar} />
                    <View style={styles.headerTexts}>
                        <SkeletonItem style={styles.titleLine} />
                        <SkeletonItem style={styles.subtitleLine} />
                    </View>
                </View>

                {/* Cards */}
                <SkeletonItem style={styles.card} />
                <SkeletonItem style={styles.card} />
                <SkeletonItem style={styles.card} />

                {/* Bottom area */}
                <View style={styles.bottomSkeleton}>
                    <SkeletonItem style={styles.bottomLine} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 80,
    },
    skeletonBase: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
    },
    headerSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    headerTexts: {
        marginLeft: 16,
        flex: 1,
    },
    titleLine: {
        height: 20,
        width: '60%',
        marginBottom: 8,
    },
    subtitleLine: {
        height: 14,
        width: '40%',
    },
    card: {
        height: 140,
        borderRadius: 24, // As per specs
        marginBottom: 20,
    },
    bottomSkeleton: {
        marginTop: 'auto',
        marginBottom: 20,
        alignItems: 'center',
    },
    bottomLine: {
        height: 12,
        width: '30%',
    },
});
