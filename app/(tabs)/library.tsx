import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, LayoutAnimation, Platform, UIManager, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import LibraryHeader from '@/components/LibraryHeader';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { dbProvider } from '@/services/database';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { useActionSheet } from '@/context/ActionSheetContext';

export default function LibraryScreen() {
    const { openActionSheet } = useActionSheet();
    const [activeTab, setActiveTab] = useState<'decks' | 'lectures' | 'folders'>('decks');
    const [refreshing, setRefreshing] = useState(false);
    const [decks, setDecks] = useState<any[]>([]);
    const [lectures, setLectures] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);

    const fetchLibraryData = useCallback(async () => {
        const [f, d, l] = await Promise.all([
            dbProvider.getFolders(),
            dbProvider.getDecks(),
            dbProvider.getLectureNotes()
        ]);
        setFolders(f);
        setDecks(d);
        setLectures(l);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLibraryData();
        }, [fetchLibraryData])
    );

    const handleTabPress = (tab: 'decks' | 'lectures' | 'folders') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
        if (tab === 'folders') fetchLibraryData();
    };

    const handleOptionsPress = (item: any, type: 'deck' | 'lecture' | 'folder') => {
        openActionSheet('options', item.title, item.id, type, fetchLibraryData);
    };

    return (
        <View style={styles.container}>
            <LibraryHeader />

            {/* Category Tab Switcher */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    <TouchableOpacity
                        style={[styles.pillButton, activeTab === 'decks' && styles.activePill]}
                        onPress={() => handleTabPress('decks')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, activeTab === 'decks' && styles.activePillText]}>Decks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pillButton, activeTab === 'lectures' && styles.activePill]}
                        onPress={() => handleTabPress('lectures')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, activeTab === 'lectures' && styles.activePillText]}>Lectures</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pillButton, activeTab === 'folders' && styles.activePill]}
                        onPress={() => handleTabPress('folders')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, activeTab === 'folders' && styles.activePillText]}>Folders</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            setRefreshing(true);
                            await fetchLibraryData();
                            setRefreshing(false);
                        }}
                        tintColor={Colors.white}
                        colors={[Colors.white]}
                    />
                }
            >
                <View style={styles.mainContent}>
                    {activeTab === 'decks' && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} exiting={FadeOutDown.duration(200)}>
                            <Text style={styles.sectionTitle}>Recently Studied Decks</Text>
                            {decks.length > 0 ? decks.map((deck, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.placeholderCard}
                                    onPress={() => router.push({ pathname: '/deck-details', params: { id: deck.id } })}
                                >
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{deck.title}</Text>
                                        <Text style={styles.cardSubText}>{deck.cardCount || 0} terms</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleOptionsPress(deck, 'deck')}
                                        style={styles.optionsButton}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No decks found</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'lectures' && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} exiting={FadeOutDown.duration(200)}>
                            <Text style={styles.sectionTitle}>Your Recorded Lectures</Text>
                            {lectures.length > 0 ? lectures.map((lecture, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.lectureCard}
                                    onPress={() => router.push({
                                        pathname: '/lecture-details',
                                        params: { id: lecture.id, title: lecture.title, date: lecture.date }
                                    })}
                                >
                                    <View style={styles.lectureIcon}>
                                        <Ionicons name="mic" size={20} color="#38BDF8" />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{lecture.title}</Text>
                                        <Text style={styles.cardSubText}>{lecture.date}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleOptionsPress(lecture, 'lecture')}
                                        style={styles.optionsButton}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No lectures recorded</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'folders' && (
                        <Animated.View entering={FadeInDown.duration(300).springify()} exiting={FadeOutDown.duration(200)}>
                            <Text style={styles.sectionTitle}>Your Folders</Text>
                            {folders.length > 0 ? folders.map((folder, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.folderCard}
                                    onPress={() => router.push({
                                        pathname: '/folder-details',
                                        params: { id: folder.id, title: folder.title, color: folder.colorHex }
                                    })}
                                >
                                    <View style={[styles.folderColorDot, { backgroundColor: folder.colorHex || '#3B82F6' }]} />
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{folder.title}</Text>
                                        <Text style={styles.cardSubText}>{folder.items || 0} items</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleOptionsPress(folder, 'folder')}
                                        style={styles.optionsButton}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No folders found</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    tabContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    tabScrollContent: {
        gap: 8,
        paddingRight: 20,
    },
    pillButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 85,
    },
    activePill: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    pillText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    activePillText: {
        color: Colors.white,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    mainContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: Colors.white,
        marginBottom: 12,
    },
    placeholderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    lectureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(30, 58, 138, 0.15)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.1)',
    },
    folderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
    lectureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    folderColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 16,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 10,
    },
    emptyStateText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.3)',
    },
    optionsButton: {
        padding: 8,
        marginRight: -8,
    },
});
