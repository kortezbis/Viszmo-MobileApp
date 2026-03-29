import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { Modal } from 'react-native';
import Paywall from '@/components/Paywall';

// Configuration
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
const ENTITLEMENT_ID = 'viszmo Pro';

interface SubscriptionContextType {
    isPro: boolean;
    offerings: PurchasesOffering | null;
    purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
    restorePurchases: () => Promise<void>;
    presentCustomerCenter: () => Promise<void>;
    isLoading: boolean;
    customerInfo: CustomerInfo | null;
    isPaywallVisible: boolean;
    showPaywall: () => void;
    hidePaywall: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro, setIsPro] = useState(false);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);

    const showPaywall = () => setIsPaywallVisible(true);
    const hidePaywall = () => setIsPaywallVisible(false);

    useEffect(() => {
        const setup = async () => {
            try {
                if (!REVENUECAT_API_KEY) {
                    console.warn('RevenueCat API Key is missing. Subscription features will be disabled.');
                    setIsLoading(false);
                    return;
                }

                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
                await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

                const info = await Purchases.getCustomerInfo();
                setCustomerInfo(info);
                setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);

                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null) {
                    setOfferings(offerings.current);
                }

                Purchases.addCustomerInfoUpdateListener((updatedInfo) => {
                    setCustomerInfo(updatedInfo);
                    setIsPro(updatedInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
                });
            } catch (error: any) {
                console.log('✨ RevenueCat Note (Expected in Expo Go):', error.message);
                // Optionally uncomment the next line to bypass paywalls for development
                // setIsPro(true);
            } finally {
                setIsLoading(false);
            }
        };

        setup();
    }, []);

    const purchasePackage = async (pkg: PurchasesPackage) => {
        try {
            const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
            const active = updatedInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
            setCustomerInfo(updatedInfo);
            setIsPro(active);
            return active;
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Purchase Error', e.message || 'An error occurred during purchase.');
            }
            return false;
        }
    };

    const restorePurchases = async () => {
        try {
            const updatedInfo = await Purchases.restorePurchases();
            setCustomerInfo(updatedInfo);
            const active = updatedInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
            setIsPro(active);
            if (active) {
                Alert.alert('Success', 'Your purchases have been restored!');
            } else {
                Alert.alert('Info', 'No active subscriptions found for your account.');
            }
        } catch (e: any) {
            Alert.alert('Restore Error', e.message || 'Failed to restore purchases.');
        }
    };

    const presentCustomerCenter = async () => {
        try {
            await RevenueCatUI.presentCustomerCenter();
        } catch (e: any) {
            console.error('Failed to present Customer Center:', e);
            Alert.alert('Error', 'Could not open Customer Center at this time.');
        }
    };

    return (
        <SubscriptionContext.Provider value={{
            isPro,
            offerings,
            purchasePackage,
            restorePurchases,
            presentCustomerCenter,
            isLoading,
            customerInfo,
            isPaywallVisible,
            showPaywall,
            hidePaywall
        }}>
            {children}

            <Modal
                visible={isPaywallVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={hidePaywall}
            >
                <Paywall onClose={hidePaywall} />
            </Modal>
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
