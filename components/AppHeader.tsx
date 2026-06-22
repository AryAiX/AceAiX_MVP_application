import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell, Search } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { open } = useDrawer();
  const { profile } = useAuth();
  const { unreadCount } = useNotificationContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={s.row}>
        <TouchableOpacity onPress={open} hitSlop={8}>
          <Menu color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={s.right}>
          <TouchableOpacity style={s.bellWrap} hitSlop={8} onPress={() => router.push('/(tabs)/notifications')}>
            <Bell color={unreadCount > 0 ? Colors.primary : Colors.textMuted} size={22} />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={open} activeOpacity={0.8}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarDefault]}>
                <Text style={s.avatarInitial}>{profile?.full_name?.[0]?.toUpperCase() ?? 'A'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.searchBar}>
        <Search color={Colors.textDisabled} size={14} />
        <TextInput
          style={s.searchInput}
          placeholder="Search athletes, clubs…"
          placeholderTextColor={Colors.textDisabled}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  title: {
    flex: 1,
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  bellWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: Typography.family.bold,
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarDefault: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    height: 38,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.family.regular,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
});
