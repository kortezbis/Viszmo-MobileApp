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

export default function ManualTextScreen() {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Missing Info', 'Please provide a title and content to generate flashcards.');
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
            const prompt = `Deck Title: "${title}"\n\nGenerate exactly ${safeCount} flashcards from the following content. Return no more than ${safeCount} cards.\n\nContent:\n${content}`;
            const cards = await generateFlashcards(prompt);
            const capped = cards.slice(0, safeCount);

            if (capped.length === 0) {
                Alert.alert('No Cards Generated', 'Gemini could not extract enough content. Try adding more detailed notes.');
                return;
            }

            const newDeck = await dbProvider.createDeck(title);
            await dbProvider.addFlashcards(newDeck.id, capped);

            Alert.alert('✅ Success!', `Created ${capped.length} flashcards from your notes!`, [
                { text: 'View Library', onPress: () => router.push('/(tabs)/library') },
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
                        <Text style={styles.headerTitle}>Paste Notes</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Deck Title"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Paste your study notes or raw text here..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={content}
                                onChangeText={setContent}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <CardCountPicker value={cardCount} onChange={setCardCount} />

                        <TouchableOpacity
                            style={[styles.generateButton, (isGenerating || !content.trim() || !title.trim()) && styles.disabledButton]}
                            onPress={handleGenerate}
                            disabled={isGenerating || !content.trim() || !title.trim()}
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
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    titleInput: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    inputArea: {
        minHeight: 220,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
    },
    textArea: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        lineHeight: 24,
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
