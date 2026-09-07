import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AuthModal } from '@/components/AuthModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { FlameIcon } from '@/components/FlameIcon';
import { Card, PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { CommunityPost, deletePost, fetchFeed, toggleLike } from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

export default function ComunidadeScreen() {
  const { session } = useCommunityAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchFeed();
      setPosts(data);
    } catch {
      // feed fica vazio se a rede/consulta falhar; o pull-to-refresh permite tentar de novo
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLike = async (post: CommunityPost) => {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    const userId = session.user.id;
    const liked = post.likes.some((l) => l.user_id === userId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes: liked ? p.likes.filter((l) => l.user_id !== userId) : [...p.likes, { user_id: userId }] }
          : p
      )
    );
    try {
      await toggleLike(post.id, userId, liked);
    } catch {
      load();
    }
  };

  const handleNewPost = () => {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    setCreateOpen(true);
  };

  const handleDelete = (post: CommunityPost) => {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    deletePost(post.id).catch(() => load());
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LQ.gold} />}
        ListHeaderComponent={
          <PillButton label="+ Novo post" onPress={handleNewPost} style={{ width: '100%', marginBottom: 16 }} />
        }
        ListEmptyComponent={
          !loading ? (
            <SubText style={{ textAlign: 'center', marginTop: 20 }}>
              Nenhum post ainda. Seja o primeiro a compartilhar um treino!
            </SubText>
          ) : null
        }
        renderItem={({ item }) => {
          const liked = !!session && item.likes.some((l) => l.user_id === session.user.id);
          const isMine = session?.user.id === item.user_id;
          return (
            <Card style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.avatar}>{item.profiles?.avatar ?? '💪'}</Text>
                <Text style={styles.username}>{item.profiles?.username ?? 'Usuário'}</Text>
                {isMine && (
                  <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                    <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
                  </Pressable>
                )}
              </View>
              <Image source={{ uri: item.photo_url }} style={styles.photo} />
              {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
              <Pressable onPress={() => handleLike(item)} style={styles.likeRow} hitSlop={8}>
                <FlameIcon size={18} lit={liked} gradId={`feedLike-${item.id}`} />
                <Text style={[styles.likeCount, liked && styles.likeCountActive]}>{item.likes.length}</Text>
              </Pressable>
            </Card>
          );
        }}
      />

      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
      <CreatePostModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, paddingBottom: 40 },
  postCard: { marginBottom: 16, padding: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { fontSize: 20 },
  username: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: LQ.radius, backgroundColor: LQ.lineSoft },
  caption: { color: LQ.inkSoft, fontSize: 13, marginTop: 10 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  likeCount: { color: LQ.inkFaint, fontSize: 12, fontFamily: LQ.fontMono },
  likeCountActive: { color: LQ.gold },
});
