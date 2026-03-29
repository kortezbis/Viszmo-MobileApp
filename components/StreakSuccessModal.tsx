import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
    interpolate,
    Extrapolate,
    withRepeat
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useStreak } from '@/context/StreakContext';

const { width, height } = Dimensions.get('window');
const fireImg = require('@/assets/images/branding/Fire.png.png');

interface StreakSuccessModalProps {
    isVisible: boolean;
    onClose: () => void;
    streakCount: number;
}

const WeekCalendar = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const { getStreakStatus } = useStreak();
    const today = new Date();
    const currentDayIndex = today.getDay();

    return (
        <BlurView intensity={30} tint="dark" style={styles.calendarCard}>
            <View style={styles.daysLabelsRow}>
                {days.map((day, ix) => (
                    <Text key={ix} style={[styles.dayLabel, ix === currentDayIndex && styles.dayLabelActive]}>{day}</Text>
                ))}
            </View>
            <View style={styles.daysIconsRow}>
                {days.map((_, ix) => {
                    const d = new Date();
                    d.setDate(today.getDate() - currentDayIndex + ix);
                    const status = getStreakStatus(d.getDate(), d.getMonth(), d.getFullYear());
                    const isToday = ix === currentDayIndex;

                    if (status === 1) { // Completed
                        return (
                            <View key={ix} style={isToday ? styles.dayIconCircleActive : styles.dayIconCircleCompleted}>
                                <Ionicons name="checkmark-sharp" size={isToday ? 18 : 16} color="white" />
                            </View>
                        );
                    }
                    if (status === 2) { // Frozen
                        return (
                            <View key={ix} style={isToday ? [styles.dayIconCircleActive, { backgroundColor: '#3B82F6', shadowColor: '#3B82F6' }] : [styles.dayIconCircleCompleted, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="snow-outline" size={isToday ? 18 : 16} color="white" />
                            </View>
                        );
                    }
                    if (isToday) { // Active today, not completed
                        return (
                            <View key={ix} style={styles.dayIconCircleActive}>
                                <Ionicons name="checkmark-sharp" size={18} color="white" />
                            </View>
                        );
                    }
                    // Future or skipped
                    return (
                        <View key={ix} style={styles.dayIconCircleFuture} />
                    );
                })}
            </View>
        </BlurView>
    );
};

export default function StreakSuccessModal({ isVisible, onClose, streakCount }: StreakSuccessModalProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const flameRotate = useSharedValue(0);
    const containerOpacity = useSharedValue(0);
    const contentY = useSharedValue(50);

    useEffect(() => {
        if (isVisible) {
            // Success Haptic
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Animation sequence
            containerOpacity.value = withTiming(1, { duration: 300 });
            opacity.value = withTiming(1, { duration: 400 });
            scale.value = withSequence(
                withSpring(1.2, { damping: 10, stiffness: 100 }),
                withSpring(1, { damping: 15, stiffness: 100 })
            );

            contentY.value = withDelay(200, withSpring(0, { damping: 12 }));

            // Constant flame sway
            flameRotate.value = withRepeat(
                withSequence(
                    withTiming(-4, { duration: 1500 }),
                    withTiming(4, { duration: 1500 })
                ),
                -1,
                true
            );
        } else {
            scale.value = withTiming(0);
            opacity.value = withTiming(0);
            containerOpacity.value = withTiming(0);
            contentY.value = withTiming(50);
            flameRotate.value = 0;
        }
    }, [isVisible]);

    const animatedFlameStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { rotate: `${flameRotate.value}deg` }
            ],
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: contentY.value }],
        };
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        return {
            opacity: containerOpacity.value,
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        const pulseScale = interpolate(scale.value, [0, 1], [0.5, 1.2], Extrapolate.CLAMP);
        return {
            transform: [{ scale: pulseScale }],
            opacity: interpolate(scale.value, [0.8, 1], [0, 0.4], Extrapolate.CLAMP),
        };
    });

    if (!isVisible && containerOpacity.value === 0) return null;

    return (
        <Modal transparent visible={isVisible} animationType="none">
            <Animated.View style={[styles.overlay, animatedBackgroundStyle]}>
                {/* Fire-style gradient mimicking AppBackground's structure */}
                <LinearGradient
                    colors={['#FF6B00', '#D34400']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Top highlight glow - orange/yellow */}
                <LinearGradient
                    colors={['rgba(255, 230, 0, 0.4)', 'transparent']}
                    style={styles.topGlow}
                />

                <View style={styles.container}>
                    <Animated.View style={[styles.flameContainer, animatedFlameStyle]}>
                        <Image source={fireImg} style={styles.mainFireImage} resizeMode="contain" />
                    </Animated.View>

                    <Animated.View style={[styles.textContainer, animatedContentStyle]}>
                        <Text style={styles.countText}>{streakCount}</Text>
                        <Text style={styles.label}>day streak!</Text>

                        <WeekCalendar />

                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onClose();
                            }}
                        >
                            <Text style={styles.continueBtnText}>CONTINUE</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.5,
    },
    container: {
        width: width,
        alignItems: 'center',
        paddingTop: height * 0.08,
        paddingHorizontal: 24,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        top: 0,
    },
    flameContainer: {
        marginBottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
    },
    mainFireImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    countText: {
        fontSize: 110,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        lineHeight: 120,
    },
    label: {
        fontSize: 26,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 35,
        marginTop: -10,
        opacity: 0.9,
    },
    calendarCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    daysLabelsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dayLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#94A3B8',
        width: 36,
        textAlign: 'center',
    },
    dayLabelActive: {
        color: '#FF6B00',
    },
    daysIconsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    dayIconCircleCompleted: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFB800',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayIconCircleActive: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FF6B00',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.15 }],
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    dayIconCircleFuture: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareBtn: {
        backgroundColor: 'white',
        width: '100%',
        height: 64,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    chestIconContainer: {
        marginTop: -2,
    },
    shareBtnText: {
        color: '#D34400',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        letterSpacing: 1,
    },
    continueBtn: {
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
    },
    continueBtnText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        letterSpacing: 1,
        opacity: 0.9,
    },
});
