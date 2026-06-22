import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Rss, Target, MessageSquare } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { DrawerProvider } from '@/context/DrawerContext';
import { AppDrawer } from '@/components/AppDrawer';

export default function TabsLayout() {
  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.surface,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              height: 76,
              paddingTop: Spacing.sm,
              paddingBottom: Spacing.lg,
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textDisabled,
            tabBarLabelStyle: {
              fontFamily: Typography.family.medium,
              fontSize: 11,
              marginTop: 2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Social Feed',
              tabBarLabel: 'Feed',
              tabBarIcon: ({ color, size }) => <Rss color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="opportunities"
            options={{
              title: 'Opportunities',
              tabBarLabel: 'Opportunities',
              tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarLabel: 'Messages',
              tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
            }}
          />
          {/* Hidden screens — accessible via drawer */}
          <Tabs.Screen name="profile" options={{ href: null }} />
          <Tabs.Screen name="performance" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="notifications" options={{ href: null }} />
          <Tabs.Screen name="media" options={{ href: null }} />
          <Tabs.Screen name="medical" options={{ href: null }} />
          <Tabs.Screen name="network" options={{ href: null }} />
          <Tabs.Screen name="career" options={{ href: null }} />
          <Tabs.Screen name="events" options={{ href: null }} />
          <Tabs.Screen name="ai-coach" options={{ href: null }} />
          <Tabs.Screen name="analytics" options={{ href: null }} />
          <Tabs.Screen name="public-profile" options={{ href: null }} />
          <Tabs.Screen name="discover" options={{ href: null }} />
          <Tabs.Screen name="sportify-academy" options={{ href: null }} />
          <Tabs.Screen name="sportify-talent" options={{ href: null }} />
        </Tabs>
        <AppDrawer />
      </View>
    </DrawerProvider>
  );
}
