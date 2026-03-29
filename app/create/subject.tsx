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

export default function SubjectScreen() {
    const insets = useSafeAreaInsets();
    const [subject, setSubject] = useState('');
    const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!subject.trim()) {
            Alert.alert('Missing Info', 'Please enter a topic to study.');
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
            const prompt = `Generate exactly ${safeCount} flashcards for the topic: "${subject}". Return no more than ${safeCount} cards.`;
            const cards = await generateFlashcards(prompt);
            const capped = cards.slice(0, safeCount);

            const newDeck = await dbProvider.createDeck(subject);
            await dbProvider.addFlashcards(newDeck.id, capped);

            Alert.alert('✅ Success!', `Generated ${capped.length} flashcards on ${subject}!`, [
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
                        <Text style={styles.headerTitle}>Study Topic</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.label}>What do you want to learn today?</Text>
                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Photosynthesis, Binary Search, SQL Joins..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={subject}
                                onChangeText={setSubject}
                                autoFocus
                            />
                        </View>

                        <CardCountPicker value={cardCount} onChange={setCardCount} />

                        <Text style={styles.infoText}>Gemini will generate a structured study deck for you instantly based on this topic.</Text>

                        <TouchableOpacity
                            style={[styles.generateButton, (isGenerating || !subject.trim()) && styles.disabledButton]}
                            onPress={handleGenerate}
                            disabled={isGenerating || !subject.trim()}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="auto-fix" size={20} color="white" />
                                    <Text style={styles.generateText}>Generate {cardCount} Cards</Text>
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
        fontSize: 18,
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
