import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import { dbProvider } from '@/services/database';
import { generateTechnicalNote } from '@/services/gemini';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { audioService } from '@/services/audio';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';

const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CreateLectureScreen() {
    const insets = useSafeAreaInsets();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [waveData, setWaveData] = useState<number[]>(Array.from({ length: 40 }, () => 6));
    const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [liveWordCount, setLiveWordCount] = useState(0);
    const timerRef = useRef<any>(null);

    // Transcript accumulation (same as live screen)
    const committedTextRef = useRef('');
    const interimTextRef = useRef('');
    const isRecordingRef = useRef(false);
    isRecordingRef.current = isRecording;

    const LANGUAGE_CODES: Record<string, string> = {
        'English (US)': 'en-US',
        'Spanish (ES)': 'es-ES',
        'French (FR)': 'fr-FR',
        'German (DE)': 'de-DE',
        'Italian (IT)': 'it-IT',
        'Portuguese (PT)': 'pt-PT',
        'Japanese (JP)': 'ja-JP',
        'Korean (KR)': 'ko-KR',
        'Chinese (ZH)': 'zh-CN',
    };

    const LANGUAGES = Object.keys(LANGUAGE_CODES);

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Action sheet animation values
    const sheetTranslateY = useSharedValue(20);
    const sheetOpacity = useSharedValue(0);

    const sheetStyle = useAnimatedStyle(() => ({
        opacity: sheetOpacity.value,
        transform: [{ translateY: sheetTranslateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: sheetOpacity.value,
    }));

    const socketRef = useRef<WebSocket | null>(null);

    // ── Deepgram WebSocket & Audio Stream ────────────────────
    const connectDeepgram = useCallback(() => {
        if (!DEEPGRAM_API_KEY) {
            Alert.alert('Missing API Key', 'Please set EXPO_PUBLIC_DEEPGRAM_API_KEY in your .env file.');
            return;
        }

        const socket = new WebSocket('wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&interim_results=true', [
            'token',
            DEEPGRAM_API_KEY
        ]);

        socket.onopen = () => {
            console.log('[Deepgram Lecture] WebSocket connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = data.is_final;
                    if (transcript) {
                        if (isFinal) {
                            committedTextRef.current = (committedTextRef.current + transcript + ' ').trimStart();
                            interimTextRef.current = '';
                        } else {
                            interimTextRef.current = transcript;
                        }
                        const fullText = committedTextRef.current + interimTextRef.current;
                        setLiveWordCount(fullText.trim().split(/\s+/).filter(Boolean).length);
                    }
                }
            } catch (e) {
                console.error('[Deepgram Lecture] Error parsing message', e);
            }
        };

        socket.onclose = () => {
            console.log('[Deepgram Lecture] WebSocket closed');
            if (isRecordingRef.current) {
                connectDeepgram(); // Reconnect if still recording
            }
        };

        socket.onerror = (error) => {
            console.error('[Deepgram Lecture] WebSocket error:', error);
        };

        socketRef.current = socket;
    }, []);

    const initAudioStream = useCallback(() => {
        try {
            LiveAudioStream.init({
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6, // 6 = VOICE_RECOGNITION on Android
                bufferSize: 4096,
                wavFile: '',
            });

            LiveAudioStream.on('data', (data) => {
                const buffer = Buffer.from(data, 'base64');
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(buffer);
                }
            });
        } catch (e) {
            console.error('[CreateLecture] Error initing audio stream', e);
        }
    }, []);

    useEffect(() => {
        initAudioStream();
        return () => {
            try { LiveAudioStream.stop(); } catch (e) { }
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    useEffect(() => {
        if (isLanguageModalVisible) {
            sheetTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });
            sheetOpacity.value = withTiming(1, { duration: 300 });
        } else {
            sheetTranslateY.value = withTiming(15, { duration: 250 });
            sheetOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [isLanguageModalVisible]);

    useEffect(() => {
        if (isRecording) {
            startTimer();
            startPulse();
        } else {
            stopTimer();
            stopPulse();
            if (!isProcessing) {
                setWaveData(Array.from({ length: 40 }, () => 6));
            }
        }
        return () => {
            stopTimer();
            stopPulse();
        };
    }, [isRecording]);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 0.1);
            setWaveData(Array.from({ length: 40 }, () => 10 + Math.random() * 70));
        }, 100);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.setValue(1);
    };

    const formatTime = (seconds: number) => {
        const totalSecs = Math.floor(seconds);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            // ── STOP: collect transcript and analyze ────────
            isRecordingRef.current = false;
            setIsRecording(false);

            try { LiveAudioStream.stop(); } catch (e) { }
            if (socketRef.current) socketRef.current.close();

            const fullTranscript = (committedTextRef.current + ' ' + interimTextRef.current).trim();

            if (!fullTranscript || fullTranscript.length < 10) {
                Alert.alert(
                    'Nothing Captured',
                    'No speech was detected. Make sure you speak clearly, or try again in a quieter environment.',
                );
                setRecordingTime(0);
                setLiveWordCount(0);
                committedTextRef.current = '';
                interimTextRef.current = '';
                return;
            }

            setIsProcessing(true);
            try {
                const techNote = await generateTechnicalNote(fullTranscript);

                const newNote = await dbProvider.createLectureNote({
                    title: techNote.title,
                    content: fullTranscript,
                    summary: techNote.summary,
                    keyTakeaways: techNote.keyTakeaways,
                    glossary: techNote.glossary,
                });

                Alert.alert(
                    '✅ Analysis Complete',
                    `"${techNote.title}" has been saved to your library.`,
                    [{
                        text: 'View Note',
                        onPress: () => router.push({ pathname: '/lecture-details', params: { id: newNote.id, title: newNote.title } })
                    }]
                );
            } catch (error) {
                console.error('[Lecture] Analysis error:', error);
                Alert.alert('Error', 'Failed to analyze your speech. Your recording was captured but could not be processed. Try again.');
            } finally {
                setIsProcessing(false);
                setRecordingTime(0);
                setLiveWordCount(0);
                committedTextRef.current = '';
                interimTextRef.current = '';
            }
        } else {
            // ── START ────────────────────────────────────────
            if (!DEEPGRAM_API_KEY) {
                Alert.alert('Missing API Key', 'Please set EXPO_PUBLIC_DEEPGRAM_API_KEY in your .env file.');
                return;
            }

            const hasPermission = await audioService.requestPermissions();
            if (!hasPermission) {
                Alert.alert('Permission Required', 'Microphone access is needed to record lectures.');
                return;
            }

            committedTextRef.current = '';
            interimTextRef.current = '';
            setLiveWordCount(0);
            setRecordingTime(0);
            setIsRecording(true);
            isRecordingRef.current = true;

            connectDeepgram();
            try {
                LiveAudioStream.start();
            } catch (error) {
                Alert.alert('Error', 'Could not start audio stream.');
            }
        }
    };

    return (
        <AppBackground>
            <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recording Studio</Text>
                    <View style={{ width: 44, height: 44 }} />
                </View>

                {/* Top Info Card */}
                <View style={styles.infoCard}>
                    <BlurView intensity={20} tint="dark" style={styles.infoCardBlur}>
                        <View style={styles.recordingIndicator}>
                            <View style={[styles.dot, isRecording && styles.activeDot]} />
                            <Text style={[styles.recordingStatus, isRecording && { color: '#EF4444' }]}>
                                {isRecording ? 'LIVE RECORDING' : 'READY TO RECORD'}
                            </Text>
                            {isRecording && liveWordCount > 0 && (
                                <View style={styles.wordBadge}>
                                    <Text style={styles.wordBadgeText}>{liveWordCount} words</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.setLanguageBtn} onPress={() => setIsLanguageModalVisible(true)}>
                            <Ionicons name="globe-outline" size={16} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.languageText}>{selectedLanguage}</Text>
                            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    </BlurView>
                </View>

                {/* Visualizer Area */}
                <View style={styles.visualizerArea}>
                    <Text style={styles.timeText}>{formatTime(recordingTime)}</Text>

                    <View style={styles.waveformContainer}>
                        {waveData.map((height, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.waveBar,
                                    {
                                        height: height,
                                        backgroundColor: isRecording ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                                        shadowColor: '#3B82F6',
                                        shadowOpacity: isRecording ? 0.5 : 0,
                                        shadowRadius: 10,
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomSection}>
                    {isProcessing ? (
                        <BlurView intensity={30} tint="dark" style={styles.processingBar}>
                            <ActivityIndicator color="#3B82F6" />
                            <Text style={styles.processingText}>Gemini is analyzing your lecture...</Text>
                        </BlurView>
                    ) : isRecording ? (
                        /* ── Active recording controls ── */
                        <View style={styles.controlsLayout}>
                            <Text style={styles.instructionText}>Listening to your lecture...</Text>
                            <View style={styles.buttonContainer}>
                                <Animated.View
                                    style={[
                                        styles.pulseRing,
                                        { transform: [{ scale: pulseAnim }], opacity: 0.3 }
                                    ]}
                                />
                                <TouchableOpacity
                                    onPress={handleToggleRecording}
                                    activeOpacity={0.9}
                                    style={styles.mainActionBtn}
                                >
                                    <LinearGradient
                                        colors={['#EF4444', '#B91C1C']}
                                        style={styles.gradientBtn}
                                    >
                                        <View style={styles.innerButtonEffect}>
                                            <MaterialCommunityIcons name="stop" size={36} color="white" />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* ── Mode selection cards ── */
                        <View style={styles.modeSection}>
                            <Text style={styles.instructionText}>Choose a recording mode</Text>
                            <View style={styles.modeCards}>

                                {/* Live Transcription */}
                                <TouchableOpacity
                                    style={styles.modeCard}
                                    activeOpacity={0.8}
                                    onPress={() => router.push('/create/live-lecture')}
                                >
                                    <View style={[styles.modeIconWrap, { backgroundColor: 'rgba(14,165,233,0.15)' }]}>
                                        <MaterialCommunityIcons name="waveform" size={22} color="#0EA5E9" />
                                    </View>
                                    <View style={styles.modeTextWrap}>
                                        <Text style={styles.modeTitle}>Live Transcription</Text>
                                        <Text style={styles.modeSub}>Real-time text as you speak</Text>
                                    </View>
                                    <View style={styles.modeLiveBadge}>
                                        <Text style={styles.modeLiveBadgeText}>LIVE</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Record & Analyze */}
                                <TouchableOpacity
                                    style={styles.modeCard}
                                    activeOpacity={0.8}
                                    onPress={handleToggleRecording}
                                >
                                    <View style={[styles.modeIconWrap, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                                        <MaterialCommunityIcons name="microphone" size={22} color="#8B5CF6" />
                                    </View>
                                    <View style={styles.modeTextWrap}>
                                        <Text style={styles.modeTitle}>Record & Analyze</Text>
                                        <Text style={styles.modeSub}>Deeper AI summary after recording</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Language Selection Custom Action Sheet */}
            <View
                style={[
                    styles.overlay,
                    { pointerEvents: isLanguageModalVisible ? 'auto' : 'none' }
                ]}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <Reanimated.View style={[styles.backdropBackground, backdropStyle]} />
                </TouchableOpacity>

                <Reanimated.View
                    style={[
                        styles.sheet,
                        sheetStyle,
                        { paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.sheetContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalList}>
                            {LANGUAGES.map((lang, index) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.languageOption,
                                        index === LANGUAGES.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setSelectedLanguage(lang);
                                        setIsLanguageModalVisible(false);
                                    }}
                                >
                                    <View style={styles.languageOptionInner}>
                                        <Text style={[
                                            styles.languageOptionText,
                                            selectedLanguage === lang && { color: '#3B82F6', fontFamily: 'PlusJakartaSans-Bold' }
                                        ]}>
                                            {lang}
                                        </Text>
                                        {selectedLanguage === lang && (
                                            <Ionicons name="checkmark" size={20} color="#3B82F6" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Reanimated.View>
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    infoCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 40,
    },
    infoCardBlur: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    activeDot: {
        backgroundColor: '#EF4444',
    },
    recordingStatus: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    setLanguageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    languageText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.8)',
    },
    visualizerArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 72,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 30,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        gap: 4,
        width: width - 80,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
        minHeight: 6,
    },
    bottomSection: {
        paddingBottom: 40,
        alignItems: 'center',
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
    processingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    processingText: {
        color: 'white',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    sheetContent: {
        paddingHorizontal: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    modalList: {
        gap: 8,
    },
    languageOption: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    languageOptionInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    languageOptionText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: 'white',
    },
    // Mode selection
    modeSection: {
        width: '100%',
        alignItems: 'center',
    },
    modeCards: {
        width: '100%',
        gap: 10,
    },
    modeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 14,
    },
    modeIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    modeTextWrap: {
        flex: 1,
    },
    modeTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 2,
    },
    modeSub: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.45)',
    },
    modeLiveBadge: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
    },
    modeLiveBadgeText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#EF4444',
        letterSpacing: 0.5,
    },
    wordBadge: {
        backgroundColor: 'rgba(14,165,233,0.15)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(14,165,233,0.2)',
        marginLeft: 8,
    },
    wordBadgeText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(14,165,233,0.9)',
        letterSpacing: 0.3,
    },
});
