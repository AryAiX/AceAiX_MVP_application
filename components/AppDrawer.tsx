import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Image, ScrollView, Pressable, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/constants/theme';
import {
  Rss, LayoutDashboard, User, Film, TrendingUp, Activity, Users,
  Briefcase, Calendar, Target, Bot, BarChart2, MessageSquare,
  Settings, Globe, Compass, LogOut, X, ChevronRight, Settings2,
  BadgeCheck, Brain,
} from 'lucide-react-native';

const LOGO = require('@/assets/images/AceAiX_logo_transparent_(1) copy.png');

const DRAWER_WIDTH = 300;

interface MenuItem {
  label: string;
  route: string;
  Icon: React.ComponentType<any>;
  badge?: number;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', route: '/(tabs)', Icon: LayoutDashboard },
      { label: 'Feed', route: '/(tabs)/feed', Icon: Rss },
      { label: 'Profile', route: '/(tabs)/profile', Icon: User },
      { label: 'Media', route: '/(tabs)/media', Icon: Film },
      { label: 'Performance', route: '/(tabs)/performance', Icon: TrendingUp },
      { label: 'Medical', route: '/(tabs)/medical', Icon: Activity },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Network', route: '/(tabs)/network', Icon: Users },
      { label: 'Career', route: '/(tabs)/career', Icon: Briefcase },
      { label: 'Events', route: '/(tabs)/events', Icon: Calendar },
      { label: 'Opportunities', route: '/(tabs)/opportunities', Icon: Target },
    ],
  },
  {
    title: 'AI & Insights',
    items: [
      { label: 'AI Coach', route: '/(tabs)/ai-coach', Icon: Bot },
      { label: 'Analytics', route: '/(tabs)/analytics', Icon: BarChart2 },
      { label: 'Messages', route: '/(tabs)/messages', Icon: MessageSquare, badge: 3 },
    ],
  },
  {
    title: 'Partners',
    items: [
      { label: 'Sportify Academy', route: '/(tabs)/sportify-academy', Icon: BadgeCheck },
      { label: 'Talent Profile', route: '/(tabs)/sportify-talent', Icon: Brain },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', route: '/(tabs)/settings', Icon: Settings },
      { label: 'Public Profile', route: '/(tabs)/public-profile', Icon: Globe },
      { label: 'Discover Athletes', route: '/(tabs)/discover', Icon: Compass },
    ],
  },
];

export function AppDrawer() {
  const { isOpen, close } = useDrawer();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [isOpen]);

  function navigate(route: string) {
    close();
    setTimeout(() => router.push(route as any), 50);
  }

  async function handleSignOut() {
    close();
    await signOut();
    router.replace('/login');
  }

  if (!visible) return null;

  const isActive = (route: string) =>
    route === '/(tabs)' ? pathname === '/' : pathname.includes(route.replace('/(tabs)/', ''));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <View style={[s.drawerInner, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={s.drawerHeader}>
            <View style={s.logoRow}>
              <Image source={LOGO} style={s.logoImage} resizeMode="contain" />
              <View style={s.liveRow}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={close} style={s.closeBtn} hitSlop={8}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Athlete card */}
          <TouchableOpacity style={s.athleteCard} onPress={() => navigate('/(tabs)/profile')} activeOpacity={0.85}>
            <View style={s.athleteAvatarWrap}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={s.athleteAvatar} />
              ) : (
                <View style={[s.athleteAvatar, s.avatarDefault]}>
                  <Text style={s.avatarInitial}>{profile?.full_name?.[0]?.toUpperCase() ?? 'A'}</Text>
                </View>
              )}
              <View style={s.onlineDot} />
            </View>
            <View style={s.athleteInfo}>
              <Text style={s.athleteName} numberOfLines={1}>
                {profile?.full_name ?? 'Athlete'}
              </Text>
              <Text style={s.athleteRole}>
                {profile?.position ?? ''}{profile?.position && profile?.sport ? ' · ' : ''}{profile?.sport ?? 'Athlete'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigate('/(tabs)/settings')} hitSlop={8}>
              <Settings2 color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Nav items */}
          <ScrollView style={s.navScroll} showsVerticalScrollIndicator={false}>
            {SECTIONS.map((section) => (
              <View key={section.title} style={s.section}>
                <Text style={s.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[s.navItem, active && s.navItemActive]}
                      onPress={() => navigate(item.route)}
                      activeOpacity={0.7}
                    >
                      <item.Icon
                        color={active ? Colors.primary : Colors.textMuted}
                        size={18}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                      <Text style={[s.navLabel, active && s.navLabelActive]}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View style={s.navBadge}>
                          <Text style={s.navBadgeTxt}>{item.badge}</Text>
                        </View>
                      ) : null}
                      {active && <View style={s.activeBar} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer / Logout */}
          <View style={[s.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={s.footerDivider} />
            <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <LogOut color={Colors.error} size={18} />
              <Text style={s.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    ...Shadows.card,
  },
  drawerInner: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoImage: {
    width: 150,
    height: 46,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}20`,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontFamily: Typography.family.bold,
    fontSize: 10,
    color: Colors.success,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: Colors.elevated,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  athleteAvatarWrap: { position: 'relative' },
  athleteAvatar: { width: 44, height: 44, borderRadius: 22 },
  avatarDefault: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.lg,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.elevated,
  },
  athleteInfo: { flex: 1 },
  athleteName: {
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  athleteRole: {
    fontFamily: Typography.family.regular,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  navScroll: { flex: 1, paddingHorizontal: Spacing.md },
  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radii.md,
    gap: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  navLabel: {
    flex: 1,
    fontFamily: Typography.family.medium,
    fontSize: Typography.size.md,
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.family.bold,
  },
  navBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  navBadgeTxt: {
    color: Colors.white,
    fontFamily: Typography.family.bold,
    fontSize: 11,
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: `${Colors.error}12`,
    borderWidth: 1,
    borderColor: `${Colors.error}25`,
  },
  logoutText: {
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.md,
    color: Colors.error,
  },
});
