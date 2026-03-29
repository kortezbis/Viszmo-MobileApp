import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/context/SettingsContext';
import { playSound } from '@/services/SoundManager';

const iconMap: Record<string, any> = {
    'TikTok': require('@/assets/images/branding/tiktok.png.png'),
    'Instagram': require('@/assets/images/branding/instagram.png.png'),
    'YouTube': require('@/assets/images/branding/youtube.png.png'),
    'Google Search': require('@/assets/images/branding/google.png.png'),
    'Reddit': require('@/assets/images/branding/reddit-logo.png.png'),
    'Friend/Referral': require('@/assets/images/branding/friendship.png.png'),
};

interface Question {
    id: string;
    question: string;
    options: string[];
}

const QUESTIONS: Question[] = [
    {
        id: '1',
        question: 'How did you hear about us?',
        options: [
            'TikTok',
            'Instagram',
            'YouTube',
            'Google Search',
            'Reddit',
            'Friend/Referral',
            '✨ Other'
        ],
    },
    {
        id: '2',
        question: 'What best describes you?',
        options: [
            '🎒 Middle School',
            '🏫 High School',
            '🎓 College/University',
            '📚 Graduate Student',
            '⚖️ Medical/Law',
            '💼 Professional',
            '🌟 Hobbyist'
        ],
    },
    {
        id: '3',
        question: 'What will you use viszmo for?',
        options: [
            '🖥️ Overlay',
            '📝 Study Materials',
            '🎙️ Transcribing',
            '🥳 Access All'
        ],
    },
    {
        id: '4',
        question: "What's your current study energy?",
        options: [
            "🚀 The Academic Weapon",
            "☕ The Efficient Procrastinator",
            "📈 The Consistent Climber"
        ],
    },
    {
        id: '5',
        question: 'Where do you usually get stuck?',
        options: [
            '📄 The Wall of Text',
            '🧪 The Equation Abyss',
            '🎙️ The Lecture Blur'
        ],
    },
    {
        id: '6',
        question: 'How do you plan to use viszmo most?',
        options: [
            '📱 Mostly Mobile',
            '💻 Mostly Desktop',
            '🔄 The Full Ecosystem'
        ],
    },
    {
        id: '7',
        question: 'Do you currently use viszmo on desktop?',
        options: [
            '👍 Yes',
            '👎 No'
        ],
    },
    {
        id: '8',
        question: 'Which desktop platform do you use?',
        options: [
            '🪟 Windows',
            '🍎 Mac'
        ],
    }
];

export default function SurveyScreen() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const { triggerHaptic, soundsEnabled } = useSettings();

    // Animation refs for smooth transitions
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const currentQuestion = QUESTIONS[currentQuestionIndex];

    const triggerUserActionHaptic = () => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    };

    const animateTransition = (callback: () => void) => {
        // Slide out and fade out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            callback();
            // Reset position for slide in
            slideAnim.setValue(20);
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        });
    };

    const handleOptionSelect = (option: string) => {
        triggerUserActionHaptic();
        if (soundsEnabled) {
            playSound('correct');
        }
        const newAnswers = { ...answers, [currentQuestion.id]: option };
        setAnswers(newAnswers);

        let nextIndex = currentQuestionIndex + 1;

        // Conditional logic: Skip platform question if they select "No" to desktop
        if (currentQuestion.id === '7' && option === '👎 No') {
            nextIndex = currentQuestionIndex + 2;
        }

        if (nextIndex < QUESTIONS.length) {
            animateTransition(() => {
                setCurrentQuestionIndex(nextIndex);
            });
        } else {
            router.push('/(auth)/preparing');
        }
    };

    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: 10000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -100]
    });

    const scale = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2]
    });

    const progress = (currentQuestionIndex + 1) / QUESTIONS.length;

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#FFFFFF' }]}>
                <Animated.View style={[
                    { position: 'absolute', width: '150%', height: '150%', top: 0, left: '-25%' },
                    { transform: [{ translateY }, { scale }] }
                ]}>
                    <LinearGradient
                        colors={['rgba(14, 165, 233, 0.15)', 'rgba(14, 165, 233, 0.05)', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity
                    onPress={() => {
                        triggerUserActionHaptic();
                        if (currentQuestionIndex > 0) {
                            let prevIndex = currentQuestionIndex - 1;

                            // If going back and they previously skipped the desktop platform question, skip it again
                            if (prevIndex === 7 && answers['7'] === '👎 No') {
                                prevIndex = 6;
                            }

                            animateTransition(() => {
                                setCurrentQuestionIndex(prevIndex);
                            });
                        } else {
                            router.back();
                        }
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.progressBarBackground}>
                            <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.questionCount}>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</Text>
                    </View>

                    <Animated.View
                        style={[
                            styles.questionContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsContainer}>
                            {currentQuestion.options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.optionButton}
                                    onPress={() => handleOptionSelect(option)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionContentLeft}>
                                        {iconMap[option] && (
                                            <Image source={iconMap[option]} style={styles.optionIconImage} resizeMode="contain" />
                                        )}
                                        <Text style={styles.optionText}>{option}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>
                </View>
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
    backButton: {
        padding: 20,
        zIndex: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 20,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: 'rgba(30, 41, 59, 0.05)',
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#0EA5E9',
    },
    questionCount: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#64748B',
    },
    questionContainer: {
        flex: 1,
    },
    questionText: {
        fontSize: 26,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1E293B',
        marginBottom: 20,
        lineHeight: 32,
    },
    optionsContainer: {
        gap: 8,
        paddingBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        paddingVertical: 18,
        paddingHorizontal: 22,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionContentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconImage: {
        width: 22,
        height: 22,
        marginRight: 12,
    },
    optionText: {
        fontSize: 17,
        fontFamily: 'Inter-Medium',
        color: '#1E293B',
        flex: 1,
        marginRight: 12,
    }
});
