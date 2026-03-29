import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import { dbProvider } from '@/services/database';

interface CardInput {
    front: string;
    back: string;
}

export default function ManualCreationScreen() {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [cards, setCards] = useState<CardInput[]>([{ front: '', back: '' }]);

    const addCard = () => {
        setCards([...cards, { front: '', back: '' }]);
    };

    const removeCard = (index: number) => {
        if (cards.length > 1) {
            const newCards = [...cards];
            newCards.splice(index, 1);
            setCards(newCards);
        }
    };

    const updateCard = (index: number, field: keyof CardInput, value: string) => {
        const newCards = [...cards];
        newCards[index][field] = value;
        setCards(newCards);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a name for your deck.');
            return;
        }

        const validCards = cards.filter(c => c.front.trim() && c.back.trim());
        if (validCards.length === 0) {
            Alert.alert('No Cards', 'Please add at least one complete card (front and back).');
            return;
        }

        try {
            const newDeck = await dbProvider.createDeck(title);
            await dbProvider.addFlashcards(newDeck.id, validCards);

            Alert.alert('Success', 'Your deck has been created!', [
                { text: 'View Library', onPress: () => router.push('/(tabs)/library') },
                { text: 'Study Now', onPress: () => router.push({ pathname: '/deck-details', params: { id: newDeck.id, fromCreate: 'true' } as any }) }
            ]);
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save flashcards.');
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
                        <Text style={styles.headerTitle}>Manual Creation</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
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

                        <View style={styles.cardsContainer}>
                            {cards.map((card, index) => (
                                <View key={index} style={styles.cardItem}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardIndex}>Card {index + 1}</Text>
                                        {cards.length > 1 && (
                                            <TouchableOpacity onPress={() => removeCard(index)}>
                                                <Ionicons name="trash-outline" size={20} color="#F87171" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.cardFields}>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Front (Term)"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={card.front}
                                            onChangeText={(val) => updateCard(index, 'front', val)}
                                            multiline
                                        />
                                        <View style={styles.fieldDivider} />
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Back (Definition)"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={card.back}
                                            onChangeText={(val) => updateCard(index, 'back', val)}
                                            multiline
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.addButton} onPress={addCard}>
                            <Ionicons name="add" size={24} color="white" />
                            <Text style={styles.addText}>Add Card</Text>
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
    saveText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: Colors.primary,
    },
    content: {
        paddingHorizontal: 20,
    },
    titleInput: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    cardsContainer: {
        marginTop: 10,
        gap: 20,
    },
    cardItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    cardIndex: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
    },
    cardFields: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardInput: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        paddingVertical: 12,
        minHeight: 50,
    },
    fieldDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 28,
        marginTop: 30,
        gap: 8,
    },
    addText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    }
});
