import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const iconImg = require('@/assets/images/splash-icon.png');

export default function SplashScreen() {
    // Icon Animation Values
    const iconScale = useSharedValue(0.6);
    const iconOpacity = useSharedValue(0);
    const iconTranslateY = useSharedValue(40);

    // Container & background
    const containerOpacity = useSharedValue(1);
    const bgTranslate = useSharedValue(-20);

    const finishSplash = () => {
        router.replace('/onboarding');
    };

    useEffect(() => {
        // 1. Animate icon in
        iconOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
        iconTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.back(1.5)) });
        iconScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) });

        // 2. Ambient background pan - pure Reanimated, no old Animated API
        bgTranslate.value = withRepeat(
            withSequence(
                withTiming(20, { duration: 25000 }),
                withTiming(-20, { duration: 25000 })
            ),
            -1, // infinite
            false
        );

        // 3. Exit after 2.6 seconds
        const exitTimer = setTimeout(() => {
            iconTranslateY.value = withTiming(30, { duration: 600, easing: Easing.in(Easing.ease) });
            iconScale.value = withTiming(0.9, { duration: 600, easing: Easing.in(Easing.ease) });
            iconOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
            containerOpacity.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }, () => {
                runOnJS(finishSplash)();
            });
        }, 2600);

        return () => {
            clearTimeout(exitTimer);
        };
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const bgStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: 1.2 },
            { translateX: bgTranslate.value },
            { translateY: bgTranslate.value },
        ],
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
        transform: [
            { scale: iconScale.value },
            { translateY: iconTranslateY.value },
        ],
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Animated background — pure Reanimated, no old API */}
            <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
                <LinearGradient
                    colors={['#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9', '#0369A1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            <View style={styles.content}>
                <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
                    <Image
                        source={iconImg}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        width: width * 0.85,
        height: width * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});
