/**
 * Client-side rate limiter using AsyncStorage.
 *
 * Protections in place:
 *  1. Daily request quota   — max N AI generation calls per calendar day per device
 *  2. Cooldown between calls — must wait at least M seconds between consecutive generations
 *  3. Card count cap        — enforced server-side via prompt + hardcoded max before calling API
 *
 * NOTE: This is a good-faith client-side guard. A real production system should
 * also enforce limits on a backend / edge function so they cannot be bypassed
 * by a motivated user. Wire this up to Supabase when the backend is ready.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Configuration -------------------------------------------------------

/** Max AI generation requests per user per day (resets at midnight local time) */
export const DAILY_LIMIT = 20;

/** Minimum seconds between consecutive AI generation requests (anti-spam) */
export const COOLDOWN_SECONDS = 15;

/** Hard cap on cards per request — regardless of what the user picks */
export const MAX_CARDS_PER_REQUEST = 100;

/** Default card count shown in the picker */
export const DEFAULT_CARD_COUNT = 20;

/** Card count picker options shown in the UI */
export const CARD_COUNT_OPTIONS = [10, 20, 40, 60, 100];

// ---- Storage Keys -------------------------------------------------------

const KEY_DAILY_COUNT = '@viszmo_ai_daily_count';
const KEY_DAILY_DATE = '@viszmo_ai_daily_date';
const KEY_LAST_CALL = '@viszmo_ai_last_call';

// ---- Helpers ------------------------------------------------------------

const todayString = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

/** Returns how many AI calls have been made today. */
export const getDailyUsage = async (): Promise<number> => {
    const [storedDate, storedCount] = await Promise.all([
        AsyncStorage.getItem(KEY_DAILY_DATE),
        AsyncStorage.getItem(KEY_DAILY_COUNT),
    ]);
    if (storedDate !== todayString()) return 0; // new day → reset
    return parseInt(storedCount || '0', 10);
};

/** Returns remaining calls allowed today. */
export const getRemainingCalls = async (): Promise<number> => {
    const used = await getDailyUsage();
    return Math.max(0, DAILY_LIMIT - used);
};

/** Returns seconds remaining in the cooldown (0 if no cooldown active). */
export const getCooldownRemaining = async (): Promise<number> => {
    const lastCall = await AsyncStorage.getItem(KEY_LAST_CALL);
    if (!lastCall) return 0;
    const elapsed = (Date.now() - parseInt(lastCall, 10)) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - elapsed);
};

// ---- Main gate ----------------------------------------------------------

export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    cooldownRemaining?: number;
    dailyUsed?: number;
}

/**
 * Call this BEFORE every AI generation. Returns whether the call is allowed.
 * If allowed, increments the usage counters automatically.
 */
export const checkAndConsume = async (): Promise<RateLimitResult> => {
    // 1. Cooldown check
    const cooldown = await getCooldownRemaining();
    if (cooldown > 0) {
        return {
            allowed: false,
            reason: `Please wait ${Math.ceil(cooldown)} seconds before generating again.`,
            cooldownRemaining: cooldown,
        };
    }

    // 2. Daily limit check
    const [storedDate, storedCount] = await Promise.all([
        AsyncStorage.getItem(KEY_DAILY_DATE),
        AsyncStorage.getItem(KEY_DAILY_COUNT),
    ]);
    const today = todayString();
    const currentCount = storedDate === today ? parseInt(storedCount || '0', 10) : 0;

    if (currentCount >= DAILY_LIMIT) {
        return {
            allowed: false,
            reason: `You've reached the daily limit of ${DAILY_LIMIT} AI generations. Resets at midnight.`,
            dailyUsed: currentCount,
        };
    }

    // 3. All clear — record this call
    await Promise.all([
        AsyncStorage.setItem(KEY_DAILY_DATE, today),
        AsyncStorage.setItem(KEY_DAILY_COUNT, String(currentCount + 1)),
        AsyncStorage.setItem(KEY_LAST_CALL, String(Date.now())),
    ]);

    return { allowed: true, dailyUsed: currentCount + 1 };
};

/**
 * Clamps a user-requested card count to safe bounds.
 * Always call this before constructing the Gemini prompt.
 */
export const clampCardCount = (requested: number): number => {
    return Math.min(Math.max(1, Math.round(requested)), MAX_CARDS_PER_REQUEST);
};
