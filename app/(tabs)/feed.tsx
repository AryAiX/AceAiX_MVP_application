import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { StoriesTray } from '@/components/stories/StoriesTray';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { StoryCreator } from '@/components/stories/StoryCreator';
import { PostCard } from '@/components/posts/PostCard';
import { PostComposer } from '@/components/posts/PostComposer';
import { CommentsSheet } from '@/components/posts/CommentsSheet';
import { StoryAuthorGroup } from '@/lib/storiesService';
import { FeedPost, fetchFeedPosts } from '@/lib/postsService';
import { useStoriesContext } from '@/context/StoriesContext';
import { useAuth } from '@/context/AuthContext';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { refresh: refreshStories } = useStoriesContext();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);

  // Modals
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerGroups, setViewerGroups] = useState<StoryAuthorGroup[]>([]);
  const [viewerStart, setViewerStart] = useState(0);
  const [storyCreatorVisible, setStoryCreatorVisible] = useState(false);
  const [postComposerVisible, setPostComposerVisible] = useState(false);
  const [commentPost, setCommentPost] = useState<FeedPost | null>(null);

  const loadPosts = useCallback(async (reset = false) => {
    if (!user) return;
    const cursor = reset ? undefined : cursorRef.current;
    const data = await fetchFeedPosts(user.id, cursor);
    if (data.length > 0) cursorRef.current = data[data.length - 1].created_at;
    hasMoreRef.current = data.length === 20;
    setPosts((prev) => (reset ? data : [...prev, ...data]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadPosts(true).finally(() => setLoading(false));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    await Promise.all([loadPosts(true), refreshStories()]);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    await loadPosts(false);
    setLoadingMore(false);
  };

  const handlePostUpdate = useCallback((id: string, partial: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...partial } : p)));
  }, []);

  const handlePostDeleted = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCommentAdded = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
    );
  }, []);

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? 'U';

  const ListHeader = (
    <>
      <StoriesTray
        onOpenViewer={(groups, idx) => {
          setViewerGroups(groups);
          setViewerStart(idx);
          setViewerVisible(true);
        }}
        onOpenCreator={() => setStoryCreatorVisible(true)}
      />
      <TouchableOpacity style={s.composeBar} onPress={() => setPostComposerVisible(true)}>
        <View style={s.composeAvatar}>
          <Text style={s.composeAvatarTxt}>{initial}</Text>
        </View>
        <Text style={s.composePlaceholder}>Share a moment or post…</Text>
        <Camera color={Colors.primary} size={20} />
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <AppHeader title="Feed" />

      {loading ? (
        <View style={{ flex: 1 }}>
          {ListHeader}
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onUpdate={handlePostUpdate}
              onRemove={handlePostDeleted}
              onComments={setCommentPost}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyFeed />}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.xl }} />
            ) : null
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}

      <StoryViewer
        visible={viewerVisible}
        groups={viewerGroups}
        startGroupIndex={viewerStart}
        onClose={() => setViewerVisible(false)}
      />

      <StoryCreator
        visible={storyCreatorVisible}
        onClose={() => setStoryCreatorVisible(false)}
        onPosted={async () => {
          setStoryCreatorVisible(false);
          await refreshStories();
        }}
      />

      <PostComposer
        visible={postComposerVisible}
        postType="post"
        onClose={() => setPostComposerVisible(false)}
        onPosted={async () => {
          setPostComposerVisible(false);
          cursorRef.current = undefined;
          await loadPosts(true);
        }}
      />

      <CommentsSheet
        post={commentPost}
        onClose={() => setCommentPost(null)}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}

function EmptyFeed() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>Nothing here yet</Text>
      <Text style={s.emptyBody}>Follow athletes or post your first update to get started.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingBottom: Spacing.xxxl },

  composeBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.lg, gap: Spacing.md,
  },
  composeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  composeAvatarTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.white },
  composePlaceholder: { flex: 1, fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textDisabled },

  empty: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingHorizontal: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.xl, color: Colors.textMuted },
  emptyBody: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textDisabled, textAlign: 'center', lineHeight: 20 },
});
