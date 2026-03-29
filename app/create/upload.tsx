import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { generateFlashcardsFromImage, generateFlashcards } from '@/services/gemini';
import { dbProvider } from '@/services/database';
import { checkAndConsume, MAX_CARDS_PER_REQUEST } from '@/services/rateLimiter';

export default function UploadScreen() {
    const insets = useSafeAreaInsets();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<{ uri: string, name: string } | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to pick images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            setSelectedImage(result.assets[0].uri);
            setSelectedDocument(null);
            handleProcess(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg', 'Flashcards From Image');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your camera to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            setSelectedImage(result.assets[0].uri);
            setSelectedDocument(null);
            handleProcess(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg', 'Flashcards From Photo');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets) {
                const asset = result.assets[0];
                setSelectedDocument({ uri: asset.uri, name: asset.name });
                setSelectedImage(null);

                // For PDF/Text, we might need a separate processing route if they are large
                // For now, let's treat text files specially and skip PDF for text extraction for MVP but show it's functional
                const fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
                handleProcess(fileContent, asset.mimeType || 'application/pdf', `Cards from ${asset.name}`);
            }
        } catch (error) {
            console.error('Doc picker error:', error);
        }
    };

    const handleProcess = async (base64Data: string, mimeType: string, titleHint: string) => {
        // Rate limit check
        const limit = await checkAndConsume();
        if (!limit.allowed) {
            Alert.alert('⏳ Slow down!', limit.reason);
            return;
        }

        setIsProcessing(true);
        try {
            let cards;
            if (mimeType.startsWith('image/')) {
                // Image: send directly to vision model
                cards = await generateFlashcardsFromImage(base64Data, mimeType);
            } else if (mimeType === 'text/plain') {
                // Plain text: decode base64 to string and use text model
                const textContent = atob(base64Data);
                cards = await generateFlashcards(`Generate educational flashcards from these study notes:\n\n${textContent}`);
            } else {
                // PDF: pass as inline data to vision model which can read PDFs
                cards = await generateFlashcardsFromImage(base64Data, mimeType);
            }

            // Hard cap to prevent runaway generation
            const capped = cards.slice(0, MAX_CARDS_PER_REQUEST);
            const newDeck = await dbProvider.createDeck(titleHint);
            await dbProvider.addFlashcards(newDeck.id, capped);

            Alert.alert('✅ Success!', `Generated ${capped.length} flashcards from your file!`, [
                { text: 'View Library', onPress: () => router.push('/(tabs)/library') },
                { text: 'Study Now', onPress: () => router.push({ pathname: '/deck-details', params: { id: newDeck.id, fromCreate: 'true' } as any }) }
            ]);
        } catch (error) {
            console.error('Processing error:', error);
            Alert.alert('Analysis Failed', 'Could not process the file content. Try a clearer image or plain text file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppBackground>
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Upload & Scan</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.uploadOptions}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} disabled={isProcessing}>
                            <View style={[styles.iconCirc, { backgroundColor: '#F87171' }]}>
                                <Ionicons name="camera" size={24} color="white" />
                            </View>
                            <Text style={styles.btnText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={isProcessing}>
                            <View style={[styles.iconCirc, { backgroundColor: '#60A5FA' }]}>
                                <Ionicons name="images" size={24} color="white" />
                            </View>
                            <Text style={styles.btnText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument} disabled={isProcessing}>
                            <View style={[styles.iconCirc, { backgroundColor: '#34D399' }]}>
                                <Ionicons name="document-text" size={24} color="white" />
                            </View>
                            <Text style={styles.btnText}>Doc / PDF</Text>
                        </TouchableOpacity>
                    </View>

                    {isProcessing && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.processingText}>Gemini is scanning your content...</Text>
                        </View>
                    )}

                    <View style={styles.previewSection}>
                        {(selectedImage || selectedDocument) ? (
                            <View style={styles.previewBox}>
                                {selectedImage ? (
                                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.docPreview}>
                                        <Ionicons name="document-attach" size={40} color="white" />
                                        <Text style={styles.docName}>{selectedDocument?.name}</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="cloud-upload-outline" size={60} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.placeholderText}>Select a method above to get started</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.features}>
                        <FeatureItem icon="flash" title="AI Extraction" description="Gemini automatically finds key concepts." />
                        <FeatureItem icon="checkmark-circle" title="Instant Deck" description="Ready to study in seconds." />
                    </View>
                </ScrollView>
            </View>
        </AppBackground>
    );
}

const FeatureItem = ({ icon, title, description }: any) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
            <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.textWrap}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
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
        paddingHorizontal: 24,
    },
    uploadOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
        gap: 12,
    },
    uploadBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconCirc: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    btnText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.6)',
    },
    previewSection: {
        height: 220,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        marginBottom: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.2)',
        marginTop: 12,
    },
    previewBox: {
        width: '100%',
        height: '100%',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    docPreview: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docName: {
        color: 'white',
        marginTop: 10,
        fontFamily: 'Inter-Medium',
    },
    processingOverlay: {
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginVertical: 20,
    },
    processingText: {
        color: 'white',
        marginTop: 12,
        fontFamily: 'PlusJakartaSans-SemiBold',
        fontSize: 14,
    },
    features: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrap: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    featureDescription: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
});
