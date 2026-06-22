import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BadgeCheck,
  MoreHorizontal,
  Play,
  ChevronLeft,
  ChevronRight,
  Flag,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  FeedPost,
  PostTag,
  formatCount,
  postTimeAgo,
  toggleLike,
  toggleSave,
  deletePost,
} from '@/lib/postsService';
import { useAuth } from '@/context/AuthContext';

const { width: SW } = Dimensions.get('window');
const MEDIA_H = SW * 0.85;
const CARD_W = SW - Spacing.lg * 2;

interface Props {
  post: FeedPost;
  onUpdate: (id: string, partial: Partial<FeedPost>) => void;
  onRemove: (id: string) => void;
  onComments: (post: FeedPost) => void;
}

export function PostCard({ post, onUpdate, onRemove, onComments }: Props) {
  const { user } = useAuth();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(async () => {
    if (!user) return;
    const newLiked = !post.liked;
    onUpdate(post.id, {
      liked: newLiked,
      like_count: post.like_count + (newLiked ? 1 : -1),
    });
    if (newLiked) {
      Animated.sequence([
        Animated.spring(heartAnim, { toValue: 1.35, useNativeDriver: true }),
        Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
    await toggleLike(post.id, user.id, post.liked);
  }, [post, user, heartAnim, onUpdate]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const newSaved = !post.saved;
    onUpdate(post.id, { saved: newSaved, save_count: post.save_count + (newSaved ? 1 : -1) });
    await toggleSave(post.id, user.id, post.saved);
  }, [post, user, onUpdate]);

  const handleDelete = useCallback(async () => {
    setMenuOpen(false);
    await deletePost(post.id);
    onRemove(post.id);
  }, [post.id, onRemove]);

  const isOwn = user?.id === post.author_id;
  const hasMedia = post.media.length > 0;
  const captionLong = (post.caption?.length ?? 0) > 120;

  return (
    <View style={s.card}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <AvatarBubble name={post.author_name} avatar={post.author_avatar} />
        <View style={s.headerInfo}>
          <View style={s.nameRow}>
            <Text style={s.authorName} numberOfLines={1}>{post.author_name ?? 'Athlete'}</Text>
            <BadgeCheck color={Colors.primary} size={14} />
          </View>
          <Text style={s.authorMeta} numberOfLines={1}>
            {[post.author_position, post.author_sport].filter(Boolean).join(' · ')}
          </Text>
          <Text style={s.timeAgo}>{postTimeAgo(post.created_at)}</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuOpen((p) => !p)} hitSlop={8} style={s.menuBtn}>
          <MoreHorizontal color={Colors.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      {/* ── Menu ──────────────────────────────────────────────────────────────── */}
      {menuOpen && (
        <View style={s.menu}>
          {isOwn ? (
            <>
              <TouchableOpacity style={s.menuItem} onPress={() => setMenuOpen(false)}>
                <Edit3 color={Colors.textPrimary} size={16} />
                <Text style={s.menuTxt}>Edit post</Text>
              </TouchableOpacity>
              <View style={s.menuDiv} />
              <TouchableOpacity style={s.menuItem} onPress={handleDelete}>
                <Trash2 color={Colors.error} size={16} />
                <Text style={[s.menuTxt, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.menuItem} onPress={() => setMenuOpen(false)}>
              <Flag color={Colors.warning} size={16} />
              <Text style={[s.menuTxt, { color: Colors.warning }]}>Report</Text>
            </TouchableOpacity>
          )}
          <View style={s.menuDiv} />
          <TouchableOpacity style={s.menuItem} onPress={() => { handleSave(); setMenuOpen(false); }}>
            <Bookmark color={Colors.textPrimary} size={16} />
            <Text style={s.menuTxt}>{post.saved ? 'Unsave' : 'Save'}</Text>
          </TouchableOpacity>
          <View style={s.menuDiv} />
          <TouchableOpacity style={s.menuItem} onPress={() => setMenuOpen(false)}>
            <MoreHorizontal color={Colors.textMuted} size={16} />
            <Text style={s.menuTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Media carousel ──────────────────────────────────────────────────── */}
      {hasMedia && (
        <View style={s.mediaWrap}>
          <MediaCarousel
            items={post.media}
            currentIdx={mediaIdx}
            onChangeIdx={setMediaIdx}
          />
          {post.media.length > 1 && (
            <View style={s.dotRow}>
              {post.media.map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, i === mediaIdx && s.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Caption ─────────────────────────────────────────────────────────── */}
      {post.caption && (
        <View style={s.captionWrap}>
          <Text style={s.caption} numberOfLines={captionExpanded ? undefined : 3}>
            <Text style={s.authorNameInline}>{post.author_name ?? 'Athlete'} </Text>
            {post.caption}
          </Text>
          {captionLong && !captionExpanded && (
            <TouchableOpacity onPress={() => setCaptionExpanded(true)}>
              <Text style={s.moreTxt}>...more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Tags ────────────────────────────────────────────────────────────── */}
      {post.tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tagRow}>
          {post.tags.map((tag, i) => <TagChip key={i} tag={tag} />)}
        </ScrollView>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <View style={s.actionBar}>
        <View style={s.actionLeft}>
          <TouchableOpacity style={s.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Heart
                color={post.liked ? Colors.error : Colors.textMuted}
                fill={post.liked ? Colors.error : 'transparent'}
                size={22}
              />
            </Animated.View>
            <Text style={[s.actionCount, post.liked && s.actionCountActive]}>
              {formatCount(post.like_count)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} onPress={() => onComments(post)}>
            <MessageCircle color={Colors.textMuted} size={22} />
            <Text style={s.actionCount}>{formatCount(post.comment_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn}>
            <Share2 color={Colors.textMuted} size={22} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.actionBtn} onPress={handleSave}>
          <Bookmark
            color={post.saved ? Colors.accent : Colors.textMuted}
            fill={post.saved ? Colors.accent : 'transparent'}
            size={22}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── MediaCarousel ─────────────────────────────────────────────────────────────

function MediaCarousel({
  items,
  currentIdx,
  onChangeIdx,
}: {
  items: FeedPost['media'];
  currentIdx: number;
  onChangeIdx: (i: number) => void;
}) {
  const item = items[currentIdx];
  const isVideo = item?.type === 'video';

  return (
    <View style={mc.wrap}>
      {item?.signed_url ? (
        isVideo ? (
          <VideoPoster uri={item.signed_url} />
        ) : (
          <Image source={{ uri: item.signed_url }} style={mc.img} resizeMode="cover" />
        )
      ) : (
        <LinearGradient
          colors={[Colors.elevated, Colors.surface]}
          style={mc.img}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      {items.length > 1 && (
        <>
          {currentIdx > 0 && (
            <TouchableOpacity style={mc.prev} onPress={() => onChangeIdx(currentIdx - 1)}>
              <ChevronLeft color={Colors.white} size={22} />
            </TouchableOpacity>
          )}
          {currentIdx < items.length - 1 && (
            <TouchableOpacity style={mc.next} onPress={() => onChangeIdx(currentIdx + 1)}>
              <ChevronRight color={Colors.white} size={22} />
            </TouchableOpacity>
          )}
          <View style={mc.counter}>
            <Text style={mc.counterTxt}>{currentIdx + 1}/{items.length}</Text>
          </View>
        </>
      )}
    </View>
  );
}

function VideoPoster({ uri }: { uri: string }) {
  return (
    <View style={mc.wrap}>
      <Image source={{ uri }} style={mc.img} resizeMode="cover" />
      <View style={mc.videoOverlay}>
        <View style={mc.playBtn}>
          <Play color={Colors.white} size={28} fill={Colors.white} />
        </View>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  wrap: { width: CARD_W, height: MEDIA_H, position: 'relative', backgroundColor: Colors.elevated, borderRadius: Radii.md, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  prev: { position: 'absolute', left: 8, top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  next: { position: 'absolute', right: 8, top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  counterTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.white },
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function AvatarBubble({ name, avatar }: { name: string | null | undefined; avatar: string | null | undefined }) {
  if (avatar) {
    return <Image source={{ uri: avatar }} style={s.avatar} />;
  }
  return (
    <View style={[s.avatar, s.avatarDefault]}>
      <Text style={s.avatarInitial}>{name?.[0]?.toUpperCase() ?? 'A'}</Text>
    </View>
  );
}

const TAG_COLORS: Record<PostTag['type'], string> = {
  sport: Colors.primaryDim,
  attribute: Colors.accentDim,
  location: Colors.elevated,
  open_to_trials: `${Colors.success}20`,
  match: `${Colors.warning}20`,
};

const TAG_TEXT_COLORS: Record<PostTag['type'], string> = {
  sport: Colors.primary,
  attribute: Colors.accent,
  location: Colors.textMuted,
  open_to_trials: Colors.success,
  match: Colors.warning,
};

function TagChip({ tag }: { tag: PostTag }) {
  return (
    <View style={[s.chip, { backgroundColor: TAG_COLORS[tag.type] ?? Colors.elevated }]}>
      <Text style={[s.chipTxt, { color: TAG_TEXT_COLORS[tag.type] ?? Colors.textMuted }]}>
        {tag.type === 'open_to_trials' ? 'Open to Trials' : tag.value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarDefault: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg, color: Colors.white },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  authorMeta: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 1 },
  timeAgo: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled, marginTop: 1 },
  menuBtn: { padding: 4 },

  menu: {
    position: 'absolute', right: Spacing.lg, top: 52, zIndex: 100,
    backgroundColor: Colors.elevated, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border, minWidth: 160, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  menuDiv: { height: 1, backgroundColor: Colors.border },
  menuTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textPrimary },

  mediaWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 18 },

  captionWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  caption: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: 20 },
  authorNameInline: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  moreTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },

  tagRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  chip: { borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  chipTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionCount: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  actionCountActive: { color: Colors.error },
});
