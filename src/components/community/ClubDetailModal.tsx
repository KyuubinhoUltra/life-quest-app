import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CreatePostModal } from '@/components/CreatePostModal';
import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  Club,
  CommunityPost,
  deletePost,
  fetchClubMemberCount,
  fetchClubPosts,
  joinClub,
  leaveClub,
  toggleLike,
} from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';
import { PostFeedList } from './PostFeedList';

export function ClubDetailModal({
  club,
  isMember,
  onClose,
  onMembershipChanged,
}: {
  club: Club | null;
  isMember: boolean;
  onClose: () => void;
  onMembershipChanged: () => void;
}) {
  const router = useRouter();
  const { session } = useCommunityAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!club) return;
    try {
      const [p, c] = await Promise.all([fetchClubPosts(club.id), fetchClubMemberCount(club.id)]);
      setPosts(p);
      setMemberCount(c);
    } catch {
      // membros que saíram de um clube deixam de ter acesso aos posts dele; feed fica vazio nesse caso
    }
  }, [club]);

  useEffect(() => {
    load();
  }, [load]);

  if (!club) return null;

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLike = async (post: CommunityPost) => {
    if (!session) return;
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

  const handleDelete = (post: CommunityPost) => {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    deletePost(post.id).catch(() => load());
  };

  const toggleMembership = async () => {
    if (!session) return;
    setBusy(true);
    try {
      if (isMember) {
        await leaveClub(club.id, session.user.id);
      } else {
        await joinClub(club.id, session.user.id);
      }
      onMembershipChanged();
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!club} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>
              {club.icon} {club.name}
            </Text>
            <View style={{ width: 34 }} />
          </View>

          {!!club.description && <SubText style={styles.description}>{club.description}</SubText>}
          <SubText style={styles.memberCount}>
            {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
          </SubText>

          <PillButton
            label={busy ? 'Aguarde…' : isMember ? 'Sair do clube' : 'Entrar no clube'}
            variant={isMember ? 'ghost' : 'solid'}
            disabled={busy || !session}
            onPress={toggleMembership}
            style={{ marginTop: 12 }}
          />

          {isMember && (
            <PillButton
              label="+ Novo post no clube"
              variant="ghost"
              onPress={() => setCreateOpen(true)}
              style={{ marginTop: 10 }}
            />
          )}

          <View style={styles.listWrap}>
            <PostFeedList
              posts={posts}
              currentUserId={session?.user.id}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onLike={handleLike}
              onDelete={handleDelete}
              onPressUser={(id) => {
                onClose();
                router.push({ pathname: '/perfil/[id]', params: { id } });
              }}
              emptyText={isMember ? 'Nenhum post neste clube ainda.' : 'Entre no clube pra ver os posts.'}
            />
          </View>
        </View>
      </View>

      <CreatePostModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} clubId={club.id} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: {
    maxHeight: '88%',
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { textAlign: 'center', marginTop: 12 },
  memberCount: { textAlign: 'center', marginTop: 4 },
  listWrap: { flexShrink: 1, marginTop: 8 },
});
