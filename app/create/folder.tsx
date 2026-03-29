import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import { dbProvider } from '@/services/database';

const FOLDER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#F43F5E'];

export default function CreateFolderScreen() {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

    const handleCreate = async () => {
        if (!title.trim()) return;
        await dbProvider.createFolder(title, selectedColor, 'folder');
        router.back();
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
                        <Text style={styles.headerTitle}>New Folder</Text>
                        <TouchableOpacity
                            onPress={handleCreate}
                            style={[styles.createButton, !title.trim() && styles.disabledButton]}
                            disabled={!title.trim()}
                        >
                            <Text style={styles.createText}>Create</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="Folder Name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                            />
                        </View>

                        <Text style={styles.sectionLabel}>Select Color</Text>
                        <View style={styles.colorGrid}>
                            {FOLDER_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorItem,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.selectedColorItem
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                />
                            ))}
                        </View>
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
        marginBottom: 30,
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
    createButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    disabledButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    createText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 14,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    inputSection: {
        marginBottom: 40,
    },
    input: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    colorItem: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    selectedColorItem: {
        borderWidth: 3,
        borderColor: 'white',
    },
});
