import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Pressable, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { dbProvider } from '@/services/database';
import { Flashcard } from '@/types/database';
import { Colors } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function FlashcardDrillScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    const [terms, setTerms] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings
    const [cardLimit, setCardLimit] = useState<number>(30); // Default max

    // Animations
    const flipAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const settingsTranslateY = useRef(new Animated.Value(20)).current;
    const settingsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchTerms = async () => {
            if (id) {
                const deckTerms = await dbProvider.getFlashcardsByDeckId(id);
                setTerms(deckTerms);
                setCardLimit(deckTerms.length > 0 ? deckTerms.length : 30);
            }
        };
        fetchTerms();
    }, [id]);

    useEffect(() => {
        if (showSettings) {
            Animated.parallel([
                Animated.spring(settingsTranslateY, { toValue: 0, friction: 9, tension: 40, useNativeDriver: true }),
                Animated.timing(settingsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(settingsTranslateY, { toValue: 15, duration: 250, useNativeDriver: true }),
                Animated.timing(settingsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [showSettings]);

    const flipCard = () => {
        Animated.timing(flipAnim, {
            toValue: isFlipped ? 0 : 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const nextCard = (direction: 'left' | 'right') => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: direction === 'right' ? width : -width,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (currentIndex < terms.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
                flipAnim.setValue(0);
                slideAnim.setValue(direction === 'right' ? -width : width);

                Animated.parallel([
                    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();
            } else {
                setIsFinished(true);
            }
        });
    };

    if (terms.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading...</Text>
                    <View style={styles.headerIcon} />
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Loading terms...</Text>
                </View>
            </View>
        );
    }

    if (isFinished) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Finished</Text>
                    <View style={styles.headerIcon} />
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="checkmark-done-circle" size={90} color="#10B981" />
                    <Text style={styles.finishedText}>Deck Complete!</Text>
                    <Text style={styles.finishedSub}>You've reviewed all cards.</Text>
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

    // Added guard in case the limits change dynamically
    if (!currentCard) {
        setIsFinished(true);
        return null;
    }

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = { transform: [{ rotateX: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateX: backInterpolate }] };

    const slideAnimatedStyle = {
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim,
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.progressHeader}>
                    <Text style={styles.headerTitle}>
                        {currentIndex + 1} / {maxQuestions}
                    </Text>
                    <View style={styles.progressBarBg}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                { width: `${((currentIndex + 1) / maxQuestions) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSettings(true)}>
                    <Ionicons name="settings-outline" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {/* Flashcard Area */}
            <View style={styles.cardArea}>
                <Animated.View style={[styles.cardWrapper, slideAnimatedStyle]}>
                    <Pressable style={styles.flipWrapper} onPress={flipCard}>
                        {/* Front of Card */}
                        <Animated.View style={[styles.cardFace, frontAnimatedStyle, { backfaceVisibility: 'hidden', position: 'absolute' }]}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardIndicator}>TERM</Text>
                                <Text style={styles.cardFrontText}>{currentCard.front}</Text>
                                <View style={styles.tapToFlipHint}>
                                    <Ionicons name="sync-outline" size={16} color="rgba(255,255,255,0.4)" />
                                    <Text style={styles.tapToFlipText}>Tap to flip</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Back of Card */}
                        <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle, { backfaceVisibility: 'hidden' }]}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardIndicator}>DEFINITION</Text>
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBack}>
                                    <Text style={styles.cardBackText}>{currentCard.back}</Text>
                                </ScrollView>
                            </View>
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </View >

            {/* Bottom Actions */}
            < View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]} >
                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.buttonRed]} onPress={() => nextCard('left')} activeOpacity={0.8}>
                        <Ionicons name="close" size={28} color="#F43F5E" />
                        <Text style={[styles.actionText, { color: '#F43F5E' }]}>Still learning</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.buttonYellow]} onPress={() => nextCard('right')} activeOpacity={0.8}>
                        <Ionicons name="remove" size={28} color="#F59E0B" />
                        <Text style={[styles.actionText, { color: '#F59E0B' }]}>Somewhat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.buttonGreen]} onPress={() => nextCard('right')} activeOpacity={0.8}>
                        <Ionicons name="checkmark" size={28} color="#10B981" />
                        <Text style={[styles.actionText, { color: '#10B981' }]}>Know it</Text>
                    </TouchableOpacity>
                </View>
            </View >

            {/* Settings Overlay */}
            < View style={[StyleSheet.absoluteFill, { zIndex: 1000, pointerEvents: showSettings ? 'auto' : 'none' }]} >
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)}>
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: settingsOpacity }]} />
                </Pressable>
                <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, { opacity: settingsOpacity, transform: [{ translateY: settingsTranslateY }] }]}>
                    <BlurView intensity={60} tint="dark" style={[styles.aiOverlay, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.overlayHeader}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.overlayTitle}>Flashcard Settings</Text>
                        </View>
                        <View style={styles.section}>
                            <View style={styles.item}>
                                <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
                                    <Ionicons name="documents-outline" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Question Limit</Text>
                                    <Text style={styles.itemSubText}>Cards per session</Text>
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

                            <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => {
                                setShowSettings(false);
                                router.back();
                            }}>
                                <View style={[styles.iconContainer, { backgroundColor: '#F43F5E' }]}>
                                    <Ionicons name="exit-outline" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Exit Session</Text>
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
    progressHeader: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 6,
    },
    progressBarBg: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
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
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    cardWrapper: {
        width: '100%',
        height: height * 0.55,
        maxHeight: 600,
    },
    flipWrapper: {
        width: '100%',
        height: '100%',
    },
    cardFace: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
    },
    cardBack: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    cardContent: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIndicator: {
        position: 'absolute',
        top: 24,
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
    },
    cardFrontText: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 42,
    },
    scrollBack: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBackText: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 32,
    },
    tapToFlipHint: {
        position: 'absolute',
        bottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tapToFlipText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.4)',
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 20,
        alignItems: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        backgroundColor: 'rgba(255,255,255,0.03)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    buttonRed: {
        borderColor: 'rgba(244, 63, 94, 0.3)',
        shadowColor: '#F43F5E',
    },
    buttonYellow: {
        borderColor: 'rgba(245, 158, 11, 0.3)',
        shadowColor: '#F59E0B',
    },
    buttonGreen: {
        borderColor: 'rgba(16, 185, 129, 0.3)',
        shadowColor: '#10B981',
    },
    actionText: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
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
        marginBottom: 2,
    },
    itemSubText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255, 255, 255, 0.5)',
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
