import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { dbProvider } from '@/services/database';
import { Folder } from '@/types/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FolderPickerProps {
    selectedFolderId?: string;
    onSelect: (folderId: string | undefined) => void;
}

export default function FolderPicker({ selectedFolderId, onSelect }: FolderPickerProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchFolders = async () => {
            const f = await dbProvider.getFolders();
            setFolders(f);
        };
        fetchFolders();
    }, []);

    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Add to Folder</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.pickerContent}>
                    {selectedFolder ? (
                        <>
                            <View style={[styles.folderDot, { backgroundColor: selectedFolder.colorHex || '#3B82F6' }]} />
                            <Text style={styles.folderName}>{selectedFolder.title}</Text>
                        </>
                    ) : (
                        <Text style={styles.placeholder}>No folder selected</Text>
                    )}
                </View>
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsVisible(false)} />
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Folder</Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.folderList} showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                style={styles.folderItem}
                                onPress={() => {
                                    onSelect(undefined);
                                    setIsVisible(false);
                                }}
                            >
                                <View style={[styles.folderDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]} />
                                <Text style={styles.folderItemText}>None</Text>
                                {selectedFolderId === undefined && (
                                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                )}
                            </TouchableOpacity>

                            {folders.map(folder => (
                                <TouchableOpacity
                                    key={folder.id}
                                    style={styles.folderItem}
                                    onPress={() => {
                                        onSelect(folder.id);
                                        setIsVisible(false);
                                    }}
                                >
                                    <View style={[styles.folderDot, { backgroundColor: folder.colorHex || '#3B82F6' }]} />
                                    <Text style={styles.folderItemText}>{folder.title}</Text>
                                    {selectedFolderId === folder.id && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    folderDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    folderName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    placeholder: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'rgba(255,255,255,0.3)',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '70%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    folderList: {
        marginTop: 10,
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    folderItemText: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
});
