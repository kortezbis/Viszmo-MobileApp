import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { audioService } from '@/services/audio';
import { dbProvider } from '@/services/database';
import { generateTechnicalNote } from '@/services/gemini';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';

const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type RecordState = 'idle' | 'recording' | 'paused' | 'processing' | 'done';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatTime = (seconds: number) => {
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function LiveLectureScreen() {
    const insets = useSafeAreaInsets();

    // ── State ───────────────────────────────────────────────
    const [recordState, setRecordState] = useState<RecordState>('idle');

    // Accumulated "final" committed paragraphs
    const [committedText, setCommittedText] = useState('');
    // Live interim text (not yet committed)
    const [interimText, setInterimText] = useState('');

    const [recordingTime, setRecordingTime] = useState(0);
    const [waveData, setWaveData] = useState<number[]>(Array.from({ length: 32 }, () => 6));

    // ── Refs ────────────────────────────────────────────────
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);

    // Refs so event handlers always see the latest values (avoid stale closures)
    const committedRef = useRef('');
    committedRef.current = committedText;
    const recordStateRef = useRef<RecordState>('idle');
    recordStateRef.current = recordState;
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
            console.log('[Deepgram] WebSocket connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = data.is_final;
                    if (transcript) {
                        if (isFinal) {
                            setCommittedText(prev => (prev + transcript + ' ').trimStart());
                            setInterimText('');
                        } else {
                            setInterimText(transcript);
                        }
                        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
                    }
                }
            } catch (e) {
                console.error('[Deepgram] Error parsing message', e);
            }
        };

        socket.onclose = () => {
            console.log('[Deepgram] WebSocket closed');
            if (recordStateRef.current === 'recording') {
                connectDeepgram(); // Reconnect if still recording
            }
        };

        socket.onerror = (error) => {
            console.error('[Deepgram] WebSocket error:', error);
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
                wavFile: '', // Optional but required by types
            });

            LiveAudioStream.on('data', (data) => {
                const buffer = Buffer.from(data, 'base64');
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(buffer);
                }
            });
        } catch (e) {
            console.error('[LiveLecture] Error initing audio stream', e);
        }
    }, []);

    useEffect(() => {
        initAudioStream();
        return () => {
            try { LiveAudioStream.stop(); } catch (e) { }
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    // ── Timer & wave ────────────────────────────────────────
    useEffect(() => {
        if (recordState === 'recording') {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
                setWaveData(Array.from({ length: 32 }, () => 8 + Math.random() * 56));
            }, 1000);
            startPulse();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setWaveData(Array.from({ length: 32 }, () => 6));
            stopPulse();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [recordState]);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulse = () => pulseAnim.setValue(1);

    // ── Controls ────────────────────────────────────────────
    const handleStart = async () => {
        if (!DEEPGRAM_API_KEY) {
            Alert.alert('Missing API Key', 'Please set EXPO_PUBLIC_DEEPGRAM_API_KEY in your .env file.');
            return;
        }

        const hasPermission = await audioService.requestPermissions();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Microphone access is required to record lectures.');
            return;
        }

        setCommittedText('');
        setInterimText('');
        setRecordingTime(0);
        setRecordState('recording');
        connectDeepgram();
        try { LiveAudioStream.start(); } catch (e) { console.error('Error starting live stream', e); }
    };

    const handlePause = () => {
        try { LiveAudioStream.stop(); } catch (e) { }
        if (socketRef.current) socketRef.current.close();
        setInterimText('');
        setRecordState('paused');
        stopPulse();
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleResume = () => {
        setRecordState('recording');
        connectDeepgram();
        try { LiveAudioStream.start(); } catch (e) { }
    };

    const handleStop = async () => {
        // Stop the recogniser
        try { LiveAudioStream.stop(); } catch (e) { }
        if (socketRef.current) socketRef.current.close();

        const fullTranscript = (committedRef.current + ' ' + interimText).trim();

        if (!fullTranscript) {
            Alert.alert('No Transcript', 'Nothing was captured. Try speaking closer to the microphone.');
            setRecordState('idle');
            return;
        }

        setInterimText('');
        setRecordState('processing');

        try {
            const techNote = await generateTechnicalNote(fullTranscript);

            const newNote = await dbProvider.createLectureNote({
                title: techNote.title,
                content: fullTranscript,
                summary: techNote.summary,
                keyTakeaways: techNote.keyTakeaways,
                glossary: techNote.glossary,
            });

            setRecordState('done');

            Alert.alert(
                '✅ Analysis Complete',
                `"${techNote.title}" has been saved to your library.`,
                [
                    {
                        text: 'View Note',
                        onPress: () => router.replace({ pathname: '/lecture-details', params: { id: newNote.id, title: newNote.title } }),
                    },
                    {
                        text: 'Record Another',
                        onPress: () => {
                            setRecordState('idle');
                            setCommittedText('');
                            setRecordingTime(0);
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('[LiveLecture] Analysis error:', error);
            Alert.alert('Error', 'Failed to process the transcript. Your text has been captured — try again.');
            setRecordState('paused');
        }
    };

    // ── Derived ─────────────────────────────────────────────
    const isActive = recordState === 'recording';
    const hasContent = committedText.length > 0 || interimText.length > 0;
    const wordCount = (committedText + ' ' + interimText).trim().split(/\s+/).filter(Boolean).length;

    // ── Render ──────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => {
                        if (isActive) handlePause();
                        router.back();
                    }}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={[styles.liveDot, isActive && styles.liveDotActive]} />
                    <Text style={styles.headerTitle}>
                        {recordState === 'idle' ? 'Live Transcription'
                            : recordState === 'paused' ? 'Paused'
                                : recordState === 'processing' ? 'Analyzing...'
                                    : 'LIVE'}
                    </Text>
                </View>

                <View style={styles.timerBadge}>
                    <Text style={[styles.timerText, isActive && styles.timerTextActive]}>
                        {formatTime(recordingTime)}
                    </Text>
                </View>
            </View>

            {/* ── Waveform visualizer strip ── */}
            <View style={styles.waveformStrip}>
                {waveData.map((h, i) => (
                    <View
                        key={i}
                        style={[
                            styles.waveBar,
                            {
                                height: isActive ? h : 6,
                                backgroundColor: isActive ? `rgba(14, 165, 233, ${0.4 + (h / 64) * 0.6})` : 'rgba(255,255,255,0.08)',
                            },
                        ]}
                    />
                ))}
            </View>

            {/* ── Transcript area ── */}
            <View style={styles.transcriptCard}>
                {/* Word count badge */}
                {hasContent && (
                    <View style={styles.wordCountBadge}>
                        <Text style={styles.wordCountText}>{wordCount} words</Text>
                    </View>
                )}

                <ScrollView
                    ref={scrollRef}
                    style={styles.transcriptScroll}
                    contentContainerStyle={styles.transcriptContent}
                    showsVerticalScrollIndicator={false}
                >
                    {!hasContent ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="mic-outline" size={40} color="rgba(255,255,255,0.12)" />
                            <Text style={styles.emptyStateTitle}>Ready to transcribe</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Tap the mic below to start. Your lecture will appear here in real-time.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Committed (final) text */}
                            <Text style={styles.committedText}>{committedText}</Text>

                            {/* Live interim text — styled differently */}
                            {interimText ? (
                                <Text style={styles.interimText}>{interimText}</Text>
                            ) : null}

                            {/* Blinking cursor when recording */}
                            {isActive && <BlinkCursor />}
                        </>
                    )}
                </ScrollView>
            </View>

            {/* ── Bottom controls ── */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
                {recordState === 'processing' ? (
                    <BlurView intensity={25} tint="dark" style={styles.processingBar}>
                        <ActivityIndicator color={Colors.primary} size="small" />
                        <Text style={styles.processingText}>Gemini is structuring your notes...</Text>
                    </BlurView>
                ) : (
                    <View style={styles.controlRow}>
                        {/* Left: Stop / placeholder */}
                        {(recordState === 'recording' || recordState === 'paused') && hasContent ? (
                            <TouchableOpacity style={styles.sideButton} onPress={handleStop}>
                                <Ionicons name="checkmark-done" size={22} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.sideButtonLabel}>Finish</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.sideButton} />
                        )}

                        {/* Center: Main mic button */}
                        <View style={styles.mainBtnWrap}>
                            {isActive && (
                                <Animated.View
                                    style={[
                                        styles.pulseRing,
                                        { transform: [{ scale: pulseAnim }], opacity: 0.25 },
                                    ]}
                                />
                            )}
                            <TouchableOpacity
                                style={styles.mainActionBtn}
                                activeOpacity={0.88}
                                onPress={
                                    recordState === 'idle' ? handleStart
                                        : recordState === 'recording' ? handlePause
                                            : recordState === 'paused' ? handleResume
                                                : undefined
                                }
                                disabled={recordState !== 'idle' && recordState !== 'recording' && recordState !== 'paused'}
                            >
                                <LinearGradient
                                    colors={isActive ? ['#EF4444', '#B91C1C'] : ['#0EA5E9', '#0284C7']}
                                    style={styles.gradientBtn}
                                >
                                    <View style={styles.innerButtonEffect}>
                                        <MaterialCommunityIcons
                                            name={
                                                isActive ? 'pause'
                                                    : recordState === 'paused' ? 'play'
                                                        : 'microphone'
                                            }
                                            size={36}
                                            color="white"
                                        />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Right: Discard / placeholder */}
                        {(recordState === 'recording' || recordState === 'paused') ? (
                            <TouchableOpacity
                                style={styles.sideButton}
                                onPress={() => {
                                    Alert.alert('Discard Recording', 'Are you sure? All transcript text will be lost.', [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Discard', style: 'destructive', onPress: () => {
                                                try { LiveAudioStream.stop(); } catch (e) { }
                                                if (socketRef.current) socketRef.current.close();
                                                setRecordState('idle');
                                                setCommittedText('');
                                                setInterimText('');
                                                setRecordingTime(0);
                                            }
                                        },
                                    ]);
                                }}
                            >
                                <Ionicons name="trash-outline" size={20} color="rgba(239,68,68,0.7)" />
                                <Text style={[styles.sideButtonLabel, { color: 'rgba(239,68,68,0.7)' }]}>Discard</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.sideButton} />
                        )}
                    </View>
                )}

                <Text style={styles.hint}>
                    {recordState === 'idle'
                        ? 'Powered by Deepgram Real-Time Streaming'
                        : recordState === 'recording'
                            ? 'Listening… tap pause to take a break'
                            : recordState === 'paused'
                                ? 'Paused — tap play to continue or Finish to analyze'
                                : ''}
                </Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
