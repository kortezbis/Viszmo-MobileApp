import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '@/constants/Theme';

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const bgAnim = useRef(new Animated.Value(0)).current;
    const entranceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.spring(entranceAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: false, // Color interpolation requires false
        }).start();

        // Background loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgAnim, {
                    toValue: 1,
                    duration: 25000,
                    useNativeDriver: true,
                }),
                Animated.timing(bgAnim, {
                    toValue: 0,
                    duration: 25000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const handleSignIn = () => {
        // Navigate to tabs for now
        router.replace('/(tabs)');
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [
                            { scale: 1.2 },
                            {
                                translateX: bgAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 20]
                                })
                            },
                            {
                                translateY: bgAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 20]
                                })
                            }
                        ]
                    }
                ]}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#F1F5F9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <Animated.View style={[styles.header, {
                        opacity: entranceAnim,
                        transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                    }]}>
                        <View style={styles.logoPlaceholder}>
                            <Ionicons name="flash" size={40} color={Colors.primary} />
                        </View>
                        <Animated.Text style={[styles.title, {
                            color: entranceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['#CBD5E1', '#1A1C1E'] // Light gray to Charcoal Black
                            })
                        }]}>Welcome back</Animated.Text>
                        <Animated.Text style={[styles.subtitle, {
                            color: entranceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['#E2E8F0', '#475569'] // Silky gray to Slate
                            })
                        }]}>Sign in to continue your journey</Animated.Text>
                    </Animated.View>

                    <Animated.View style={[styles.form, {
                        opacity: entranceAnim,
                        transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
                    }]}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#475569',
    },
    form: {
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontFamily: 'Inter-Regular',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: Colors.primary,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: Colors.textMuted,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    linkText: {
        color: Colors.primary,
        fontFamily: 'Inter-Bold',
        fontSize: 14,
    },
});
