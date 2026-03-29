import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/AppBackground';
import CreateOption from '@/components/CreateOption';

export default function CreateFlashcardsScreen() {
    const insets = useSafeAreaInsets();

    const creationOptions = [
        {
            title: 'Manual',
            subtitle: 'Enter cards one by one manually.',
            icon: <Image source={require('@/assets/images/branding/manual.png.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />,
            route: '/create/manual' as const
        },
        {
            title: 'Upload / Photo',
            subtitle: 'Upload notes, PDFs, or photos from your camera.',
            icon: <Image source={require('@/assets/images/branding/pdf-document.png.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />,
            route: '/create/upload' as const
        },
        {
            title: 'Text / Paste',
            subtitle: 'Type out or paste your notes to generate cards.',
            icon: <Image source={require('@/assets/images/branding/size.png.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />,
            route: '/create/manual-text' as const
        },
        {
            title: 'YouTube',
            subtitle: 'Enter a YouTube topic or URL to generate from.',
            icon: <Image source={require('@/assets/images/branding/youtube.png.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />,
            route: '/create/youtube' as const
        },
        {
            title: 'Subject',
            subtitle: 'Enter a topic you want to study.',
            icon: <Image source={require('@/assets/images/branding/book.png.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />,
            route: '/create/subject' as const
        },
        {
            title: 'Record Lecture',
            subtitle: 'Record audio and get AI-generated notes.',
            icon: <Ionicons name="mic-outline" size={22} color="rgba(255,255,255,0.7)" />,
            route: '/create/lecture' as const
        },
    ];

    return (
        <AppBackground>
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Create</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionSubtitle}>Start by choosing your input method below:</Text>

                    <View style={styles.optionsGrid}>
                        {creationOptions.map((option, index) => (
                            <CreateOption
                                key={index}
                                title={option.title}
                                subtitle={option.subtitle}
                                icon={option.icon}
                                onPress={() => {
                                    router.push(option.route);
                                }}
                            />
                        ))}
                    </View>
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
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 24,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 16,
        lineHeight: 20,
    },
    optionsGrid: {
        gap: 0,
    }
});
