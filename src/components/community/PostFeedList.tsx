import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { FlameIcon } from '@/components/FlameIcon';
import { Card, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { CommunityPost } from '@/services/community';

export function PostFeedList({
  posts,
  currentUserId,
  refreshing,
  onRefresh,
  onLike,
  onDelete,
  emptyText,
  ListHeaderComponent,
  followingIds,
  onToggleFollow,
  onPressUser,
}: {
  posts: CommunityPost[];
  currentUserId?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onLike: (post: CommunityPost) => void;
  onDelete: (post: CommunityPost) => void;
  emptyText: string;
  ListHeaderComponent?: React.ReactElement;
  followingIds?: Set<string>;
  onToggleFollow?: (post: CommunityPost) => void;
  onPressUser?: (userId: string) => void;
}) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LQ.gold} />}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={<SubText style={{ textAlign: 'center', marginTop: 20 }}>{emptyText}</SubText>}
      renderItem={({ item }) => {
        const liked = !!currentUserId && item.likes.some((l) => l.user_id === currentUserId);
        const isMine = currentUserId === item.user_id;
        const following = !!followingIds && followingIds.has(item.user_id);
        return (
          <Card style={styles.postCard}>
            <Pressable
              style={styles.postHeader}
              disabled={!onPressUser}
              onPress={() => onPressUser?.(item.user_id)}>
              <Text style={styles.avatar}>{item.profiles?.avatar ?? '💪'}</Text>
              <Text style={styles.username}>{item.profiles?.username ?? 'Usuário'}</Text>
              {!isMine && onToggleFollow && !!currentUserId && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFollow(item);
                  }}
                  style={styles.followBtn}
                  hitSlop={6}>
                  <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                    {following ? 'Seguindo' : 'Seguir'}
                  </Text>
                </Pressable>
              )}
              {isMine && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  hitSlop={8}
                  style={{ marginLeft: 'auto' }}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
                </Pressable>
              )}
            </Pressable>
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
            {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
            <Pressable onPress={() => onLike(item)} style={styles.likeRow} hitSlop={8}>
              <FlameIcon size={18} lit={liked} gradId={`feedLike-${item.id}`} />
              <Text style={[styles.likeCount, liked && styles.likeCountActive]}>{item.likes.length}</Text>
            </Pressable>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  postCard: { marginBottom: 16, padding: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { fontSize: 20 },
  username: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13 },
  followBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  followBtnText: { color: LQ.gold, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  followBtnTextActive: { color: LQ.inkFaint },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: LQ.radius, backgroundColor: LQ.lineSoft },
  caption: { color: LQ.inkSoft, fontSize: 13, marginTop: 10 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  likeCount: { color: LQ.inkFaint, fontSize: 12, fontFamily: LQ.fontMono },
  likeCountActive: { color: LQ.gold },
});
