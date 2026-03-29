import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { dbProvider } from '@/services/database';
import { Flashcard } from '@/types/database';
import { Colors } from '@/constants/Theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const normalizeText = (text: string) => text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

// Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Scales allowed edit distance proportionally to the length of the target word.
// Short words (1-4 chars) → exact match only.
// Medium words (5-8 chars) → 1 edit allowed (handles phishing/fishing etc.)
// Longer words/phrases → 2 edits, capped at 3.
const allowedEdits = (target: string): number => {
    const len = target.replace(/\s/g, '').length;
    if (len <= 4) return 0;
    if (len <= 8) return 1;
    if (len <= 14) return 2;
    return 3;
};

// Returns true if the spoken phrase contains or is close enough to the target.
// Checks the full phrase AND each individual spoken word against each target word.
const isMatch = (spoken: string, target: string): boolean => {
    // Exact substring match first (fastest path)
    if (spoken.includes(target)) return true;

    const targetWords = target.split(' ');
    const spokenWords = spoken.split(' ');

    // For single-word answers, check if any spoken word is close enough
    if (targetWords.length === 1) {
        return spokenWords.some(w => levenshtein(w, target) <= allowedEdits(target));
    }

    // For multi-word answers, check per-word fuzzy match across spoken words
    // Every target word must have a spoken word close enough to it
    return targetWords.every(tw =>
        spokenWords.some(sw => levenshtein(sw, tw) <= allowedEdits(tw))
    );
};

