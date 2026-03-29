import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    FlatList,
    Animated,
} from 'react-native';
import { Flashcard } from '@/types/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { useActionSheet } from '@/context/ActionSheetContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Modal } from 'react-native';
import { dbProvider } from '@/services/database';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const STUDY_MODES = [
    { id: 'flashcards', label: 'Flashcards', icon: 'layers-outline', color: '#4F46E5' },
    { id: 'speaking', label: 'Speaking Drill', icon: 'mic-outline', color: '#14B8A6' },
    { id: 'learn', label: 'Learn', icon: 'school-outline', color: '#8B5CF6' },
    { id: 'test', label: 'Test', icon: 'document-text-outline', color: '#3B82F6' },
    { id: 'match', label: 'Match', icon: 'copy-outline', color: '#EC4899' },
];

const FlipCard = ({ term }: { term: Flashcard }) => {
    const flipAnim = useRef(new Animated.Value(0)).current;
    const [isFlipped, setIsFlipped] = useState(false);

    const toggleFlip = () => {
        Animated.timing(flipAnim, {
            toValue: isFlipped ? 0 : 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
    };

    return (
        <View style={styles.cardItemContainer}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={toggleFlip}
                style={styles.flipCardWrapper}
            >
                <View style={styles.flipCardInner}>
                    <Animated.View
                        style={[
                            styles.mainCard,
                            frontAnimatedStyle,
                            { backfaceVisibility: 'hidden', position: 'absolute' }
                        ]}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.cardTextWrapper}>
                            <Text style={styles.cardText}>{term.front}</Text>
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.mainCard,
                            styles.cardBack,
                            backAnimatedStyle,
                            { backfaceVisibility: 'hidden' }
                        ]}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.cardTextWrapper}>
                            <Text style={[styles.cardText, styles.cardAnswerText]}>{term.back}</Text>
                        </View>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

import { useLocalSearchParams } from 'expo-router';

