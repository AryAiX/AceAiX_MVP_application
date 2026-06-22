import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { StoryAuthorGroup } from '@/lib/storiesService';
import { useAuth } from '@/context/AuthContext';
import { useStoriesContext } from '@/context/StoriesContext';

interface Props {
  onOpenViewer: (groups: StoryAuthorGroup[], startIndex: number) => void;
  onOpenCreator: () => void;
}

export function StoriesTray({ onOpenViewer, onOpenCreator }: Props) {
  const { groups, loading } = useStoriesContext();
  const { user, profile } = useAuth();

  // Separate own story group from others
  const ownGroup = groups.find((g) => g.is_own);
  const othersGroups = groups.filter((g) => !g.is_own);

  // Full groups array for viewer navigation (own first)
  const allGroups = ownGroup ? [ownGroup, ...othersGroups] : othersGroups;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {/* Your Story */}
      <TouchableOpacity
        style={s.item}
        onPress={() => {
          if (ownGroup) {
            onOpenViewer(allGroups, 0);
          } else {
            onOpenCreator();
          }
        }}
        activeOpacity={0.8}
      >
        <View style={s.avatarWrap}>
          {ownGroup ? (
            <RingWrapper seen={!ownGroup.has_unseen} own>
              <AvatarInner name={profile?.full_name} avatar={profile?.avatar_url} size={52} />
            </RingWrapper>
          ) : (
            <View style={s.addRing}>
              <AvatarInner name={profile?.full_name} avatar={profile?.avatar_url} size={52} />
              <View style={s.addBadge}>
                <Plus color={Colors.white} size={12} strokeWidth={3} />
              </View>
            </View>
          )}
        </View>
        <Text style={s.label} numberOfLines={1}>
          {ownGroup ? 'Your story' : 'Add story'}
        </Text>
      </TouchableOpacity>

      {/* Others */}
      {othersGroups.map((group, i) => {
        const viewerIdx = ownGroup ? i + 1 : i;
        return (
          <TouchableOpacity
            key={group.author_id}
            style={s.item}
            onPress={() => onOpenViewer(allGroups, viewerIdx)}
            activeOpacity={0.8}
          >
            <View style={s.avatarWrap}>
              <RingWrapper seen={!group.has_unseen}>
                <AvatarInner
                  name={group.author_name}
                  avatar={group.author_avatar}
                  size={52}
                />
              </RingWrapper>
            </View>
            <Text style={s.label} numberOfLines={1}>
              {group.author_name?.split(' ')[0] ?? 'Athlete'}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Placeholder pills when empty and not loading */}
      {!loading && groups.length === 0 && (
        <Text style={s.emptyHint}>No stories yet</Text>
      )}
    </ScrollView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RingWrapper({
  children,
  seen,
  own,
}: {
  children: React.ReactNode;
  seen: boolean;
  own?: boolean;
}) {
  if (seen || own) {
    return (
      <View
        style={[
          s.ringBase,
          { borderColor: own ? Colors.primary : Colors.textFaint, borderWidth: 2 },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.accent]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={s.gradientRing}
    >
      <View style={s.ringInner}>{children}</View>
    </LinearGradient>
  );
}

function AvatarInner({
  name,
  avatar,
  size,
}: {
  name: string | null | undefined;
  avatar: string | null | undefined;
  size: number;
}) {
  const r = size / 2;
  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: r }}
      />
    );
  }
  return (
    <View
      style={[
        s.avatarDefault,
        { width: size, height: size, borderRadius: r },
      ]}
    >
      <Text style={s.avatarInitial}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

const RING_SIZE = 60;
const AVATAR_SIZE = 52;

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  item: { alignItems: 'center', gap: 6, width: 64 },
  avatarWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  gradientRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: AVATAR_SIZE + 1,
    height: AVATAR_SIZE + 1,
    borderRadius: (AVATAR_SIZE + 1) / 2,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringBase: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  avatarDefault: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.md,
  },
  label: {
    fontFamily: Typography.family.medium,
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    width: 64,
  },
  emptyHint: {
    fontFamily: Typography.family.regular,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    alignSelf: 'center',
    paddingLeft: Spacing.md,
  },
});
