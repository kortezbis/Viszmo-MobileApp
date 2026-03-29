import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

const logoImg = require('@/assets/images/full-logo.png.png');

export default function EmailAuthScreen() {
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        if (!email.trim() || !email.includes('@')) {
            return; // Simple validation for now
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(auth)/username-entry');
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
                        colors={['rgba(14, 165, 233, 0.15)', 'rgba(14, 165, 233, 0.05)', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>What's your email?</Text>
                        <Text style={styles.subtitle}>Enter your email to continue with viszmo.</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="email@example.com"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            autoFocus
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, !email.includes('@') && styles.buttonDisabled]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        disabled={!email.includes('@')}
                    >
                        <LinearGradient
                            colors={!email.includes('@') ? ['#CBD5E1', '#94A3B8'] : ['#0EA5E9', '#0284C7']}
                            style={styles.gradient}
                        >
                            <Text style={styles.buttonText}>Continue</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        By continuing, you agree to viszmo's {'\n'}
                        <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
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
    },
    input: {
        height: 64,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    button: {
        height: 56,
        borderRadius: 28,
        shadowColor: '#0EA5E9',
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
    disclaimer: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
        lineHeight: 20,
    },
    link: {
        color: '#1E293B',
        fontFamily: 'Inter-Medium',
    }
});
