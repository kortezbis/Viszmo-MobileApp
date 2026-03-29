import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

interface AppBackgroundProps {
    children: React.ReactNode;
}

export default function AppBackground({ children }: AppBackgroundProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.surface, Colors.background]}
                style={StyleSheet.absoluteFill}
            />
            {/* Top Glow */}
            <LinearGradient
                colors={['rgba(14, 165, 233, 0.25)', 'transparent']}
                style={styles.topGlow}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.4,
    },
});