// Blinking cursor indicator
// ─────────────────────────────────────────────────────────────
function BlinkCursor() {
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
        return () => opacity.stopAnimation();
    }, []);
    return <Animated.Text style={[styles.cursor, { opacity }]}>|</Animated.Text>;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    liveDotActive: {
        backgroundColor: '#EF4444',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        letterSpacing: 0.3,
    },
    timerBadge: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        minWidth: 60,
        alignItems: 'center',
    },
    timerText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    timerTextActive: {
        color: '#EF4444',
    },

    // Waveform
    waveformStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 3,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
        minHeight: 4,
    },

    // Transcript
    transcriptCard: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    wordCountBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: 'rgba(14,165,233,0.15)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(14,165,233,0.2)',
    },
    wordCountText: {
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        color: 'rgba(14,165,233,0.9)',
        letterSpacing: 0.3,
    },
    transcriptScroll: {
        flex: 1,
    },
    transcriptContent: {
        padding: 20,
        paddingTop: 24,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyStateTitle: {
        fontSize: 17,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.25)',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    committedText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.88)',
        lineHeight: 28,
    },
    interimText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 28,
        fontStyle: 'italic',
    },
    cursor: {
        fontSize: 18,
        color: Colors.primary,
        fontFamily: 'Inter-Regular',
        marginLeft: 2,
    },

    // Controls
    bottomControls: {
        paddingHorizontal: 20,
        paddingTop: 8,
        alignItems: 'center',
        gap: 14,
    },
    processingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        width: '100%',
    },
    processingText: {
        color: 'white',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    sideButton: {
        width: 72,
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
    },
    sideButtonLabel: {
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 0.3,
    },
    mainBtnWrap: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 100,
    },
    pulseRing: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#EF4444',
    },
    mainActionBtn: {
        width: 84,
        height: 84,
        borderRadius: 42,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
    },
    gradientBtn: {
        flex: 1,
        borderRadius: 42,
        padding: 4,
    },
    innerButtonEffect: {
        flex: 1,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    hint: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
});
