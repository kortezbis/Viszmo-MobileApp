import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

interface SettingsContextType {
    hapticsEnabled: boolean;
    setHapticsEnabled: (value: boolean) => void;
    soundsEnabled: boolean;
    setSoundsEnabled: (value: boolean) => void;
    pushEnabled: boolean;
    setPushEnabled: (value: boolean) => void;
    triggerHaptic: (style?: Haptics.ImpactFeedbackStyle) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [soundsEnabled, setSoundsEnabled] = useState(true);
    const [pushEnabled, setPushEnabled] = useState(true);

    const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
        if (hapticsEnabled) {
            Haptics.impactAsync(style);
        }
    };

    return (
        <SettingsContext.Provider
            value={{
                hapticsEnabled,
                setHapticsEnabled,
                soundsEnabled,
                setSoundsEnabled,
                pushEnabled,
                setPushEnabled,
                triggerHaptic,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
