import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView, Animated, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';

// NOTE: expo-auth-session/providers/google requires the ExpoApplication native module,
// which is only available in a custom dev build (not Expo Go).
// Re-enable these imports after creating a dev build with `eas build --profile development`.
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
// import { makeRedirectUri } from 'expo-auth-session';
// WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const SLIDE_DURATION = 5000;

// Vibrant App Colors
const COLORS = {
    BLUE: '#0EA5E9',   // Primary Blue
    PURPLE: '#8b5cf6', // Indigo/Purple
    GREEN: '#10b981',  // Emerald/Green
    // Very light versions for the background
    BLUE_BG: '#F0F9FF',
    PURPLE_BG: '#F5F3FF',
    GREEN_BG: '#F0FDF4',
};

const SLIDES = [
    {
        id: '1',
        title: 'Record and capture\nevery lecture',
        description: 'AI-Powered Transcription',
        icon: 'mic-outline',
        theme: COLORS.BLUE,
        bgTheme: COLORS.BLUE_BG,
    },
    {
        id: '2',
        title: 'The ultimate way\nto study',
        description: 'AI Generated Flashcards',
        icon: 'flash-outline',
        theme: COLORS.PURPLE,
        bgTheme: COLORS.PURPLE_BG,
    },
    {
        id: '3',
        title: 'Master any subject\nfaster than ever',
        description: 'Spaced Repetition Mastery',
        icon: 'bulb-outline',
        theme: COLORS.GREEN,
        bgTheme: COLORS.GREEN_BG,
    }
];

const logoImg = require('@/assets/images/full-logo.png.png');
const googleG = require('@/assets/images/branding/google-g.png');

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const AnimatedButton = ({ onPress, style, children, activeOpacity }: any) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={activeOpacity || 0.9}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onPress}
            style={{ width: '100%' }}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function OnboardingScreen() {
    const [activeIndex, setActiveIndex] = useState(0);
    const progressAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;
    const entranceAnim = useRef(new Animated.Value(0)).current;
    const bgAnim = useRef(new Animated.Value(0)).current;

    // Entrance and Background Animation
    useEffect(() => {
        Animated.spring(entranceAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bgAnim, {
                    toValue: 1,
                    duration: 20000,
                    useNativeDriver: true,
                }),
                Animated.timing(bgAnim, {
                    toValue: 0,
                    duration: 20000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    // Slide auto-advance logic
    useEffect(() => {
        startProgress(activeIndex);
        const autoPlay = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % SLIDES.length);
        }, SLIDE_DURATION);

        return () => {
            clearInterval(autoPlay);
            progressAnims[activeIndex].stopAnimation();
        };
    }, [activeIndex]);

    const startProgress = (index: number) => {
        progressAnims.forEach((anim, i) => {
            if (i < index) anim.setValue(1);
            else if (i > index) anim.setValue(0);
        });

        Animated.timing(progressAnims[index], {
            toValue: 1,
            duration: SLIDE_DURATION,
            useNativeDriver: false,
        }).start();
    };

    const handleGoogleSignIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(auth)/email-entry');
    };

    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(auth)/email-entry');
        } catch (e: any) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            {/* Seamless richer 6-color breathing gradient */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    transform: [
                        { scale: 1.2 },
                        {
                            translateX: bgAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 20]
                            })
                        },
                        {
                            translateY: bgAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 20]
                            })
                        }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#F1F5F9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            <SafeAreaView style={styles.safeArea}>
                <Animated.View style={[styles.header, {
                    opacity: entranceAnim,
                    transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                }]}>
                    <View style={styles.headerTopRow}>
                        <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
                        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.indicators}>
                        {SLIDES.map((_, index) => (
                            <View key={index} style={styles.indicatorContainer}>
                                <Animated.View
                                    style={[
                                        styles.indicatorFill,
                                        {
                                            backgroundColor: '#FFFFFF', // Clean white progress fill
                                            width: progressAnims[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                            })
                                        }
                                    ]}
                                />
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Previously contained the Phone Carousel - kept for spacing */}
                <View style={styles.carouselContainer} />

                <Animated.View style={[styles.textSection, {
                    opacity: entranceAnim,
                    transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                }]}>
                    <View style={styles.socialProof}>
                        <Ionicons name="ribbon-outline" size={16} color="rgba(15, 23, 42, 0.7)" />
                        <Text style={[styles.socialProofText, { color: "rgba(15, 23, 42, 0.7)" }]}>{SLIDES[activeIndex].description}</Text>
                        <Ionicons name="ribbon-outline" size={16} color="rgba(15, 23, 42, 0.7)" />
                    </View>
                    <Text style={styles.headline}>{SLIDES[activeIndex].title}</Text>
                </Animated.View>

                <Animated.View style={[styles.footer, {
                    opacity: entranceAnim,
                    transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
                }]}>
                    <AnimatedButton
                        style={styles.googleButton}
                        activeOpacity={0.8}
                        onPress={handleGoogleSignIn}
                    >
                        <Image source={googleG} style={styles.googleIcon} resizeMode="contain" />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </AnimatedButton>

                    <AnimatedButton
                        style={styles.appleButton}
                        activeOpacity={0.8}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleAppleSignIn();
                        }}
                    >
                        <Ionicons name="logo-apple" size={22} color="white" style={styles.buttonIcon} />
                        <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </AnimatedButton>

                    <AnimatedButton
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(auth)/email-entry');
                        }}
                        style={styles.emailButton}
                    >
                        <Text style={styles.emailText}>Continue with email</Text>
                    </AnimatedButton>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginTop: 10,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoImage: {
        width: 100,
        height: 32,
        tintColor: '#1A1C1E',
    },
    skipButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
    },
    skipText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: '#0EA5E9',
    },
    indicators: {
        flexDirection: 'row',
        gap: 8,
    },
    indicatorContainer: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
        overflow: 'hidden',
    },
    indicatorFill: {
        height: '100%',
        backgroundColor: '#0F172A',
        borderRadius: 2,
    },
    carouselContainer: {
        flex: 1,
        marginTop: 20,
    },
    textSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    socialProof: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 8,
    },
    socialProofText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-SemiBold',
        letterSpacing: 0.5,
    },
    headline: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1A1C1E',
        textAlign: 'center',
        lineHeight: 40,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 12,
    },
    googleButton: {
        height: 56,
        backgroundColor: 'white',
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    googleButtonText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1E293B',
    },
    appleButton: {
        height: 56,
        backgroundColor: 'black',
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    appleButtonText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    buttonIcon: {
        marginRight: 10,
    },
    googleIcon: {
        width: 18,
        height: 18,
        marginRight: 12,
    },
    emailButton: {
        alignItems: 'center',
        marginTop: 4,
    },
    emailText: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#0F172A',
        textDecorationLine: 'underline',
    },
});
