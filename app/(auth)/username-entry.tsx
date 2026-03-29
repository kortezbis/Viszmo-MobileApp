import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const logoImg = require('@/assets/images/full-logo.png.png');

export default function UsernameEntryScreen() {
    const [username, setUsername] = useState('');

    const handleContinue = () => {
        if (username.length < 5) return;
        router.push('/(auth)/age-entry');
    };

    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: 10000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -100]
    });

    const scale = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2]
    });

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#FFFFFF' }]}>
                <Animated.View style={[
                    { position: 'absolute', width: '150%', height: '150%', top: 0, left: '-25%' },
                    { transform: [{ translateY }, { scale }] }
                ]}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Pick a username</Text>
                        <Text style={styles.subtitle}>This is how your friends will find you on viszmo.</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.atSymbolContainer}>
                            <Text style={styles.atSymbol}>@</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="username"
                            placeholderTextColor="#94A3B8"
                            value={username}
                            onChangeText={setUsername}
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, username.length < 5 && styles.buttonDisabled]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        disabled={username.length < 5}
                    >
                        <LinearGradient
                            colors={username.length < 5 ? ['#CBD5E1', '#94A3B8'] : ['#8b5cf6', '#6d28d9']}
                            style={styles.gradient}
                        >
                            <Text style={styles.buttonText}>Continue</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.helperText}>
                        At least 5 characters. You can change this later.
                    </Text>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    safeArea: {
        flex: 1,
    },
    backButton: {
        padding: 20,
        zIndex: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    header: {
        marginBottom: 32,
    },
    logoImage: {
        width: 80,
        height: 24,
        marginBottom: 24,
        tintColor: '#000000',
    },
    title: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#64748B',
    },
    inputWrapper: {
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 20,
    },
    atSymbolContainer: {
        marginRight: 4,
    },
    atSymbol: {
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: '#94A3B8',
    },
    input: {
        flex: 1,
        height: 64,
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: '#1E293B',
    },
    button: {
        height: 56,
        borderRadius: 28,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    gradient: {
        flex: 1,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    helperText: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
    }
});
