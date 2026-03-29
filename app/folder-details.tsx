import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Alert, Modal, TextInput, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import AppBackground from '@/components/AppBackground';
import { dbProvider } from '@/services/database';
import { Deck, LectureNote } from '@/types/database';
import { LinearGradient } from 'expo-linear-gradient';

import { useActionSheet } from '@/context/ActionSheetContext';

export default function FolderDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { id, title, color } = useLocalSearchParams<{ id: string, title: string, color: string }>();
    const { openActionSheet } = useActionSheet();

    const [activeTab, setActiveTab] = useState<'decks' | 'lectures'>('decks');
    const [decks, setDecks] = useState<Deck[]>([]);
    const [notes, setNotes] = useState<LectureNote[]>([]);
    const [displayTitle, setDisplayTitle] = useState(title || '');
    const fetchData = useCallback(async () => {
        if (!id) return;
        const [d, n, folder] = await Promise.all([
            dbProvider.getDecksByFolder(id),
            dbProvider.getNotesByFolder(id),
            dbProvider.getFolderById(id)
        ]);
        setDecks(d);
        setNotes(n);
        if (folder) setDisplayTitle(folder.title);
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleTabPress = (tab: 'decks' | 'lectures') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const handleMorePress = () => {
        openActionSheet('options', displayTitle, id, 'folder', fetchData);
    };

    const handleOptionsPress = (item: any, type: 'deck' | 'lecture') => {
        openActionSheet('options', item.title, item.id, type, fetchData);
    };

    return (
        <AppBackground>
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <View style={[styles.folderDot, { backgroundColor: color || '#3B82F6' }]} />
                        <Text style={styles.headerTitle}>{displayTitle}</Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'decks' && styles.activeTab]}
                        onPress={() => handleTabPress('decks')}
                    >
                        <Text style={[styles.tabText, activeTab === 'decks' && styles.activeTabText]}>Decks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'lectures' && styles.activeTab]}
                        onPress={() => handleTabPress('lectures')}
                    >
                        <Text style={[styles.tabText, activeTab === 'lectures' && styles.activeTabText]}>Lectures</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {activeTab === 'decks' && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} exiting={FadeOutDown.duration(200)}>
                            {decks.length > 0 ? decks.map((deck) => (
                                <TouchableOpacity
                                    key={deck.id}
                                    style={styles.card}
                                    onPress={() => router.push({ pathname: '/deck-details', params: { id: deck.id } })}
                                >
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{deck.title}</Text>
                                        <Text style={styles.cardSubText}>{deck.cardCount} terms</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleOptionsPress(deck, 'deck')}
                                        style={styles.optionsButton}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.2)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No decks in this folder</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => router.push('/create/flashcards')}
                                    >
                                        <Text style={styles.addButtonText}>Add your first deck</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'lectures' && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} exiting={FadeOutDown.duration(200)}>
                            {notes.length > 0 ? notes.map((note) => (
                                <TouchableOpacity
                                    key={note.id}
                                    style={styles.card}
                                    onPress={() => router.push({ pathname: '/lecture-details', params: { id: note.id } })}
                                >
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{note.title}</Text>
                                        <Text style={styles.cardSubText}>{note.date}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleOptionsPress(note, 'lecture')}
                                        style={styles.optionsButton}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.2)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No lectures in this folder</Text>
                                    <TouchableOpacity
                                        style={styles.addButtonContainer}
                                        onPress={() => router.push('/create/lecture')}
                                    >
                                        <LinearGradient
                                            colors={['#0EA5E9', '#0284C7']}
                                            style={styles.addButton}
                                        >
                                            <Text style={styles.addButtonText}>Record a lecture</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </ScrollView>
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    folderDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
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
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.4)',
    },
    activeTabText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 4,
    },
    cardSubText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: 20,
    },
    addButtonContainer: {
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
    },
    addButton: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    saveButton: {
        backgroundColor: Colors.primary,
    },
    cancelButtonText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 14,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 14,
    },
    optionsButton: {
        padding: 8,
        marginRight: -8,
    },
});
