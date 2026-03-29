import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import { dbProvider } from '@/services/database';
import { generateFlashcards } from '@/services/gemini';
import CardCountPicker from '@/components/CardCountPicker';
import { checkAndConsume, clampCardCount, DEFAULT_CARD_COUNT } from '@/services/rateLimiter';

export default function YouTubeLinkScreen() {
    const insets = useSafeAreaInsets();
    const [url, setUrl] = useState('');
    const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!url.trim()) {
            Alert.alert('Missing Info', 'Please paste a YouTube URL or enter a topic.');
            return;
        }

        // Rate limit check
        const limit = await checkAndConsume();
        if (!limit.allowed) {
            Alert.alert('⏳ Slow down!', limit.reason);
            return;
        }

        const safeCount = clampCardCount(cardCount);
        setIsGenerating(true);
        try {
            const prompt = `A student wants to study from this YouTube video: "${url.trim()}"

Please extract the most likely educational topic from the URL text (look at words in the URL path like video titles), then generate exactly ${safeCount} flashcards covering the key concepts of that topic. Return no more than ${safeCount} cards.

If this appears to be a specific tutorial or lecture, generate cards that would cover what is typically taught in such content.`;

            const cards = await generateFlashcards(prompt);
            const capped = cards.slice(0, safeCount);

            // Try to extract title from URL (grab slug words) or use fallback
            const urlSlug = url.split('?')[0].split('/').pop() || '';
            const titleGuess = urlSlug.replace(/[-_]/g, ' ').trim() || 'YouTube Flashcards';
            const deckTitle = titleGuess.length > 4 ? titleGuess : 'YouTube Flashcards';

            const newDeck = await dbProvider.createDeck(deckTitle);
            await dbProvider.addFlashcards(newDeck.id, capped);

            Alert.alert('✅ Success!', `Generated ${capped.length} flashcards!`, [
                { text: 'View Decks', onPress: () => router.push('/(tabs)/library') },
                { text: 'Study Now', onPress: () => router.push({ pathname: '/deck-details', params: { id: newDeck.id, fromCreate: 'true' } as any }) }
            ]);
        } catch (error) {
            console.error('Generation error:', error);
            Alert.alert('Error', 'Failed to generate flashcards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AppBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>YouTube Link</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="logo-youtube" size={60} color="#EF4444" />
                        </View>

                        <Text style={styles.label}>YouTube URL or Topic</Text>
                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.input}
                                placeholder="https://youtube.com/... or just a topic"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={url}
                                onChangeText={setUrl}
                                autoFocus
                            />
                        </View>

                        <CardCountPicker value={cardCount} onChange={setCardCount} />

                        <Text style={styles.infoText}>Paste a YouTube URL or just type a topic — Gemini will extract the subject and generate a full study deck for you.</Text>

                        <TouchableOpacity
                            style={[styles.generateButton, (isGenerating || !url.trim()) && styles.disabledButton]}
                            onPress={handleGenerate}
                            disabled={isGenerating || !url.trim()}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="auto-fix" size={20} color="white" />
                                    <Text style={styles.generateText}>Generate {cardCount} AI Flashcards</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
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
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    content: {
        paddingHorizontal: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    label: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 24,
    },
    inputArea: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    input: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 40,
        lineHeight: 20,
    },
    generateButton: {
        height: 60,
        backgroundColor: Colors.primary,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    generateText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    }
});
