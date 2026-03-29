import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Image,
    Platform,
    ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useStreak } from '@/context/StreakContext';

const { width, height } = Dimensions.get('window');
const iceImg = require('@/assets/images/branding/ice.png.png');
const fireImg = require('@/assets/images/branding/Fire.png.png');

interface StreakCalendarModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StreakCalendarModal({ isVisible, onClose }: StreakCalendarModalProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const { getStreakStatus } = useStreak();

    const generateCalendarDays = (month: number, year: number) => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad for start of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handlePrevMonth = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const calendarDays = generateCalendarDays(currentMonth, currentYear);

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.dismissOverlay}
                    onPress={onClose}
                />

                <View style={styles.modalContainer}>
                    <BlurView intensity={40} tint="dark" style={styles.modalContent}>
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <Image source={fireImg} style={styles.miniFireIcon} />
                                <Text style={styles.modalTitle}>Streak History</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Month Selector */}
                        <View style={styles.monthSelector}>
                            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
                                <Ionicons name="chevron-back" size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>{MONTHS[currentMonth]} {currentYear}</Text>
                            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Grid */}
                        <Animated.View
                            key={`${currentMonth}-${currentYear}`}
                            entering={FadeIn.duration(300)}
                            exiting={FadeOut.duration(300)}
                            style={styles.calendarGrid}
                        >
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <Text key={`header-${i}`} style={styles.dayOfWeekText}>{d}</Text>
                            ))}
                            {calendarDays.map((day, idx) => {
                                if (day === null) return <View key={`pad-${idx}`} style={styles.dayCell} />;

                                const status = getStreakStatus(day, currentMonth, currentYear);
                                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                                return (
                                    <View key={`day-${day}`} style={styles.dayCell}>
                                        <View style={[
                                            styles.dayCircle,
                                            status === 1 && styles.dayCompleted,
                                            status === 2 && styles.dayFrozen,
                                            status === 3 && styles.dayBroken,
                                            isToday && !status && styles.dayToday
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                status > 0 && styles.dayTextActive
                                            ]}>{day}</Text>

                                            {status === 2 && (
                                                <Image source={iceImg} style={styles.microIceIcon} />
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </Animated.View>

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendCircle, styles.dayCompleted]} />
                                <Text style={styles.legendText}>Completed</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendCircle, styles.dayFrozen]}>
                                    <Image source={iceImg} style={styles.microIceIconLegend} />
                                </View>
                                <Text style={styles.legendText}>Frozen</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendCircle, styles.dayBroken]} />
                                <Text style={styles.legendText}>Broken</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FFB800', '#FF6B00']}
                                style={styles.gradient}
                            >
                                <Text style={styles.confirmBtnText}>Close</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dismissOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    modalContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniFireIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    closeBtn: {
        padding: 4,
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 8,
    },
    arrowBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    dayOfWeekText: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 12,
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dayCompleted: {
        backgroundColor: '#FF6B00',
    },
    dayFrozen: {
        backgroundColor: '#3B82F6',
    },
    dayBroken: {
        backgroundColor: '#EF4444',
    },
    dayToday: {
        borderWidth: 1.5,
        borderColor: '#FF6B00',
    },
    dayText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'white',
    },
    dayTextActive: {
        fontFamily: 'PlusJakartaSans-Bold',
    },
    microIceIcon: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 14,
        height: 14,
        resizeMode: 'contain',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    legendText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    microIceIconLegend: {
        width: 8,
        height: 8,
        resizeMode: 'contain',
    },
    confirmBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: 'white',
    },
});
