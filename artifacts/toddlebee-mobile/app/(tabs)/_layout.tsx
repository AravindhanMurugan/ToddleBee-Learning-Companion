import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAppSettings } from '@/src/settings';
import { copy } from '@/src/i18n';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  const { language } = useAppSettings();
  const t = copy[language];
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md="home"
        />
        <NativeTabs.Trigger.Label>{t.home}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>{t.learn}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }} md="quiz" />
        <NativeTabs.Trigger.Label>{t.practice}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="trending_up" />
        <NativeTabs.Trigger.Label>{t.progress}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="parent">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="people" />
        <NativeTabs.Trigger.Label>{t.parent}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { language } = useAppSettings();
  const t = copy[language];
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : { height: 58 + insets.bottom, paddingBottom: insets.bottom }),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="learn" options={{ title: t.learn, tabBarIcon: ({ color }) => isIOS ? <SymbolView name="book.closed" tintColor={color} size={23} /> : <Feather name="book-open" size={21} color={color} /> }} />
      <Tabs.Screen name="practice" options={{ title: t.practice, tabBarIcon: ({ color }) => isIOS ? <SymbolView name="checkmark.circle" tintColor={color} size={23} /> : <Feather name="check-circle" size={21} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: t.progress, tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={23} /> : <Feather name="trending-up" size={21} color={color} /> }} />
      <Tabs.Screen name="parent" options={{ title: t.parent, tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.crop.circle" tintColor={color} size={23} /> : <Feather name="users" size={21} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