export default function SpeakingDrillScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    const [terms, setTerms] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [drillState, setDrillState] = useState<'idle' | 'recording' | 'correct' | 'incorrect' | 'finished'>('idle');
    const [timeLeft, setTimeLeft] = useState(8); // 8 second timer
    const [showSettings, setShowSettings] = useState(false); // Settings Modal State
    const [cardLimit, setCardLimit] = useState(1); // Default to at least 1, will be set appropriately after fetch

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Animation for settings options
    const translateY = useRef(new Animated.Value(20)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchTerms = async () => {
            if (id) {
                const deckTerms = await dbProvider.getFlashcardsByDeckId(id);
                setTerms(deckTerms);
                setCardLimit(deckTerms.length > 0 ? deckTerms.length : 1);
            }
        };
        fetchTerms();
    }, [id]);

    useEffect(() => {
        if (showSettings) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 9,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 15,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showSettings]);

    useSpeechRecognitionEvent('start', () => {
        setIsRecording(true);
        setDrillState('recording');
    });

    useSpeechRecognitionEvent('end', () => {
        setIsRecording(false);
    });

    useSpeechRecognitionEvent('error', (event) => {
        setIsRecording(false);
        console.error('Speech error: ', event.error);
    });

    useSpeechRecognitionEvent('result', (event) => {
        if (drillState !== 'recording' || !terms[currentIndex]) return;

        let spoken = '';
        if (event.results) {
            for (let i = 0; i < event.results.length; i++) {
                spoken += event.results[i].transcript + ' ';
            }
        }

        const currentAnswer = normalizeText(terms[currentIndex].front);
        const spokenNormalized = normalizeText(spoken);

        if (isMatch(spokenNormalized, currentAnswer)) {
            handleCorrect();
        }
    });

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Timer effect
    useEffect(() => {
        if (drillState === 'recording') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [drillState]);

    // Pulsing animation for microphone
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);



    // Removed onSpeechResults as it is now in useSpeechRecognitionEvent('result', ...)

    function startRecording() {
        if (terms.length === 0) return;
        setTimeLeft(8);
        setDrillState('idle');

        try {
            ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
        } catch (e) {
            console.error('Failed to start recording', e);
        }
    }

    function stopRecording() {
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch (e) {
            console.error('Failed to stop', e);
        }
    }

    async function handleCorrect() {
        await stopRecording();
        setDrillState('correct');

        // Move to next card after a short delay
        setTimeout(() => {
            if (currentIndex < Math.min(cardLimit, terms.length) - 1) {
                setCurrentIndex(currentIndex + 1);
                setDrillState('idle');
                setTimeLeft(8);
            } else {
                setDrillState('finished');
            }
        }, 1500);
    }

    async function handleTimeUp() {
        await stopRecording();
        setDrillState('incorrect');
    }

    function tryAgain() {
        setDrillState('idle');
        setTimeLeft(8);
        // startRecording(); // Optionally auto-start
    }

    function skipCard() {
        if (currentIndex < Math.min(cardLimit, terms.length) - 1) {
            setCurrentIndex(currentIndex + 1);
            setDrillState('idle');
            setTimeLeft(8);
        } else {
            setDrillState('finished');
        }
    }

    if (terms.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Loading Drill...</Text>
                    <View style={styles.headerIcon} />
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Loading terms...</Text>
                </View>
            </View>
        );
    }

    if (drillState === 'finished') {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Finished</Text>
                    <View style={styles.headerIcon} />
                </View>
                <View style={[styles.centerContainer, { paddingBottom: insets.bottom + 100 }]}>
                    <Ionicons name="trophy" size={80} color="#FACC15" />
                    <Text style={styles.finishedText}>Drill Complete!</Text>
                    <Text style={styles.finishedSub}>Great job practicing your speaking.</Text>
                    <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                        <Text style={styles.doneButtonText}>Back to Deck</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const maxQuestions = Math.min(cardLimit, terms.length);
    const displayedTerms = terms.slice(0, maxQuestions);
    const currentCard = displayedTerms[currentIndex];

    if (!currentCard) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Header matching lecture-details style */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {currentIndex + 1} / {maxQuestions}
                </Text>
                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => setShowSettings(true)}
                >
                    <Ionicons name="settings-outline" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {/* Content area */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 150 }]}
            >

                {/* Shared Container Style for Prompts (looks like lecture content) */}
                <View style={styles.contentContainer}>
                    {/* Prompt Card */}
                    <Text style={styles.promptLabel}>SAY THE TERM FOR:</Text>
                    <Text style={styles.promptText}>{currentCard.back}</Text>
                </View>

                {/* Status / Transcript Area */}
                <View style={styles.statusArea}>
                    {drillState === 'recording' && (
                        <View style={styles.contentContainer}>
                            <Text style={styles.timerText}>00:0{timeLeft}</Text>
                        </View>
                    )}

                    {drillState === 'correct' && (
                        <View style={styles.resultBadge}>
                            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            <Text style={[styles.resultText, { color: '#10B981' }]}>Correct!</Text>
                        </View>
                    )}

                    {drillState === 'incorrect' && (
                        <View style={styles.contentContainer}>
                            <View style={styles.incorrectContainer}>
                                <Text style={styles.timeUpText}>Time's up!</Text>
                                <Text style={styles.answerReveal}>The answer was: {currentCard.front}</Text>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.actionButtonSecondary} onPress={tryAgain}>
                                        <Text style={styles.actionButtonTextSecondary}>Try Again</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={skipCard}>
                                        <Text style={styles.actionButtonText}>Next</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Microphone Button Area */}
            {drillState === 'idle' || drillState === 'recording' ? (
                <View style={styles.bottomSection}>
                    <View style={[styles.controlsLayout, { paddingBottom: insets.bottom + 20 }]}>
                        <Text style={styles.instructionText}>
                            {drillState === 'recording' ? "Listening to your answer..." : "Tap to start capturing knowledge"}
                        </Text>

                        <View style={styles.buttonContainer}>
                            {drillState === 'recording' && (
                                <Animated.View
                                    style={[
                                        styles.pulseRing,
                                        { transform: [{ scale: pulseAnim }], opacity: 0.3 }
                                    ]}
                                />
                            )}

                            <TouchableOpacity
                                onPress={drillState === 'recording' ? stopRecording : startRecording}
                                activeOpacity={0.9}
                                style={styles.mainActionBtn}
                            >
                                <LinearGradient
                                    colors={drillState === 'recording' ? ['#EF4444', '#B91C1C'] : ['#0EA5E9', '#0284C7']}
                                    style={styles.gradientBtn}
                                >
                                    <View style={styles.innerButtonEffect}>
                                        <MaterialCommunityIcons
                                            name={drillState === 'recording' ? "stop" : "microphone"}
                                            size={36}
                                            color="white"
                                        />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : null}

            {/* Settings Assistant Overlay */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { zIndex: 1000, pointerEvents: showSettings ? 'auto' : 'none' }
                ]}
            >
                <Pressable
                    style={styles.overlayBackdrop}
                    onPress={() => setShowSettings(false)}
                >
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity }]} />
                </Pressable>

                <Animated.View
                    style={[
                        { position: 'absolute', bottom: 0, left: 0, right: 0 },
                        { opacity, transform: [{ translateY }] }
                    ]}
                >
                    <BlurView intensity={60} tint="dark" style={[styles.aiOverlay, { position: 'relative', paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.overlayHeader}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.overlayTitle}>Speaking Drill Settings</Text>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.item}>
                                <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
                                    <Ionicons name="documents-outline" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Question Limit</Text>
                                    <Text style={styles.itemSubText}>Cards to review</Text>
                                </View>
                                <View style={styles.limitInputContainer}>
                                    <View>
                                        <TextInput
                                            style={styles.limitInput}
                                            keyboardType="numeric"
                                            value={cardLimit.toString()}
                                            onChangeText={(text) => {
                                                if (text === '') return setCardLimit(1); // temporary empty handling
                                                const val = parseInt(text);
                                                if (!isNaN(val)) {
                                                    setCardLimit(Math.min(Math.max(1, val), terms.length));
                                                }
                                            }}
                                        />
                                        <Text style={styles.limitMaxText}>Max: {terms.length}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.maxButton}
                                        onPress={() => setCardLimit(terms.length)}
                                    >
                                        <Text style={styles.maxButtonText}>MAX</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => setShowSettings(false)}>
                                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                                    <Ionicons name="timer-outline" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Drill Timer</Text>
                                    <Text style={styles.itemSubText}>Currently 8 Seconds</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => {
                                setShowSettings(false);
                                router.back();
                            }}>
                                <View style={[styles.iconContainer, { backgroundColor: '#F43F5E' }]}>
                                    <Ionicons name="exit-outline" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Exit Drill</Text>
                                    <Text style={styles.itemSubText}>Return back to deck menu</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: Colors.background,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    promptLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        marginBottom: 12,
        letterSpacing: 1,
    },
    promptText: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
        lineHeight: 34,
    },
    statusArea: {
        width: '100%',
        marginTop: 20,
        alignItems: 'center',
        minHeight: 150,
    },
    timerText: {
        color: '#F43F5E',
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 16,
    },
    transcriptText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Medium',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    resultText: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    incorrectContainer: {
        alignItems: 'center',
        width: '100%',
    },
    timeUpText: {
        color: '#F43F5E',
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 8,
    },
    answerReveal: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Medium',
        marginBottom: 24,
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    actionButtonSecondary: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    actionButtonTextSecondary: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingTop: 20,
    },
    controlsLayout: {
        alignItems: 'center',
        width: '100%',
    },
    instructionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 30,
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 120,
        height: 120,
    },
    pulseRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#EF4444',
    },
    mainActionBtn: {
        width: 90,
        height: 90,
        borderRadius: 45,
        elevation: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    gradientBtn: {
        flex: 1,
        borderRadius: 45,
        padding: 4,
        width: '100%',
        height: '100%',
    },
    innerButtonEffect: {
        flex: 1,
        borderRadius: 41,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    finishedText: {
        color: 'white',
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-Bold',
        marginTop: 24,
        marginBottom: 8,
    },
    finishedSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Medium',
        marginBottom: 40,
    },
    doneButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    overlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    aiOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 12,
        paddingHorizontal: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    overlayHeader: {
        marginBottom: 24,
    },
    overlayTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 22,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.03)',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        letterSpacing: 0.1,
    },
    itemSubText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    limitInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    limitInput: {
        width: 70,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
    },
    limitMaxText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
        marginTop: 4,
    },
    maxButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue primary/15
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    maxButtonText: {
        color: '#3B82F6',
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Bold',
    },
});
