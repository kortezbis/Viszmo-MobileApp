import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, SafeAreaView, Animated, Dimensions, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 80;
const ages = Array.from({ length: 88 }, (_, i) => i + 13);
const INITIAL_AGE = 18;
const INITIAL_INDEX = ages.indexOf(INITIAL_AGE);

const AGE_ITEM_HEIGHT = 36;

const AgeOdometer = ({ age }: { age: number }) => {
    const translateY = useRef(new Animated.Value(-INITIAL_INDEX * AGE_ITEM_HEIGHT)).current;

    useEffect(() => {
        const index = ages.indexOf(age);
        if (index !== -1) {
            Animated.spring(translateY, {
                toValue: -index * AGE_ITEM_HEIGHT,
                useNativeDriver: true,
                tension: 250,
                friction: 25
            }).start();
        }
    }, [age]);

    return (
        <View style={{ height: AGE_ITEM_HEIGHT, overflow: 'hidden' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
                {ages.map((a) => (
                    <Text
                        key={a}
                        style={[
                            styles.odometerText,
                            { height: AGE_ITEM_HEIGHT, lineHeight: AGE_ITEM_HEIGHT }
                        ]}
                    >
                        {a}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};

export default function AgeEntryScreen() {
    const [age, setAge] = useState<number>(INITIAL_AGE);

    const scrollX = useRef(new Animated.Value(INITIAL_INDEX * ITEM_WIDTH)).current;
    const flatListRef = useRef<any>(null);
    const lastTrackedAge = useRef(INITIAL_AGE);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
    );

    useEffect(() => {
        const id = scrollX.addListener(({ value }) => {
            const index = Math.max(0, Math.min(ages.length - 1, Math.round(value / ITEM_WIDTH)));
            const newAge = ages[index];
            if (newAge !== lastTrackedAge.current) {
                lastTrackedAge.current = newAge;
                setAge(newAge);
                Haptics.selectionAsync();
            }
        });
        return () => scrollX.removeListener(id);
    }, []);

    const animValue = useRef(new Animated.Value(0)).current;
    const lineWidthAnim = useRef(new Animated.Value(0)).current;
    const lineOpacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        lineWidthAnim.setValue(0.2);
        lineOpacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(lineWidthAnim, {
                toValue: 1,
                tension: 80,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(lineOpacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, [age]);

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

    const handleFinish = () => {
        if (age < 13) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/(auth)/survey');
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#FFFFFF' }]}>
                <Animated.View style={[
                    { position: 'absolute', width: '150%', height: '150%', top: 0, left: '-25%' },
                    { transform: [{ translateY }, { scale }] }
                ]}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)', '#FFFFFF']}
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

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>How old are you?</Text>
                        <Text style={styles.subtitle}>We use this to personalize your learning experience.</Text>
                    </View>

                    <View style={styles.interactiveArea}>
                        <View style={styles.odometerContainer}>
                            <AgeOdometer age={age} />
                            <Text style={styles.odometerTextLabel}> Years Old</Text>
                        </View>

                        <View style={styles.wheelContainer}>
                            <Animated.View style={[styles.selectionHighlight, { transform: [{ scaleX: lineWidthAnim }], opacity: lineOpacityAnim }]} />
                            <Animated.FlatList
                                ref={flatListRef}
                                data={ages}
                                keyExtractor={(item: any) => item.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                bounces={false}
                                contentContainerStyle={{ paddingHorizontal: (width - 48) / 2 - (ITEM_WIDTH / 2) }}
                                snapToInterval={ITEM_WIDTH}
                                decelerationRate="fast"
                                onScroll={handleScroll}
                                getItemLayout={(data: any, index: number) => ({
                                    length: ITEM_WIDTH,
                                    offset: ITEM_WIDTH * index,
                                    index,
                                })}
                                initialScrollIndex={INITIAL_INDEX}
                                renderItem={({ item, index }: any) => {
                                    const inputRange = [
                                        (index - 1) * ITEM_WIDTH,
                                        index * ITEM_WIDTH,
                                        (index + 1) * ITEM_WIDTH,
                                    ];

                                    const scale = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [0.6, 1.0, 0.6],
                                        extrapolate: 'clamp'
                                    });

                                    const opacity = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [0.25, 1, 0.25],
                                        extrapolate: 'clamp'
                                    });

                                    return (
                                        <TouchableOpacity
                                            style={styles.wheelItem}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                flatListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
                                            }}
                                        >
                                            <Animated.Text style={[styles.wheelText, { transform: [{ scale }], opacity }]}>
                                                {item}
                                            </Animated.Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleFinish}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.gradient}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.helperText}>
                        You must be at least 13 years old. Your age will not be shown publicly.
                    </Text>
                </View>
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
        marginBottom: 48,
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
    interactiveArea: {
        alignItems: 'center',
        marginVertical: 40,
    },
    odometerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        height: AGE_ITEM_HEIGHT,
        overflow: 'hidden',
    },
    odometerText: {
        fontSize: 26,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#10b981',
        includeFontPadding: false,
    },
    odometerTextLabel: {
        fontSize: 26,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#10b981',
        includeFontPadding: false,
    },
    wheelContainer: {
        height: 140,
        justifyContent: 'center',
    },
    selectionHighlight: {
        position: 'absolute',
        bottom: 25,
        width: 32,
        height: 5,
        borderRadius: 4,
        backgroundColor: '#10b981',
        alignSelf: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    wheelItem: {
        width: 80,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelText: {
        fontSize: 56,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#1E293B',
    },
    button: {
        height: 56,
        borderRadius: 28,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
    },
    gradient: {
        flex: 1,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
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
