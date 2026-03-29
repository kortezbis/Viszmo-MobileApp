import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StreakStatusData = {
    activeStreakGoal: number | null;
    streakCount: number;
    daysStudied: string[];
    frozenDays: string[];
    startDate: string | null;
};

interface StreakContextType {
    activeStreakGoal: number | null;
    streakCount: number;
    daysStudied: string[];
    frozenDays: string[];
    startGoal: (days: number) => Promise<void>;
    recordStudy: () => Promise<void>;
    clearGoal: () => Promise<void>;
    getStreakStatus: (day: number, month: number, year: number) => number; // 0: none, 1: completed, 2: frozen, 3: broken
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
    const [activeStreakGoal, setActiveStreakGoal] = useState<number | null>(null);
    const [streakCount, setStreakCount] = useState(0);
    const [daysStudied, setDaysStudied] = useState<string[]>([]);
    const [frozenDays, setFrozenDays] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);

    useEffect(() => {
        loadStreakData();
    }, []);

    const loadStreakData = async () => {
        try {
            const stored = await AsyncStorage.getItem('@streak_data');
            if (stored) {
                const parsed: StreakStatusData = JSON.parse(stored);
                setActiveStreakGoal(parsed.activeStreakGoal);
                setStreakCount(parsed.streakCount);
                setDaysStudied(parsed.daysStudied || []);
                setFrozenDays(parsed.frozenDays || []);
                setStartDate(parsed.startDate || null);

                // Potential check to see if streak was broken yesterday without freeze
            }
        } catch (e) {
            console.error('Error loading streak', e);
        }
    };

    const saveStreakData = async (data: Partial<StreakStatusData>) => {
        try {
            const current = { activeStreakGoal, streakCount, daysStudied, frozenDays, startDate };
            const updated = { ...current, ...data };
            await AsyncStorage.setItem('@streak_data', JSON.stringify(updated));

            if (data.activeStreakGoal !== undefined) setActiveStreakGoal(data.activeStreakGoal);
            if (data.streakCount !== undefined) setStreakCount(data.streakCount);
            if (data.daysStudied !== undefined) setDaysStudied(data.daysStudied);
            if (data.frozenDays !== undefined) setFrozenDays(data.frozenDays);
            if (data.startDate !== undefined) setStartDate(data.startDate);
        } catch (e) {
            console.error('Error saving streak', e);
        }
    };

    const getLocalDateString = (d: Date = new Date()) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const startGoal = async (days: number) => {
        await saveStreakData({
            activeStreakGoal: days,
            streakCount: 0,
            daysStudied: [],
            frozenDays: [], // optionally grant 1 freeze
            startDate: getLocalDateString(),
        });
    };

    const recordStudy = async () => {
        if (!activeStreakGoal) return;
        const today = getLocalDateString();

        if (daysStudied.includes(today)) return; // Already studied today

        const updatedDays = [...daysStudied, today];

        // For simplicity, we just safely increment streak if they haven't studied today
        // In a fully robust system, we would calculate the gap between last study date to ensure it wasn't broken.
        const newCount = streakCount + 1;

        await saveStreakData({
            daysStudied: updatedDays,
            streakCount: newCount,
        });
    };

    const clearGoal = async () => {
        await saveStreakData({
            activeStreakGoal: null,
            streakCount: 0,
            daysStudied: [],
            frozenDays: [],
            startDate: null,
        });
    };

    // 0: none, 1: completed, 2: frozen, 3: broken
    const getStreakStatus = (day: number, month: number, year: number) => {
        if (!activeStreakGoal || !startDate) return 0;

        const checkDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Compare dates
        if (checkDateStr < startDate) return 0; // Befor start date

        const todayStr = getLocalDateString();
        if (checkDateStr > todayStr) return 0; // Future

        if (daysStudied.includes(checkDateStr)) return 1;
        if (frozenDays.includes(checkDateStr)) return 2;

        // If it's today and not studied, it's pending (0) for now until midnight
        if (checkDateStr === todayStr) return 0;

        // Passed days that weren't studied or frozen are broken
        return 3;
    };

    return (
        <StreakContext.Provider value={{
            activeStreakGoal,
            streakCount,
            daysStudied,
            frozenDays,
            startGoal,
            recordStudy,
            clearGoal,
            getStreakStatus
        }}>
            {children}
        </StreakContext.Provider>
    );
}

export function useStreak() {
    const context = useContext(StreakContext);
    if (context === undefined) {
        throw new Error('useStreak must be used within a StreakProvider');
    }
    return context;
}
