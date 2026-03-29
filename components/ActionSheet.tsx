import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    Modal,
    Alert,
    Share,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActionSheet } from '@/context/ActionSheetContext';
import { useSettings } from '@/context/SettingsContext';
import { Colors } from '@/constants/Theme';
import { router } from 'expo-router';
import { dbProvider } from '@/services/database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STUDY_MODES = [
    { id: 'flashcards', label: 'Flashcards', icon: 'layers-outline', color: '#4F46E5', subText: 'Study with digital cards', mciIcon: false },
    { id: 'learn', label: 'Learn', icon: 'school-outline', color: '#8B5CF6', subText: 'Personalized learning path', mciIcon: false },
    { id: 'test', label: 'Test', icon: 'document-text-outline', color: '#3B82F6', subText: 'Practice exam mode', mciIcon: false },
    { id: 'match', label: 'Match', icon: 'copy-outline', color: '#EC4899', subText: 'Speed matching game', mciIcon: false },
    { id: 'blast', label: 'Blast', icon: 'rocket-outline', color: '#F59E0B', subText: 'Rapid-fire review', mciIcon: false },
    { id: 'blocks', label: 'Blocks', icon: 'grid-outline', color: '#10B981', subText: 'Grid-based memory game', mciIcon: false },
] as const;

export default function ActionSheet() {
    const { isOpen, mode, title, targetId, targetType, onActionComplete, closeActionSheet } = useActionSheet();
    const { triggerHaptic } = useSettings();
    const translateY = useSharedValue(20);
    const opacity = useSharedValue(0);

    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
    const [renameText, setRenameText] = useState('');

    const sheetStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useEffect(() => {
        if (isOpen) {
            translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            translateY.value = withTiming(15, { duration: 250 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [isOpen]);

    useEffect(() => {
        if (title) setRenameText(title);
    }, [title]);

    const handleShare = async () => {
        if (!title || !targetType) return;
        try {
            triggerHaptic();
            const message = `Check out my ${targetType}: ${title} on viszmo!`;
            await Share.share({
                message: message,
                title: title,
            });
            closeActionSheet();
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleDelete = async () => {
        if (!targetId || !targetType) return;

        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete this ${targetType}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            triggerHaptic();
                            if (targetType === 'deck') {
                                await dbProvider.deleteDeck(targetId);
                            } else if (targetType === 'lecture') {
                                await dbProvider.deleteLectureNote(targetId);
                            } else if (targetType === 'folder') {
                                await dbProvider.deleteFolder(targetId);
                            }

                            if (onActionComplete) {
                                onActionComplete();
                            }

                            closeActionSheet();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete item.');
                        }
                    }
                }
            ]
        );
    };

    const handleRenameSave = async () => {
        if (!targetId || !targetType || !renameText.trim()) return;
        try {
            triggerHaptic();
            if (targetType === 'deck') {
                await dbProvider.updateDeck(targetId, { title: renameText.trim() });
            } else if (targetType === 'lecture') {
                await dbProvider.updateLectureNote(targetId, { title: renameText.trim() });
            } else if (targetType === 'folder') {
                await dbProvider.updateFolder(targetId, { title: renameText.trim() });
            }

            if (onActionComplete) {
                onActionComplete();
            }
            setIsRenameModalVisible(false);
            closeActionSheet();
        } catch (error) {
            console.error('Rename error:', error);
            Alert.alert('Error', 'Failed to rename item.');
        }
    };

    const renderCreateContent = () => (
        <>
            <Text style={styles.sectionHeader}>Create & Study</Text>
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={() => {
                        triggerHaptic();
                        closeActionSheet();
                        router.push('/create/flashcards');
                    }}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#4F46E5' }]}>
                        <MaterialCommunityIcons name="cards-outline" size={22} color="white" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.itemText}>Flashcard set</Text>
                        <Text style={styles.itemSubText}>Create or study terms</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.item, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                        triggerHaptic();
                        closeActionSheet();
                        router.push('/create/lecture');
                    }}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#0EA5E9' }]}>
                        <Ionicons name="mic-outline" size={22} color="white" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.itemText}>Lecture</Text>
                        <Text style={styles.itemSubText}>Record or hear lectures</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Organize</Text>
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.item, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                        triggerHaptic();
                        closeActionSheet();
                        router.push('/create/folder');
                    }}
                >
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                        <Ionicons name="folder-outline" size={22} color="white" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.itemText}>Folder</Text>
                        <Text style={styles.itemSubText}>Organize your sets</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
            </View>
        </>
    );

    const renderStudyContent = () => (
        <>
            <Text style={styles.sectionHeader}>Study Modes</Text>
            <View style={styles.section}>
                {STUDY_MODES.map((mode, index) => (
                    <TouchableOpacity
                        key={mode.id}
                        style={[
                            styles.item,
                            index === STUDY_MODES.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                            triggerHaptic();
                            closeActionSheet();
                            router.push({
                                pathname: '/(tabs)/solve',
                                params: { mode: mode.id }
                            } as any);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: mode.color }]}>
                            <Ionicons name={mode.icon as any} size={22} color="white" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.itemText}>{mode.label}</Text>
                            <Text style={styles.itemSubText}>{mode.subText}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    const renderOptionsContent = () => (
        <>
            <View style={styles.optionsHeader}>
                <Text style={styles.optionsTitle}>{title || 'Options'}</Text>
            </View>
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={() => {
                        triggerHaptic();
                        setRenameText(title || '');
                        setIsRenameModalVisible(true);
                    }}
                >
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                        <Ionicons name="pencil-outline" size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemText, { color: Colors.primary }]}>Rename</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={handleShare}
                >
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Ionicons name="share-outline" size={22} color="#10B981" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemText, { color: '#10B981' }]}>Share</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.item, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={handleDelete}
                >
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemText, { color: '#EF4444' }]}>Delete</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderMainContent = () => {
        switch (mode) {
            case 'create':
                return renderCreateContent();
            case 'study':
                return renderStudyContent();
            case 'options':
                return renderOptionsContent();
            default:
                return renderCreateContent();
        }
    };

    return (
        <>
            <View
                style={[
                    styles.overlay,
                    { pointerEvents: isOpen ? 'auto' : 'none' }
                ]}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={closeActionSheet}
                >
                    <Animated.View style={[styles.backdropBackground, backdropStyle]} />
                </Pressable>

                <Animated.View
                    style={[
                        styles.sheet,
                        sheetStyle,
                        { paddingBottom: 60 }
                    ]}
                >
                    <View style={styles.content}>
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>

                        <View style={styles.mainContainer}>
                            {renderMainContent()}
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Rename Popup Modal */}
            <Modal
                visible={isRenameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsRenameModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setIsRenameModalVisible(false)}
                    />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename {targetType || 'Item'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={renameText}
                            onChangeText={setRenameText}
                            placeholder="Enter new name..."
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleRenameSave}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsRenameModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleRenameSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
    },
    content: {
        width: '100%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    mainContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
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
    sectionHeader: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255, 255, 255, 0.3)',
        marginLeft: 12,
        marginBottom: 8,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 16,
        marginTop: 4,
    },
    optionsTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    modalInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    saveButton: {
        backgroundColor: Colors.primary,
    },
    cancelButtonText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    },
});