export default function DeckDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { id, title: searchTitle, fromCreate } = useLocalSearchParams<{ id: string, title?: string, fromCreate?: string }>();
    const { openActionSheet } = useActionSheet();
    const { showPaywall } = useSubscription();
    const [title, setTitle] = useState(searchTitle || 'Untitled Deck');
    const [showAllModes, setShowAllModes] = useState(false);

    const handleBack = () => {
        if (fromCreate === 'true') {
            router.replace('/(tabs)/library');
        } else {
            router.back();
        }
    };
    const [starredTerms, setStarredTerms] = useState<string[]>([]);
    const [terms, setTerms] = useState<Flashcard[]>([]);
    const [sortOrder, setSortOrder] = useState<'original' | 'alphabetical'>('original');
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;

    const footerTranslateY = scrollY.interpolate({
        inputRange: [0, 100, 200],
        outputRange: [100, 100, 0],
        extrapolate: 'clamp',
    });

    const footerOpacity = scrollY.interpolate({
        inputRange: [0, 100, 200],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
    });

    const footerScale = scrollY.interpolate({
        inputRange: [0, 200, 250],
        outputRange: [0.8, 0.8, 1],
        extrapolate: 'clamp',
    });

    const fetchDeck = async () => {
        if (!id) return;
        const deck = await dbProvider.getDeckById(id);
        if (deck) {
            setTitle(deck.title);
            const deckTerms = await dbProvider.getFlashcardsByDeckId(id);
            setTerms(deckTerms);
        }
    };

    useEffect(() => {
        fetchDeck();
    }, [id]);

    const toggleStar = (id: string) => {
        setStarredTerms(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const onScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        if (slideSize === 0) return;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (roundIndex !== currentCardIndex) {
            setCurrentCardIndex(roundIndex);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'original' ? 'alphabetical' : 'original');
    };

    const displayTerms = sortOrder === 'original'
        ? terms
        : [...terms].sort((a, b) => a.front.localeCompare(b.front));

    const handleStudyModePress = (modeId: string) => {
        if (modeId === 'flashcards' || modeId === 'test') {
            router.push({
                pathname: '/flashcard-drill',
                params: { id: id }
            } as any);
        } else if (modeId === 'speaking') {
            router.push({
                pathname: '/speaking-drill',
                params: { id: id }
            } as any);
        } else {
            openActionSheet('study');
        }
    };

    const displayedModes = showAllModes ? STUDY_MODES : STUDY_MODES.slice(0, 4);

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.trialPill}
                        onPress={showPaywall}
                    >
                        <Text style={styles.trialText}>Free trial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerIcon}
                        onPress={() => openActionSheet('options', title, id, 'deck', fetchDeck)}
                    >
                        <Ionicons name="ellipsis-horizontal" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[3]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* Flashcard Preview */}
                <View style={styles.cardPreviewContainer}>
                    {displayTerms.length > 0 ? (
                        <FlatList
                            data={displayTerms}
                            renderItem={({ item }) => <FlipCard term={item} />}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                            keyExtractor={(item) => item.id}
                            style={styles.cardList}
                        />
                    ) : (
                        <BlurView intensity={20} tint="dark" style={[styles.mainCard, { width: width - 40 }]}>
                            <Text style={styles.emptyStateText}>No terms available</Text>
                        </BlurView>
                    )}
                    <View style={styles.paginationDots}>
                        {displayTerms.length > 0 && displayTerms.map((_, i) => (
                            <View
                                key={i}
                                style={[styles.dot, i === currentCardIndex && styles.activeDot]}
                            />
                        ))}
                    </View>
                </View>

                {/* Deck Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.deckTitle}>
                        {title}
                    </Text>
                    <Text style={styles.termCountSmall}>{terms.length} terms</Text>
                </View>

                {/* Study Modes */}
                <View style={styles.modesSection}>
                    {displayedModes.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={styles.modeButton}
                            activeOpacity={0.7}
                            onPress={() => handleStudyModePress(mode.id)}
                        >
                            <View style={[styles.modeIconContainer, { backgroundColor: mode.color }]}>
                                <Ionicons name={mode.icon as any} size={20} color="white" />
                            </View>
                            <Text style={styles.modeLabel}>{mode.label}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.showMoreButton}
                        onPress={() => setShowAllModes(!showAllModes)}
                    >
                        <Text style={styles.showMoreText}>
                            {showAllModes ? 'Show less' : 'Show more study modes'}
                        </Text>
                        <Ionicons
                            name={showAllModes ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={Colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Sticky Terms Header */}
                <View style={styles.stickyHeaderWrapper}>
                    <View style={styles.termsHeader}>
                        <Text style={styles.termsTitle}>Terms</Text>
                        <TouchableOpacity style={styles.filterButton} onPress={toggleSortOrder}>
                            <Text style={styles.filterText}>{sortOrder === 'original' ? 'Original' : 'A-Z'}</Text>
                            <Ionicons name="options-outline" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Terms List Container */}
                <View>
                    {displayTerms.map((term) => (
                        <View key={term.id} style={styles.termCard}>
                            <View style={styles.termCardHeader}>
                                <TouchableOpacity onPress={() => console.log(`Speak: ${term.front}`)}>
                                    <Ionicons name="volume-medium-outline" size={22} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => toggleStar(term.id)}>
                                    <Ionicons
                                        name={starredTerms.includes(term.id) ? "star" : "star-outline"}
                                        size={22}
                                        color={starredTerms.includes(term.id) ? "#FFD700" : "white"}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.termQuestion}>{term.front}</Text>
                            <Text style={styles.termAnswer}>{term.back}</Text>
                        </View>
                    ))}
                </View>
            </Animated.ScrollView>

            {/* Animated Sticky Footer */}
            <Animated.View
                style={[
                    styles.footer,
                    {
                        paddingBottom: insets.bottom + 10,
                        transform: [
                            { translateY: footerTranslateY },
                            { scale: footerScale }
                        ],
                        opacity: footerOpacity
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.studyMainButton}
                    activeOpacity={0.8}
                    onPress={() => openActionSheet('study')}
                >
                    <LinearGradient
                        colors={['#0EA5E9', '#0284C7']}
                        style={styles.gradient}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="sparkles" size={20} color="white" />
                            <Text style={styles.studyMainText}>Study this set</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
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
        zIndex: 100,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trialPill: {
        backgroundColor: '#FACC15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trialText: {
        color: '#1E293B',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    cardPreviewContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    mainCard: {
        width: '100%',
        height: 240,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardText: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 30,
    },
    expandIcon: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    paginationDots: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    activeDot: {
        backgroundColor: 'white',
        width: 12,
    },
    infoSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    deckTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        lineHeight: 26,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    authorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    authorName: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
    },
    divider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 12,
    },
    termCount: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.6)',
    },
    termCountSmall: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.4)',
        marginTop: 6,
    },
    stickyHeaderWrapper: {
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    modesSection: {
        paddingHorizontal: 20,
        marginTop: 30,
        gap: 10,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    modeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modeLabel: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    showMoreText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: Colors.primary,
    },
    termsSection: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    termsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    termsTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
    },
    termCard: {
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    termCardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginBottom: 10,
    },
    termQuestion: {
        fontSize: 17,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
        lineHeight: 24,
    },
    termAnswer: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 12,
        lineHeight: 22,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: 'transparent',
    },
    studyMainButton: {
        height: 60,
        borderRadius: 30,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    gradient: {
        flex: 1,
        borderRadius: 30, // Must match parent for perfect edges
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5, // Slightly thicker for definition
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    studyMainText: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    cardAnswerText: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.8)',
    },
    cardItemContainer: {
        width: width,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    flipCardWrapper: {
        width: '100%',
        height: 240,
    },
    flipCardInner: {
        width: '100%',
        height: '100%',
    },
    cardBack: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    cardList: {
        width: width,
    },
    cardTextWrapper: {
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.3)',
    },
});
