import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useActionSheet } from '@/context/ActionSheetContext';
import { House2Icon, PenSparkleIcon, FolderNewIcon, MagicWandIcon } from './NucleoIcons';

const { width } = Dimensions.get('window');
const TAB_BAR_MARGIN = 24;
const TAB_BAR_WIDTH = width - (TAB_BAR_MARGIN * 2);

// Snug fit parameters
const NAV_HEIGHT = 68;
const INNER_PADDING = 5;
const INDICATOR_HEIGHT = NAV_HEIGHT - (INNER_PADDING * 2);
const INTERNAL_WIDTH = TAB_BAR_WIDTH - (INNER_PADDING * 2);

export default function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { openActionSheet } = useActionSheet();
    const translateX = useSharedValue(0);
    const tabWidth = INTERNAL_WIDTH / state.routes.length;

    useEffect(() => {
        const newX = state.index * tabWidth;

        translateX.value = withTiming(newX, {
            duration: 250,
        });
    }, [state.index, tabWidth]);

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
            ],
        };
    });

    return (
        <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
            <View style={[styles.mainPillContainer, { width: TAB_BAR_WIDTH, height: NAV_HEIGHT }]}>
                <BlurView intensity={40} tint="dark" style={styles.blurPill}>
                    <View style={styles.contentContainer}>
                        {/* Active Indicator Background */}
                        <Animated.View style={[
                            styles.indicator,
                            { width: tabWidth, height: INDICATOR_HEIGHT, borderRadius: 28 }, // sleek squircle indicator
                            animatedIndicatorStyle
                        ]}>
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14, 165, 233, 0.25)' }]} />
                        </Animated.View>

                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                if (route.name === 'create') {
                                    openActionSheet('create');
                                    return;
                                }

                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const getIcon = () => {
                                const color = isFocused ? Colors.white : Colors.textMuted;
                                if (route.name === 'index') return <House2Icon color={color} size={22} />;
                                if (route.name === 'library') return <FolderNewIcon color={color} size={22} />;
                                if (route.name === 'create') return <PenSparkleIcon color={color} size={24} />;
                                return <Ionicons name="alert-circle-outline" size={22} color={color} />;
                            };

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    style={[styles.tabItem, { width: tabWidth }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.itemContent}>
                                        {getIcon()}
                                        <Animated.Text style={[
                                            styles.label,
                                            {
                                                color: isFocused ? Colors.white : Colors.textMuted,
                                                fontFamily: isFocused ? 'Inter-Bold' : 'Inter-Medium'
                                            }
                                        ]}>
                                            {options.title}
                                        </Animated.Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        paddingHorizontal: TAB_BAR_MARGIN,
    },
    mainPillContainer: {
        borderRadius: 36, // Vision OS squircle
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(7, 30, 51, 0.7)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    blurPill: {
        flex: 1,
    },
    contentContainer: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        paddingHorizontal: INNER_PADDING,
    },
    indicator: {
        position: 'absolute',
        left: INNER_PADDING,
        zIndex: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    tabItem: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    itemContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        marginTop: 2,
    },
});
