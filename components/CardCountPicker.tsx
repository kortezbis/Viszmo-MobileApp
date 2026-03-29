/**
 * CardCountPicker
 * A pill-style selector for how many flashcards to generate.
 * Shows quick-pick options from CARD_COUNT_OPTIONS.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CARD_COUNT_OPTIONS } from '@/services/rateLimiter';
import { Colors } from '@/constants/Theme';

interface Props {
    value: number;
    onChange: (count: number) => void;
}

export default function CardCountPicker({ value, onChange }: Props) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>Flashcards to generate</Text>
                <Text style={styles.valueDisplay}>{value}</Text>
            </View>
            <View style={styles.pillRow}>
                {CARD_COUNT_OPTIONS.map((count) => {
                    const selected = value === count;
                    return (
                        <TouchableOpacity
                            key={count}
                            style={[styles.pill, selected && styles.pillActive]}
                            onPress={() => onChange(count)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                                {count}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.6)',
    },
    valueDisplay: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    pillRow: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pillText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.5)',
    },
    pillTextActive: {
        color: 'white',
    },
});
