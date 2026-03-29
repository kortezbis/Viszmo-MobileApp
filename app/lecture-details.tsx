import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { BlurView } from 'expo-blur';

import { useActionSheet } from '@/context/ActionSheetContext';
import { dbProvider } from '@/services/database';
import { LectureNote } from '@/types/database';

const { width } = Dimensions.get('window');

export default function LectureDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { id, title: searchTitle = 'Untitled Lecture' } = useLocalSearchParams<{ id: string; title?: string }>();
    const { openActionSheet } = useActionSheet();

    const [note, setNote] = useState<LectureNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAIOverlay, setShowAIOverlay] = useState(false);
    const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'glossary'>('transcript');

    const translateY = useRef(new Animated.Value(20)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // ── Load note ─────────────────────────────────────────
    const fetchNote = async () => {
        if (!id) return;
        setIsLoading(true);
        const fetched = await dbProvider.getLectureNoteById(id);
        if (fetched) setNote(fetched);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchNote();
    }, [id]);

    // ── AI Overlay animation ──────────────────────────────
    useEffect(() => {
        if (showAIOverlay) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, friction: 9, tension: 40, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 15, duration: 250, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [showAIOverlay]);

    // ── Helpers ───────────────────────────────────────────
    const title = note?.title || (searchTitle as string);
    const hasTranscript = note && note.content && note.content.length > 0;
    const hasSummary = note && (note.summary || note.keyTakeaways?.length);
    const hasGlossary = note && note.glossary && note.glossary.length > 0;

    const tabsToShow = [
        { key: 'transcript', label: 'Transcript' },
        ...(hasSummary ? [{ key: 'summary', label: 'Summary' }] : []),
        ...(hasGlossary ? [{ key: 'glossary', label: 'Glossary' }] : []),
    ] as { key: 'transcript' | 'summary' | 'glossary'; label: string }[];

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => openActionSheet('options', title, id, 'lecture', fetchNote)}
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {/* ── Loading ── */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>Loading note…</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                >
                    {/* Date badge */}
                    {note?.date && (
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.dateText}>{note.date}</Text>
                        </View>
                    )}

                    {/* ── Tab switcher ── */}
                    <View style={styles.tabContainer}>
                        {tabsToShow.map(tab => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Content ── */}
                    <View style={styles.contentContainer}>

                        {/* TRANSCRIPT TAB */}
                        {activeTab === 'transcript' && (
                            hasTranscript ? (
                                <Text style={styles.transcriptionText}>{note!.content}</Text>
                            ) : (
                                <View style={styles.emptyTab}>
                                    <Ionicons name="mic-off-outline" size={36} color="rgba(255,255,255,0.15)" />
                                    <Text style={styles.emptyTabText}>No transcript available</Text>
                                    <Text style={styles.emptyTabSub}>Record a new lecture to capture the transcript.</Text>
                                </View>
                            )
                        )}

                        {/* SUMMARY TAB */}
                        {activeTab === 'summary' && hasSummary && (
                            <View>
                                {note!.summary && (
                                    <>
                                        <Text style={styles.sectionTitle}>Overview</Text>
                                        <Text style={styles.transcriptionText}>{note!.summary}</Text>
                                    </>
                                )}

                                {note!.keyTakeaways && note!.keyTakeaways.length > 0 && (
                                    <>
                                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Key Takeaways</Text>
                                        {note!.keyTakeaways.map((point, i) => (
                                            <View key={i} style={styles.takeawayRow}>
                                                <View style={styles.bullet} />
                                                <Text style={styles.takeawayText}>{point}</Text>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </View>
                        )}

                        {/* GLOSSARY TAB */}
                        {activeTab === 'glossary' && hasGlossary && (
                            <View style={styles.glossaryList}>
                                {note!.glossary!.map((entry, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.glossaryEntry,
                                            i === note!.glossary!.length - 1 && { borderBottomWidth: 0 }
                                        ]}
                                    >
                                        <Text style={styles.glossaryTerm}>{entry.term}</Text>
                                        <Text style={styles.glossaryDefinition}>{entry.definition}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                    </View>
                </ScrollView>
            )}

            {/* ── FAB ── */}
            {!isLoading && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 20 }]}
                    onPress={() => setShowAIOverlay(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="sparkles" color="white" size={24} />
                </TouchableOpacity>
            )}

            {/* ── Study Assistant Overlay ── */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 1000, pointerEvents: showAIOverlay ? 'auto' : 'none' }]}>
                <Pressable style={styles.overlayBackdrop} onPress={() => setShowAIOverlay(false)}>
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity }]} />
                </Pressable>

                <Animated.View
                    style={[
                        { position: 'absolute', bottom: 0, left: 0, right: 0 },
                        { opacity, transform: [{ translateY }] },
                    ]}
                >
                    <BlurView intensity={60} tint="dark" style={[styles.aiOverlay, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.overlayHeader}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.overlayTitle}>Study Assistant</Text>
                        </View>

                        <View style={styles.section}>
                            <TouchableOpacity style={styles.item} activeOpacity={0.7}>
                                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                                    <Ionicons name="chatbubbles" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Chat with Note</Text>
                                    <Text style={styles.itemSubText}>Ask questions about this lecture</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
                                <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                                    <Ionicons name="sparkles" size={20} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.itemText}>Create Flashcards</Text>
                                    <Text style={styles.itemSubText}>Turn this note into a study deck</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.4)',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    dateText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.4)',
    },
    activeTabText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    contentContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    transcriptionText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 28,
    },
    sectionTitle: {
        fontSize: 17,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 14,
    },
    takeawayRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 9,
        flexShrink: 0,
    },
    takeawayText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.82)',
        lineHeight: 24,
    },
    glossaryList: {
        gap: 0,
    },
    glossaryEntry: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    glossaryTerm: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-Bold',
        color: Colors.primary,
        marginBottom: 6,
    },
    glossaryDefinition: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 22,
    },
    emptyTab: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 10,
    },
    emptyTabText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.25)',
    },
    emptyTabSub: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
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
});
