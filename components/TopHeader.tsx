import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Dimensions, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import { router } from 'expo-router';
import { useSubscription } from '@/context/SubscriptionContext';

const { width } = Dimensions.get('window');

export default function TopHeader() {
    const insets = useSafeAreaInsets();
    const { showPaywall } = useSubscription();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.content}>
                {/* Left: Free Trial Pill */}
                <TouchableOpacity style={styles.trialPill} onPress={showPaywall}>
                    <Text style={styles.trialText}>Free Trial</Text>
                </TouchableOpacity>

                {/* Right: Avatar */}
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => router.push('/profile')}
                >
                    <Image
                        source={{ uri: 'https://i.pravatar.cc/150?u=viszmo' }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        paddingHorizontal: 20,
        paddingBottom: 12,
        zIndex: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    trialPill: {
        height: 36,
        paddingHorizontal: 16,
        backgroundColor: '#FACC15',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    trialText: {
        color: '#1E293B',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        letterSpacing: 0.2,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
});
