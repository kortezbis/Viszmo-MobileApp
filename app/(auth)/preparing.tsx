import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/context/SubscriptionContext';

const logoImg = require('@/assets/images/full-logo.png.png');

const PREPARING_STEPS = [
    'Building your unique profile...',
    'Curating your content...',
    'Optimizing study patterns...',
    'Calibrating AI engine...',
    'Almost ready...'
];

const FAKE_STATS = [
    { label: 'AI Flashcards Generated Today', start: 140020, end: 145893 },
    { label: 'Hours Saved by viszmo Users', start: 890000, end: 894321 },
    { label: 'Transcripts Processed this Week', start: 20400, end: 24091 },
];

const AnimatedStat = ({ stat }: { stat: typeof FAKE_STATS[0] }) => {
    const [val, setVal] = React.useState(stat.start);

    React.useEffect(() => {
        let current = stat.start;
        const interval = setInterval(() => {
            current += Math.floor(Math.random() * (stat.end - stat.start) / 20);
            if (current > stat.end) current = stat.end;
            setVal(current);
            if (current >= stat.end) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, [stat]);

    return (
        <View style={styles.statContainer}>
            <Text style={styles.statNumber}>{val.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
    );
};

export default function PreparingScreen() {
    const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
    const [currentStatIndex, setCurrentStatIndex] = React.useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { showPaywall } = useSubscription();

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Progress bar simulation - 10 SECONDS
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: false,
        }).start(() => {
            showPaywall();
            // Also redirect to tabs in background so when paywall closes, they are there
            router.replace('/(tabs)');
        });

        // Step text rotation 
        const stepInterval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev < PREPARING_STEPS.length - 1 ? prev + 1 : prev));
        }, 2000);

        // Stat rotation
        const statInterval = setInterval(() => {
            setCurrentStatIndex((prev) => (prev + 1) % FAKE_STATS.length);
        }, 3333);

        return () => {
            clearInterval(stepInterval);
            clearInterval(statInterval);
        };
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#DBEAFE', '#FFFFFF']} // Soft blue tint
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />

                    <View style={styles.centerBox}>
                        <AnimatedStat key={currentStatIndex} stat={FAKE_STATS[currentStatIndex]} />

                        <Text style={styles.title}>Preparing your experience...</Text>
                        <Text style={styles.subtitle}>{PREPARING_STEPS[currentStepIndex]}</Text>

                        <View style={styles.progressContainer}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        })
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 120,
        height: 48,
        position: 'absolute',
        top: 20,
        tintColor: '#000000',
    },
    centerBox: {
        width: '100%',
        alignItems: 'center',
    },
    spinnerContainer: {
        marginBottom: 32,
    },
    loadingPulse: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 2,
        borderColor: '#0EA5E9',
        borderStyle: 'dashed',
    },
    title: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: '#64748B',
        marginBottom: 40,
        height: 20,
        textAlign: 'center',
    },
    statContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 50,
        height: 100,
    },
    statNumber: {
        fontSize: 48,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#0EA5E9', // Branding blue
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressContainer: {
        width: '80%',
        height: 6,
        backgroundColor: 'rgba(30, 41, 59, 0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0EA5E9',
    }
});
