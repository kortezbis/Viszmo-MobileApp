import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import { useActionSheet } from '@/context/ActionSheetContext';
import { useSubscription } from '@/context/SubscriptionContext';

const { width } = Dimensions.get('window');

export default function LibraryHeader() {
    const insets = useSafeAreaInsets();
    const { openActionSheet } = useActionSheet();
    const { showPaywall } = useSubscription();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <View style={styles.content}>
                <Text style={styles.title}>Library</Text>

                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.trialPill} onPress={showPaywall}>
                        <Text style={styles.trialText}>Free trial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => openActionSheet()}>
                        <Ionicons name="add" size={26} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        paddingHorizontal: 20,
        paddingBottom: 10,
        zIndex: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 34,
        fontFamily: 'PlusJakartaSans-Bold',
        color: Colors.white,
        letterSpacing: -0.5,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trialPill: {
        height: 32,
        paddingHorizontal: 12,
        backgroundColor: '#FACC15',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trialText: {
        color: '#1E293B',
        fontSize: 11,
        fontFamily: 'PlusJakartaSans-Bold',
    },
});
