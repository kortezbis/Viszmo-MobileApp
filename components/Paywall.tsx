import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Platform, ScrollView, SafeAreaView, ActivityIndicator, Switch } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/context/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const { width, height } = Dimensions.get('window');

const FEATURES = [
    { icon: 'mic-outline', title: 'Unlimited Recordings', desc: 'Capture every word of your lectures' },
    { icon: 'flash-outline', title: 'Priority AI Processing', desc: 'Blazing fast note generation' },
    { icon: 'layers-outline', title: 'Premium Study Modes', desc: 'Master subjects with Match and Blast' },
    { icon: 'cloud-done-outline', title: 'Cloud Sync', desc: 'Your notes, everywhere you study' },
];

export default function Paywall({ onClose }: { onClose: () => void }) {
    const { isPro, offerings, purchasePackage, restorePurchases, isLoading } = useSubscription();
    const [selectedPackage, setSelectedPackage] = useState<'weekly' | 'monthly' | 'annual'>('weekly');
    const [showAnnual, setShowAnnual] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const handlePurchase = async () => {
        if (!offerings) {
            Alert.alert('Error', 'Subscription options are not available right now. Please try again later.');
            return;
        }

        const pkg = selectedPackage === 'monthly' ? offerings.monthly : selectedPackage === 'weekly' ? offerings.weekly : offerings.annual;

        if (!pkg) {
            Alert.alert('Error', `The ${selectedPackage} plan is not configured correctly in RevenueCat.`);
            return;
        }

        setIsPurchasing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const success = await purchasePackage(pkg);
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClose();
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const monthlyPkg = offerings?.monthly;
    const weeklyPkg = offerings?.weekly;
    const annualPkg = offerings?.annual;

    if (isPro) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
                <View style={styles.successSection}>
                    <View style={styles.successBadge}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>You're Pro!</Text>
                    <Text style={styles.subtitle}>Welcome to the viszmo Pro community. Your academic edge is active.</Text>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={onClose}
                    >
                        <Text style={styles.mainButtonText}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
                        <LinearGradient
                            colors={[Colors.primary, '#8b5cf6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.proLabel}
                        >
                            <Text style={styles.proLabelText}>viszmo PRO</Text>
                        </LinearGradient>
                        <Text style={styles.mainTitle}>Unlock Your Full Potential</Text>
                        <Text style={styles.mainSubtitle}>Choose the plan that fits your study habits.</Text>
                    </Animated.View>

                    {/* Features */}
                    <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.featuresList}>
                        {FEATURES.map((item, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.featureIconContainer}>
                                    <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.featureTitle}>{item.title}</Text>
                                    <Text style={styles.featureDesc}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Basic Plan Toggle */}
                    <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.basicToggleContainer}>
                        <View style={styles.basicToggleTextWrapper}>
                            <Text style={styles.basicToggleLabel}>Annual Plan</Text>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveText}>SAVE 40%</Text>
                            </View>
                        </View>
                        <Switch
                            value={showAnnual}
                            onValueChange={(value) => {
                                setShowAnnual(value);
                                setSelectedPackage(value ? 'annual' : 'weekly');
                            }}
                            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: Colors.primary }}
                            thumbColor="white"
                            ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                        />
                    </Animated.View>

                    {/* Plan Selection */}
                    <Animated.View layout={LinearTransition} entering={FadeInDown.duration(500).delay(400)} style={styles.plansContainer}>
                        {!showAnnual ? (
                            <>
                                <AnimatedTouchableOpacity
                                    layout={LinearTransition}
                                    entering={FadeInDown.duration(400)}
                                    exiting={FadeOut.duration(200)}
                                    style={[styles.planCard, selectedPackage === 'weekly' && styles.planCardSelected]}
                                    onPress={() => setSelectedPackage('weekly')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>Weekly</Text>
                                        <Text style={styles.planPrice}>
                                            {weeklyPkg ? weeklyPkg.product.priceString : '$2.99'}
                                            <Text style={styles.planPeriod}>/week</Text>
                                        </Text>
                                    </View>
                                    {selectedPackage === 'weekly' && (
                                        <View style={styles.selectedCircle}>
                                            <View style={styles.selectedInner} />
                                        </View>
                                    )}
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>POPULAR</Text>
                                    </View>
                                </AnimatedTouchableOpacity>

                                <AnimatedTouchableOpacity
                                    layout={LinearTransition}
                                    entering={FadeInDown.duration(400).delay(100)}
                                    exiting={FadeOut.duration(200)}
                                    style={[styles.planCard, selectedPackage === 'monthly' && styles.planCardSelected]}
                                    onPress={() => setSelectedPackage('monthly')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>Monthly</Text>
                                        <Text style={styles.planPrice}>
                                            {monthlyPkg ? monthlyPkg.product.priceString : '$8.99'}
                                            <Text style={styles.planPeriod}>/month</Text>
                                        </Text>
                                    </View>
                                    {selectedPackage === 'monthly' && (
                                        <View style={styles.selectedCircle}>
                                            <View style={styles.selectedInner} />
                                        </View>
                                    )}
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>BEST VALUE</Text>
                                    </View>
                                </AnimatedTouchableOpacity>
                            </>
                        ) : (
                            <AnimatedTouchableOpacity
                                layout={LinearTransition}
                                entering={ZoomIn.duration(400)}
                                exiting={FadeOut.duration(200)}
                                style={[styles.planCard, selectedPackage === 'annual' && styles.planCardSelected]}
                                onPress={() => setSelectedPackage('annual')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.planInfo}>
                                    <Text style={styles.planTitle}>Annual</Text>
                                    <Text style={styles.planPrice}>
                                        {annualPkg ? annualPkg.product.priceString : '$59.99'}
                                        <Text style={styles.planPeriod}>/year</Text>
                                    </Text>
                                </View>
                                {selectedPackage === 'annual' && (
                                    <View style={styles.selectedCircle}>
                                        <View style={styles.selectedInner} />
                                    </View>
                                )}
                            </AnimatedTouchableOpacity>
                        )}
                    </Animated.View>

                    {/* Action Button */}
                    <Animated.View layout={LinearTransition} entering={FadeInDown.duration(500).delay(500)}>
                        <TouchableOpacity
                            style={[styles.mainButton, isPurchasing && styles.buttonDisabled]}
                            onPress={handlePurchase}
                            disabled={isPurchasing}
                        >
                            {isPurchasing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.mainButtonText}>Start {showAnnual ? '7' : '3'}-Day Free Trial</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Footer Links */}
                    <Animated.View entering={FadeInDown.duration(500).delay(600)} layout={LinearTransition} style={styles.footer}>
                        <TouchableOpacity onPress={restorePurchases}>
                            <Text style={styles.footerText}>Restore Purchases</Text>
                        </TouchableOpacity>
                        <View style={styles.footerDivider} />
                        <TouchableOpacity>
                            <Text style={styles.footerText}>Terms of Service</Text>
                        </TouchableOpacity>
                        <View style={styles.footerDivider} />
                        <TouchableOpacity>
                            <Text style={styles.footerText}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        flexGrow: 1,
        justifyContent: 'center',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginTop: 5,
    },
    header: {
        marginTop: 10,
        alignItems: 'center',
    },
    proLabel: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 16,
    },
    proLabelText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        letterSpacing: 2,
    },
    mainTitle: {
        fontSize: 26,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 4,
    },
    mainSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    featuresList: {
        marginTop: 20,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    featureDesc: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    basicToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    basicToggleTextWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    basicToggleLabel: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    saveBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    saveText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    plansContainer: {
        marginTop: 15,
        gap: 10,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    planCardSelected: {
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
        borderColor: Colors.primary,
    },
    planInfo: {
        flex: 1,
    },
    planTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    planPeriod: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
    },
    selectedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    popularText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    mainButton: {
        marginTop: 20,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    mainButtonText: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    successSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    successBadge: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.3)',
    },
    footerDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 10,
    },
});
