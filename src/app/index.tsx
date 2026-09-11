import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthModal } from '@/components/AuthModal';
import { ClubDetailModal } from '@/components/community/ClubDetailModal';
import { CreateClubModal } from '@/components/community/CreateClubModal';
import { PostFeedList } from '@/components/community/PostFeedList';
import { LoginPrompt } from '@/components/community/LoginPrompt';
import { CreatePostModal } from '@/components/CreatePostModal';
import { Card, PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  Club,
  CommunityPost,
  deletePost,
  fetchClubs,
  fetchFeed,
  fetchFollowingFeed,
  fetchFollowingIds,
  fetchFriends,
  fetchMyClubs,
  followUser,
  Profile,
  toggleLike,
  unfollowUser,
} from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

type TabKey = 'feed' | 'clubes' | 'seguindo' | 'amigos';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'clubes', label: 'Clubes' },
  { key: 'seguindo', label: 'Seguindo' },
  { key: 'amigos', label: 'Amigos' },
];

export default function ComunidadeScreen() {
  const router = useRouter();
  const { session } = useCommunityAuth();
  const userId = session?.user.id;
  const goToProfile = (id: string) => router.push({ pathname: '/perfil/[id]', params: { id } });

  const [tab, setTab] = useState<TabKey>('feed');
  const [authOpen, setAuthOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createClubOpen, setCreateClubOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<CommunityPost[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const requireAuth = () => setAuthOpen(true);

  const loadFollowingIds = useCallback(async () => {
    if (!userId) {
      setFollowingIds(new Set());
      return;
    }
    try {
      setFollowingIds(new Set(await fetchFollowingIds(userId)));
    } catch {
      // sem seguidores carregados; botões de "seguir" continuam funcionando, só não refletem o estado atual
    }
  }, [userId]);

  const loadFeed = useCallback(async () => {
    try {
      setFeedPosts(await fetchFeed());
    } catch {
      // feed fica vazio se a consulta falhar
    }
  }, []);

  const loadFollowingFeed = useCallback(async () => {
    if (!userId) return;
    try {
      setFollowingPosts(await fetchFollowingFeed(userId));
    } catch {
      // idem
    }
  }, [userId]);

  const loadClubs = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([fetchClubs(), userId ? fetchMyClubs(userId) : Promise.resolve([])]);
      setClubs(all);
      setMyClubIds(new Set(mine.map((c) => c.id)));
    } catch {
      // idem
    }
  }, [userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    try {
      setFriends(await fetchFriends(userId));
    } catch {
      // idem
    }
  }, [userId]);

  useEffect(() => {
    loadFollowingIds();
  }, [loadFollowingIds]);

  useEffect(() => {
    if (tab === 'feed') loadFeed();
    if (tab === 'clubes') loadClubs();
    if (tab === 'seguindo') loadFollowingFeed();
    if (tab === 'amigos') loadFriends();
  }, [tab, loadFeed, loadClubs, loadFollowingFeed, loadFriends]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'feed') await loadFeed();
    if (tab === 'clubes') await loadClubs();
    if (tab === 'seguindo') await loadFollowingFeed();
    if (tab === 'amigos') await loadFriends();
    setRefreshing(false);
  };

  const handleLike = async (post: CommunityPost, setter: React.Dispatch<React.SetStateAction<CommunityPost[]>>) => {
    if (!userId) {
      requireAuth();
      return;
    }
    const liked = post.likes.some((l) => l.user_id === userId);
    setter((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes: liked ? p.likes.filter((l) => l.user_id !== userId) : [...p.likes, { user_id: userId }] }
          : p
      )
    );
    try {
      await toggleLike(post.id, userId, liked);
    } catch {
      if (tab === 'feed') loadFeed();
      if (tab === 'seguindo') loadFollowingFeed();
    }
  };

  const handleDelete = (post: CommunityPost, setter: React.Dispatch<React.SetStateAction<CommunityPost[]>>) => {
    setter((prev) => prev.filter((p) => p.id !== post.id));
    deletePost(post.id).catch(() => {
      if (tab === 'feed') loadFeed();
      if (tab === 'seguindo') loadFollowingFeed();
    });
  };

  const handleToggleFollow = async (post: CommunityPost) => {
    if (!userId) {
      requireAuth();
      return;
    }
    const already = followingIds.has(post.user_id);
    setFollowingIds((prev) => {
      const next = new Set(prev);
      already ? next.delete(post.user_id) : next.add(post.user_id);
      return next;
    });
    try {
      if (already) await unfollowUser(userId, post.user_id);
      else await followUser(userId, post.user_id);
    } catch {
      loadFollowingIds();
    }
  };

  const handleNewPost = () => {
    if (!userId) {
      requireAuth();
      return;
    }
    setCreateOpen(true);
  };

  const handleNewClub = () => {
    if (!userId) {
      requireAuth();
      return;
    }
    setCreateClubOpen(true);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'feed' && (
        <PostFeedList
          posts={feedPosts}
          currentUserId={userId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLike={(p) => handleLike(p, setFeedPosts)}
          onDelete={(p) => handleDelete(p, setFeedPosts)}
          followingIds={followingIds}
          onToggleFollow={handleToggleFollow}
          onPressUser={goToProfile}
          emptyText="Nenhum post ainda. Seja o primeiro a compartilhar um treino!"
          ListHeaderComponent={
            <PillButton label="+ Novo post" onPress={handleNewPost} style={{ width: '100%', marginBottom: 16 }} />
          }
        />
      )}

      {tab === 'clubes' && (
        <View style={{ flex: 1 }}>
          <View style={styles.clubsContent}>
            <PillButton label="+ Criar clube" onPress={handleNewClub} style={{ width: '100%', marginBottom: 12 }} />
            {clubs.length === 0 && <SubText style={{ textAlign: 'center', marginTop: 20 }}>Nenhum clube criado ainda.</SubText>}
            {clubs.map((c) => (
              <Pressable key={c.id} onPress={() => setSelectedClub(c)}>
                <Card style={styles.clubCard}>
                  <Text style={styles.clubIcon}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clubName}>{c.name}</Text>
                    {!!c.description && (
                      <SubText numberOfLines={1} style={{ marginTop: 2 }}>
                        {c.description}
                      </SubText>
                    )}
                  </View>
                  {myClubIds.has(c.id) && <Text style={styles.memberTag}>Membro</Text>}
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {tab === 'seguindo' &&
        (userId ? (
          <PostFeedList
            posts={followingPosts}
            currentUserId={userId}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onLike={(p) => handleLike(p, setFollowingPosts)}
            onDelete={(p) => handleDelete(p, setFollowingPosts)}
            onPressUser={goToProfile}
            emptyText="Você ainda não segue ninguém, ou quem você segue não postou nada. Siga alguém no Feed!"
          />
        ) : (
          <LoginPrompt onLogin={requireAuth} />
        ))}

      {tab === 'amigos' &&
        (userId ? (
          <View style={styles.clubsContent}>
            {friends.length === 0 ? (
              <SubText style={{ textAlign: 'center', marginTop: 20 }}>
                Amigos são pessoas que seguem você de volta. Ninguém ainda por aqui.
              </SubText>
            ) : (
              friends.map((f) => (
                <Pressable key={f.id} onPress={() => goToProfile(f.id)}>
                  <Card style={styles.friendCard}>
                    <Text style={styles.clubIcon}>{f.avatar}</Text>
                    <Text style={styles.clubName}>{f.username}</Text>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <LoginPrompt onLogin={requireAuth} />
        ))}

      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
      <CreatePostModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadFeed} />
      <CreateClubModal visible={createClubOpen} onClose={() => setCreateClubOpen(false)} onCreated={loadClubs} />
      <ClubDetailModal
        club={selectedClub}
        isMember={!!selectedClub && myClubIds.has(selectedClub.id)}
        onClose={() => setSelectedClub(null)}
        onMembershipChanged={loadClubs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LQ.line, paddingHorizontal: 8 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: LQ.gold },
  tabLabel: { color: LQ.inkFaint, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  tabLabelActive: { color: LQ.gold },
  clubsContent: { padding: 16, paddingBottom: 40 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  clubIcon: { fontSize: 24 },
  clubName: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  memberTag: { color: LQ.gold, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  friendCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
});
