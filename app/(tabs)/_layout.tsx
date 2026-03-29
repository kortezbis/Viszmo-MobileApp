import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import LiquidGlassTabBar from '@/components/LiquidGlassTabBar';
import AppBackground from '@/components/AppBackground';

export default function TabLayout() {
  return (
    <AppBackground>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            get title() { return 'Create'; },
            tabBarIcon: ({ color }) => <Ionicons name="add" size={32} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => <Ionicons name="library-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
    </AppBackground>
  );
}
