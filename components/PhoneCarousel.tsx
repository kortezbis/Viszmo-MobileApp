import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface PhoneCarouselProps {
    activeIndex: number;
}

export default function PhoneCarousel({ activeIndex }: PhoneCarouselProps) {
    const floatAnim = useSharedValue(0);
    const tiltAnim = useSharedValue(0);
    const contentOpacity = useSharedValue(1);

    useEffect(() => {
        // Floating animation
        floatAnim.value = withRepeat(
            withSequence(
                withTiming(-15, { duration: 2500 }),
                withTiming(15, { duration: 2500 })
            ),
            -1,
            true
        );

        // Subtle tilt
        tiltAnim.value = withRepeat(
            withSequence(
                withTiming(-2, { duration: 3000 }),
                withTiming(2, { duration: 3000 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        // Fade content out and in when index changes
        contentOpacity.value = withSequence(
            withTiming(0, { duration: 200 }),
            withTiming(1, { duration: 400 })
        );
    }, [activeIndex]);

    const animatedPhoneStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: floatAnim.value },
                { rotateZ: `${tiltAnim.value}deg` }
            ],
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
        };
    });

    const renderContent = () => {
        switch (activeIndex) {
            case 0: // Recording
                return (
                    <View style={styles.internalContent}>
                        <View style={styles.micCircle}>
                            <Ionicons name="mic" size={40} color="white" />
                        </View>
                        <View style={styles.waveformContainer}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <View key={i} style={[styles.waveBar, { height: 20 + Math.random() * 40 }]} />
                            ))}
                        </View>
                        <Text style={styles.internalTitle}>Transcribing...</Text>
                        <View style={styles.textSkeleton} />
                        <View style={[styles.textSkeleton, { width: '60%' }]} />
                    </View>
                );
            case 1: // Flashcards
                return (
                    <View style={styles.internalContent}>
                        <View style={styles.cardStack}>
                            <View style={[styles.miniCard, { transform: [{ rotate: '-10deg' }, { translateX: -20 }] }]} />
                            <View style={[styles.miniCard, { transform: [{ rotate: '5deg' }, { translateX: 10 }] }]} />
                            <View style={styles.mainMiniCard}>
                                <MaterialCommunityIcons name="flash" size={30} color="#8B5CF6" />
                                <Text style={styles.miniCardText}>Who discovered Penicillin?</Text>
                            </View>
                        </View>
                        <Text style={styles.internalTitle}>Study Session</Text>
                    </View>
                );
            case 2: // Spaced Repetition / Mastery
                return (
                    <View style={styles.internalContent}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statCircle}>
                                <Text style={styles.statLabel}>98%</Text>
                            </View>
                        </View>
                        <Text style={styles.internalTitle}>Mastery Level</Text>
                        <View style={styles.progressTrack}>
                            <View style={styles.progressFill} />
                        </View>
                        <Text style={styles.internalSubtitle}>Keep going!</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Glow */}
            <View style={[styles.glow, { backgroundColor: activeIndex === 0 ? '#0EA5E9' : activeIndex === 1 ? '#8B5CF6' : '#10B981' }]} />

            <Animated.View style={[styles.phoneFrame, animatedPhoneStyle]}>
                {/* Outer Bezel */}
                <View style={styles.bezel}>
                    {/* Screen */}
                    <View style={styles.screen}>
                        <LinearGradient
                            colors={['#1E293B', '#0F172A']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Dynamic Island */}
                        <View style={styles.dynamicIsland} />

                        <Animated.View style={[styles.screenContent, animatedContentStyle]}>
                            {renderContent()}
                        </Animated.View>
                    </View>
                </View>

                {/* Reflection/Shine */}
                <View style={styles.shine} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height * 0.45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        opacity: 0.15,
        filter: Platform.OS === 'ios' ? 'blur(60px)' : undefined,
    },
    phoneFrame: {
        width: 180,
        height: 360,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bezel: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 35,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 15,
    },
    screen: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 28,
        overflow: 'hidden',
        alignItems: 'center',
    },
    dynamicIsland: {
        width: 60,
        height: 18,
        backgroundColor: '#000',
        borderRadius: 9,
        marginTop: 10,
        zIndex: 10,
    },
    screenContent: {
        flex: 1,
        width: '100%',
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        pointerEvents: 'none',
    },
    internalContent: {
        alignItems: 'center',
        width: '100%',
    },
    internalTitle: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        marginTop: 20,
    },
    internalSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Medium',
        marginTop: 5,
    },
    micCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowRadius: 15,
        shadowOpacity: 0.5,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 20,
    },
    waveBar: {
        width: 4,
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderRadius: 2,
    },
    textSkeleton: {
        width: '80%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginTop: 12,
    },
    cardStack: {
        width: 120,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniCard: {
        position: 'absolute',
        width: 100,
        height: 130,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mainMiniCard: {
        width: 110,
        height: 140,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    miniCardText: {
        color: '#1E293B',
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
        marginTop: 10,
    },
    statsContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statCircle: {
        alignItems: 'center',
    },
    statLabel: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    progressTrack: {
        width: '80%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressFill: {
        width: '75%',
        height: '100%',
        backgroundColor: '#10B981',
    },
});
