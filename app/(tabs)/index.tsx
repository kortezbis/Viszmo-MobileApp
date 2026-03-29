import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, TouchableOpacity, ScrollView, LayoutAnimation } from 'react-native';
import TopHeader from '@/components/TopHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import StreakSuccessModal from '@/components/StreakSuccessModal';
import StreakCalendarModal from '@/components/StreakCalendarModal';
import { useStreak } from '@/context/StreakContext';
import { Image } from 'react-native';

const fireImg = require('@/assets/images/branding/Fire.png.png');
const iceImg = require('@/assets/images/branding/ice.png.png');

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.88;
const CARD_MARGIN = 8;
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);
const SIDE_SPACING = (width - CARD_WIDTH) / 2;

type Deck = {
  id: string;
  title: string;
  progress: number;
};

const MOCK_DECKS: Deck[] = [
  { id: '1', title: 'Cell Biology & Mitosis', progress: 68 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);
  const { activeStreakGoal, streakCount, getStreakStatus, startGoal, clearGoal } = useStreak();
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);

  const handlePickGoal = async (days: number | null) => {
    Haptics.impactAsync(days ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (days) {
      await startGoal(days);
    } else {
      await clearGoal();
    }
  };

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.15, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8 + (pulse.value - 1) * 2,
  }));

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardContainer}
      onPress={() => router.push('/deck-details')}
    >
      <BlurView intensity={40} tint="dark" style={styles.blurCard}>
        <View style={styles.cardContent}>
          {/* Top Row: Title and Menu */}
          <View style={styles.cardHeader}>
            <Text style={styles.deckTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          {/* Middle: Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${item.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress}% of questions completed
            </Text>
          </View>

          {/* Bottom: Action Button */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.8}
            onPress={() => router.push('/deck-details')}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Studied</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {MOCK_DECKS.length > 0 ? (
            <FlatList
              data={MOCK_DECKS}
              renderItem={renderDeckItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              contentContainerStyle={styles.flatListContent}
              keyExtractor={(item) => item.id}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <BlurView intensity={20} tint="dark" style={styles.emptyBlur}>
                <Ionicons name="documents-outline" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>No decks studied recently</Text>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => router.push('/(tabs)/library')}
                >
                  <Text style={styles.startButtonText}>Open Library</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          )}

          {/* Streak Goal / Calendar Section */}
          <View style={styles.streakSection}>
            <BlurView intensity={30} tint="dark" style={styles.streakCard}>
              {!activeStreakGoal ? (
                <>
                  <View style={styles.streakHeader}>
                    <View style={styles.flameCircle}>
                      <Image source={fireImg} style={styles.flameIconImage} resizeMode="contain" />
                    </View>
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={() => setIsCalendarModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar-outline" size={20} color="rgba(255, 255, 255, 0.4)" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.streakTitle}>Start a streak goal!</Text>
                  <Text style={styles.streakSubtitle}>
                    You'll get reminders to study so you stay on track.
                  </Text>

                  <View style={styles.goalButtonContainer}>
                    <TouchableOpacity style={styles.goalButton} activeOpacity={0.7} onPress={() => handlePickGoal(7)}>
                      <Text style={styles.goalButtonText}>7-day goal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.goalButton} activeOpacity={0.7} onPress={() => handlePickGoal(30)}>
                      <Text style={styles.goalButtonText}>30-day goal</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.calendarContainer}>
                  <View style={styles.streakHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.flameCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Image source={fireImg} style={styles.flameIconImage} resizeMode="contain" />
                      </View>
                      <View>
                        <Text style={[styles.streakTitle, { color: '#FF6B00', marginBottom: 0 }]}>{streakCount} Day Streak!</Text>
                        <Text style={[styles.calendarSubtitle, { color: '#FF9D00' }]}>On track for {activeStreakGoal} days</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        style={styles.calendarButton}
                        onPress={() => setIsCalendarModalVisible(true)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="calendar-outline" size={20} color="rgba(255, 255, 255, 0.4)" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuButton} onPress={() => handlePickGoal(null)}>
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 7 Day Streak Row */}
                  <View style={styles.daysRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, ix) => {
                      const today = new Date();
                      const currentDayIdx = today.getDay();
                      const d = new Date();
                      d.setDate(today.getDate() - currentDayIdx + ix);

                      const status = getStreakStatus(d.getDate(), d.getMonth(), d.getFullYear());
                      const isToday = ix === currentDayIdx;

                      // Status: 0 = pending/future, 1 = done, 2 = frozen, 3 = broken
                      const isActive = isToday && status !== 1; // Pulse or highlight today if not done yet
                      const isDone = status === 1;
                      const isFrozen = status === 2;

                      return (
                        <View key={ix} style={styles.dayCol}>
                          <Text style={styles.dayLabel}>{dayChar}</Text>
                          <View style={[
                            styles.dayCircle,
                            isActive ? styles.dayCircleActive :
                              isFrozen ? styles.dayCircleFrozen :
                                isDone ? styles.dayCircleDone : styles.dayCircleFuture
                          ]}>
                            {(isDone || isFrozen || isActive) ? (
                              <Ionicons
                                name={isFrozen ? "snow-outline" : "checkmark-sharp"}
                                size={16}
                                color="white"
                              />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Progress Bar towards goal */}
                  <View style={styles.goalProgressArea}>
                    <Text style={styles.goalProgressText}>{streakCount} / {activeStreakGoal} days completed</Text>
                    <View style={styles.progressBarContainer}>
                      <LinearGradient
                        colors={['#FFB800', '#FF6B00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${Math.min(100, (streakCount / activeStreakGoal) * 100)}%` }]}
                      />
                    </View>
                  </View>
                </View>
              )}
            </BlurView>
          </View>
        </View >
      </ScrollView >

      <StreakSuccessModal
        isVisible={isStreakModalVisible}
        onClose={() => setIsStreakModalVisible(false)}
        streakCount={streakCount}
      />
      <StreakCalendarModal
        isVisible={isCalendarModalVisible}
        onClose={() => setIsCalendarModalVisible(false)}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainContent: {
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_SPACING + 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.white,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flatListContent: {
    paddingHorizontal: SIDE_SPACING - CARD_MARGIN,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    height: 250,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  blurCard: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deckTitle: {
    flex: 1,
    fontSize: 19,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.white,
    lineHeight: 26,
    marginRight: 10,
  },
  menuButton: {
    padding: 4,
  },
  progressSection: {
    marginVertical: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  continueButton: {
    backgroundColor: '#0EA5E9', // Sky Blue brand color
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  continueText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.white,
  },
  emptyContainer: {
    paddingHorizontal: SIDE_SPACING,
    marginTop: 10,
  },
  emptyBlur: {
    height: 220,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  streakSection: {
    paddingHorizontal: SIDE_SPACING,
    marginTop: 30,
  },
  streakCard: {
    borderRadius: 32,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flameCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameIconImage: {
    width: 24,
    height: 24,
  },
  streakTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: 'white',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
    marginBottom: 16,
  },
  goalButtonContainer: {
    gap: 8,
  },
  goalButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  goalButtonText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calendarContainer: {
    paddingBottom: 5,
  },
  calendarSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#EF4444', // Red accent
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    paddingHorizontal: 5,
  },
  dayCol: {
    alignItems: 'center',
    gap: 12,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleFuture: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCircleActive: {
    backgroundColor: '#FF6B00',
    transform: [{ scale: 1.1 }],
  },
  dayCircleDone: {
    backgroundColor: '#FFB800',
    borderWidth: 0,
  },
  dayCircleFrozen: {
    backgroundColor: '#3B82F6', // Blue for ice/freeze
    borderWidth: 0,
  },
  goalProgressArea: {
    marginTop: 4,
  },
  goalProgressText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
    textAlign: 'right',
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


