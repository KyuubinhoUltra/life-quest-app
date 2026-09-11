import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthModal } from '@/components/AuthModal';
import { ClubDetailModal } from '@/components/community/ClubDetailModal';
import { LoginPrompt } from '@/components/community/LoginPrompt';
import { PostFeedList } from '@/components/community/PostFeedList';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ProgressoTab } from '@/components/profile/ProgressoTab';
import { ChevronLeftIcon } from '@/components/TabIcon';
import { Card, PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  Club,
  CommunityPost,
  deletePost,
  fetchFollowerIds,
  fetchFollowingIds,
  fetchMyClubs,
  fetchPostsByUser,
  fetchProfileById,
  followUser,
  Profile,
  toggleLike,
  unfollowUser,
} from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

type TabKey = 'todos' | 'progresso' | 'clubes';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'progresso', label: 'Progresso' },
  { key: 'clubes', label: 'Clubes' },
];

function streakFromPosts(posts: CommunityPost[]): number {
  const days = new Set(posts.map((p) => p.created_at.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function ProfileScreen({ userId, isOwnProfile }: { userId?: string; isOwnProfile: boolean }) {
  const router = useRouter();
  const { session } = useCommunityAuth();
  const viewerId = session?.user.id;

  const [tab, setTab] = useState<TabKey>('todos');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [viewerClubIds, setViewerClubIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const requireAuth = () => setAuthOpen(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const tasks: Promise<void>[] = [
      fetchProfileById(userId).then(setProfile),
      fetchPostsByUser(userId).then(setPosts),
      fetchFollowerIds(userId).then((followers) => {
        setFollowerCount(followers.length);
        setIsFollowing(!!viewerId && followers.includes(viewerId));
      }),
      fetchFollowingIds(userId).then((following) => setFollowingCount(following.length)),
      fetchMyClubs(userId).then((myClubs) => {
        setClubs(myClubs);
        if (!viewerId || viewerId === userId) setViewerClubIds(new Set(myClubs.map((c) => c.id)));
      }),
    ];
    if (viewerId && viewerId !== userId) {
      tasks.push(fetchMyClubs(viewerId).then((theirs) => setViewerClubIds(new Set(theirs.map((c) => c.id)))));
    }
    await Promise.allSettled(tasks);
  }, [userId, viewerId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLike = async (post: CommunityPost) => {
    if (!viewerId) {
      requireAuth();
      return;
    }
    const liked = post.likes.some((l) => l.user_id === viewerId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes: liked ? p.likes.filter((l) => l.user_id !== viewerId) : [...p.likes, { user_id: viewerId }] }
          : p
      )
    );
    try {
      await toggleLike(post.id, viewerId, liked);
    } catch {
      load();
    }
  };

  const handleDelete = (post: CommunityPost) => {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    deletePost(post.id).catch(() => load());
  };

  const toggleFollow = async () => {
    if (!viewerId || !userId) {
      requireAuth();
      return;
    }
    setIsFollowing((v) => !v);
    setFollowerCount((c) => c + (isFollowing ? -1 : 1));
    try {
      if (isFollowing) await unfollowUser(viewerId, userId);
      else await followUser(viewerId, userId);
    } catch {
      load();
    }
  };

  const onInvite = () => Alert.alert('Em breve', 'Convidar amigos direto pelo app ainda não está disponível.');

  const displayAvatar = profile?.avatar ?? '💪';
  const displayName = profile?.username ?? (isOwnProfile ? 'Você' : 'Usuário');
  const streak = streakFromPosts(posts);

  return (
    <View style={styles.screen}>
      {!isOwnProfile && (
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeftIcon color={LQ.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <View style={{ width: 34 }} />
        </View>
      )}

      <View style={styles.identityRow}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 30 }}>{displayAvatar}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statFigure}>{followerCount}</Text>
            <SubText>Seguidores</SubText>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statFigure}>{followingCount}</Text>
            <SubText>Seguindo</SubText>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statFigure}>{streak}</Text>
            <SubText>Sequência</SubText>
          </View>
        </View>
      </View>

      {isOwnProfile && <Text style={styles.ownName}>{displayName}</Text>}

      <View style={styles.actionsRow}>
        {isOwnProfile ? (
          userId ? (
            <PillButton label="Editar perfil" variant="ghost" onPress={() => setEditOpen(true)} style={{ flex: 1 }} />
          ) : (
            <PillButton label="Entrar / Criar conta" onPress={requireAuth} style={{ flex: 1 }} />
          )
        ) : (
          <>
            <PillButton
              label={isFollowing ? 'Seguindo' : 'Seguir'}
              variant={isFollowing ? 'ghost' : 'solid'}
              onPress={toggleFollow}
              style={{ flex: 1 }}
            />
            <PillButton label="Convidar" variant="ghost" onPress={onInvite} style={{ flex: 1 }} />
          </>
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'todos' &&
          (userId ? (
            <PostFeedList
              posts={posts}
              currentUserId={viewerId}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onLike={handleLike}
              onDelete={handleDelete}
              emptyText={isOwnProfile ? 'Você ainda não postou nada.' : 'Nenhum post ainda.'}
            />
          ) : (
            <LoginPrompt onLogin={requireAuth} />
          ))}

        {tab === 'progresso' &&
          (isOwnProfile ? (
            <ProgressoTab />
          ) : (
            <View style={{ padding: 16 }}>
              <Card>
                <SubText style={{ textAlign: 'center' }}>
                  O progresso de personagem ainda é local a cada aparelho — só é possível ver o seu próprio.
                </SubText>
              </Card>
            </View>
          ))}

        {tab === 'clubes' &&
          (userId ? (
            <ScrollView contentContainerStyle={styles.clubsContent}>
              {clubs.length === 0 && (
                <SubText style={{ textAlign: 'center', marginTop: 20 }}>
                  {isOwnProfile ? 'Você ainda não entrou em nenhum clube.' : 'Nenhum clube ainda.'}
                </SubText>
              )}
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
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <LoginPrompt onLogin={requireAuth} />
          ))}
      </View>

      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
      <EditProfileModal visible={editOpen} profile={profile} onClose={() => setEditOpen(false)} onSaved={load} />
      <ClubDetailModal
        club={selectedClub}
        isMember={!!selectedClub && viewerClubIds.has(selectedClub.id)}
        onClose={() => setSelectedClub(null)}
        onMembershipChanged={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LQ.line,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 16 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center' },
  statFigure: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 18, fontWeight: '700' },
  ownName: {
    color: LQ.ink,
    fontFamily: LQ.fontDisplay,
    fontSize: 16,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LQ.line, paddingHorizontal: 8, marginTop: 4 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: LQ.gold },
  tabLabel: { color: LQ.inkFaint, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  tabLabelActive: { color: LQ.gold },
  clubsContent: { padding: 16, paddingBottom: 40 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  clubIcon: { fontSize: 24 },
  clubName: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
});
