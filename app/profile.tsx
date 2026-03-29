import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Modal, Linking, Alert, Animated, Pressable, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { dbProvider } from '@/services/database';
import { useSubscription } from '@/context/SubscriptionContext';
import { BlurView } from 'expo-blur';
import Paywall from '@/components/Paywall';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/context/SettingsContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const AccountButton = ({ label, icon, color, onAction, showTimer = false }: { label: string, icon: string, color: string, onAction: () => void, showTimer?: boolean }) => {
    const [isLoading, setIsLoading] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const { triggerHaptic, hapticsEnabled } = useSettings();

    const startTimer = () => {
        setIsLoading(true);
        progress.setValue(0);

        Animated.timing(progress, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                if (hapticsEnabled) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
                onAction();
                setIsLoading(false);
                progress.setValue(0);
            }
        });
    };

    return (
        <View style={styles.accountButtonContainer}>
            <TouchableOpacity
                onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    if (showTimer) {
                        startTimer();
                    } else {
                        onAction();
                    }
                }}
                disabled={isLoading}
                style={styles.accountButton}
            >
                <View style={styles.settingLeft}>
                    <Ionicons name={icon as any} size={22} color={color} style={styles.settingIcon} />
                    <Text style={[styles.settingLabel, { color: color, fontSize: 16 }]}>{label}</Text>
                </View>
                {!isLoading && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />}
            </TouchableOpacity>

            {showTimer && isLoading && (
                <View style={styles.timerTrack}>
                    <Animated.View
                        style={[
                            styles.timerFill,
                            {
                                width: progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                }),
                                backgroundColor: color
                            }
                        ]}
                    />
                </View>
            )}
        </View>
    );
};

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [isDeleting, setIsDeleting] = useState(false);
    const { showPaywall } = useSubscription();
    const {
        hapticsEnabled, setHapticsEnabled,
        soundsEnabled, setSoundsEnabled,
        pushEnabled, setPushEnabled,
        triggerHaptic
    } = useSettings();

    // Placeholder user data - would be replaced by actual auth context
    const user = {
        name: 'Kortez',
        email: 'kevjohnson032@gmail.com',
        photoUrl: null // Set to a URL string if user logged in via Apple/Google e.g., 'https://example.com/photo.jpg'
    };

    const handleSettingPress = (label: string) => {
        triggerHaptic();
        switch (label) {
            case 'Privacy policy':
                Linking.openURL('https://viszmo.com/privacy');
                break;
            case 'Terms of service':
                Linking.openURL('https://viszmo.com/terms');
                break;
            case 'Manage billing':
                showPaywall();
                break;
            case 'Contact support':
                Linking.openURL('mailto:support@viszmo.com');
                break;
            case 'Visit viszmo.com':
                Linking.openURL('https://viszmo.com');
                break;
            case 'Get viszmo for Mac & Windows':
                Linking.openURL('https://viszmo.com/download');
                break;
            case 'Rate viszmo':
                // Placeholder - replaced with actual app store link
                // Platform.OS === 'ios' ? Linking.openURL(APPLE_STORE_URL) : Linking.openURL(GOOGLE_PLAY_URL)
                Alert.alert('Coming Soon', 'Rating will be available once the app is on the App Store!');
                break;
            case 'Follow Main TikTok':
                Linking.openURL('https://www.tiktok.com/@viszmo');
                break;
            case 'Follow Secondary TikTok':
                Linking.openURL('https://www.tiktok.com/@viszmo_app');
                break;
            case 'Follow on Instagram':
                Linking.openURL('https://instagram.com/viszmo');
                break;
            case 'Subscribe on YouTube':
                Linking.openURL('https://youtube.com/@viszmo');
                break;
            case 'Like on Facebook':
                Linking.openURL('https://facebook.com/viszmo');
                break;
            default:
                break;
        }
    };

    const renderToggleItem = (icon: string, label: string, value: boolean, onValueChange: (v: boolean) => void, isLast = false) => (
        <View style={[styles.settingItem, isLast && styles.noBorder]}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={22} color="#94A3B8" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={(v) => {
                    triggerHaptic();
                    onValueChange(v);
                }}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                thumbColor="white"
                ios_backgroundColor="rgba(255,255,255,0.1)"
            />
        </View>
    );

    const renderSettingItem = (icon: string, label: string, color: string, isLast = false) => (
        <TouchableOpacity
            style={[styles.settingItem, isLast && styles.noBorder]}
            activeOpacity={0.7}
            onPress={() => handleSettingPress(label)}
        >
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={22} color={color} style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity style={styles.trialPill} activeOpacity={0.7} onPress={showPaywall}>
                    <Text style={styles.trialText}>Free trial</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Profile Card */}
                <View style={styles.section}>
                    <View style={styles.glassContainer}>
                        <View style={styles.profileTopRow}>
                            {user.photoUrl ? (
                                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]}>
                                    <Ionicons name="person" size={24} color="rgba(255,255,255,0.5)" />
                                </View>
                            )}
                            <Text style={styles.profileName}>{user.name}</Text>
                        </View>
                        <View style={styles.emailContainer}>
                            <Text style={styles.emailLabel}>Email</Text>
                            <Text style={styles.profileEmail}>{user.email}</Text>
                        </View>
                    </View>
                </View>

                {/* App Settings Card */}
                <View style={styles.section}>
                    <View style={styles.glassContainer}>
                        {renderSettingItem('desktop-outline', 'Get viszmo for Mac & Windows', '#94A3B8')}
                        {renderToggleItem('notifications-outline', 'Push Notifications', pushEnabled, setPushEnabled)}
                        {renderToggleItem('volume-high-outline', 'Sound Effects', soundsEnabled, setSoundsEnabled)}
                        {renderToggleItem('finger-print-outline', 'Haptic Feedback', hapticsEnabled, setHapticsEnabled, true)}
                    </View>
                </View>

                {/* Legal & Billing Card */}
                <View style={styles.section}>
                    <View style={styles.glassContainer}>
                        {renderSettingItem('shield-checkmark-outline', 'Privacy policy', '#94A3B8')}
                        {renderSettingItem('card-outline', 'Manage billing', '#94A3B8')}
                        {renderSettingItem('document-text-outline', 'Terms of service', '#94A3B8', true)}
                    </View>
                </View>

                {/* Social & Community */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderTitle}>Community</Text>
                </View>
                <View style={styles.section}>
                    <View style={styles.glassContainer}>
                        {renderSettingItem('star-outline', 'Rate viszmo', '#FACC15')}
                        {renderSettingItem('logo-tiktok', 'Follow Main TikTok', '#ff0050')}
                        {renderSettingItem('logo-tiktok', 'Follow Secondary TikTok', '#00f2ea')}
                        {renderSettingItem('logo-instagram', 'Follow on Instagram', '#E1306C')}
                        {renderSettingItem('logo-youtube', 'Subscribe on YouTube', '#FF0000')}
                        {renderSettingItem('logo-facebook', 'Like on Facebook', '#1877F2', true)}
                    </View>
                </View>

                {/* Support Card */}
                <View style={styles.section}>
                    <View style={styles.glassContainer}>
                        {renderSettingItem('mail-outline', 'Contact support', '#94A3B8')}
                        {renderSettingItem('globe-outline', 'Visit viszmo.com', '#94A3B8', true)}
                    </View>
                </View>

                {/* Account Actions - Each in its own container */}
                <View style={styles.dangerSection}>
                    <BlurView intensity={30} tint="dark" style={styles.dangerCard}>
                        <AccountButton
                            label="Sign out"
                            icon="log-out-outline"
                            color="#94A3B8"
                            onAction={() => router.replace('/onboarding')}
                        />
                    </BlurView>

                    <View style={{ height: 12 }} />

                    <BlurView intensity={30} tint="dark" style={[styles.dangerCard, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                        <AccountButton
                            label="Delete my account"
                            icon="trash-outline"
                            color="#EF4444"
                            showTimer={true}
                            onAction={() => {
                                Alert.alert(
                                    'Delete Account',
                                    'Are you sure you want to permanently delete your account? This action cannot be undone.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive', onPress: () => router.replace('/onboarding') }
                                    ]
                                );
                            }}
                        />
                    </BlurView>
                </View>

                <Text style={styles.versionText}>
                    Version {Constants.expoConfig?.version ?? '1.0.0'}
                    {Constants.nativeBuildVersion ? ` Build ${Constants.nativeBuildVersion}` : ''}
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        backgroundColor: Colors.background,
    },
    headerButton: {
        width: 80,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    trialPill: {
        width: 80,
        backgroundColor: '#FACC15',
        paddingVertical: 6,
        paddingHorizontal: 0,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trialText: {
        color: '#1E293B',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 12,
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    sectionHeaderTitle: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    glassContainer: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: 'white',
    },
    profileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    placeholderAvatar: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    emailContainer: {
        padding: 16,
    },
    emailLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        color: 'white',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 20,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        fontFamily: 'Inter-Medium',
    },
    dangerSection: {
        marginTop: 24,
    },
    dangerCard: {
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    accountButtonContainer: {
        width: '100%',
    },
    accountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 32,
    },
    timerTrack: {
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 1.5,
        marginTop: 8,
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
    },
});
