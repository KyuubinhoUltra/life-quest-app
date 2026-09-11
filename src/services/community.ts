import { supabase } from './supabase';

export type CommunityPost = {
  id: string;
  user_id: string;
  club_id: string | null;
  photo_url: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; avatar: string } | null;
  likes: { user_id: string }[];
};

export type Club = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  creator_id: string;
  created_at: string;
};

export type Profile = { id: string; username: string; avatar: string };

const POST_SELECT = 'id, user_id, club_id, photo_url, caption, created_at, profiles!posts_user_id_fkey(username, avatar), likes(user_id)';

export async function fetchFeed(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .is('club_id', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as CommunityPost[]) ?? [];
}

export async function fetchClubPosts(clubId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as CommunityPost[]) ?? [];
}

export async function fetchPostsByUser(userId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as CommunityPost[]) ?? [];
}

export async function fetchFollowingFeed(userId: string): Promise<CommunityPost[]> {
  const followingIds = await fetchFollowingIds(userId);
  if (followingIds.length === 0) return [];
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .is('club_id', null)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as CommunityPost[]) ?? [];
}

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function createPost(userId: string, photoUri: string, caption: string, clubId?: string): Promise<void> {
  const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const response = await fetch(photoUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('workout-photos')
    .upload(fileName, blob, { contentType: `image/${fileExt}` });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('workout-photos').getPublicUrl(fileName);

  const { error: insertError } = await supabase.from('posts').insert({
    user_id: userId,
    photo_url: urlData.publicUrl,
    caption: caption.trim() || null,
    club_id: clubId ?? null,
  });
  if (insertError) throw insertError;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

// ---- clubs ----

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Club[]) ?? [];
}

export async function fetchMyClubs(userId: string): Promise<Club[]> {
  const { data, error } = await supabase.from('club_members').select('clubs(*)').eq('user_id', userId);
  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => row.clubs).filter(Boolean);
}

export async function fetchClubMemberCount(clubId: string): Promise<number> {
  const { count, error } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId);
  if (error) throw error;
  return count ?? 0;
}

export async function createClub(creatorId: string, name: string, icon: string, description: string): Promise<void> {
  const { error } = await supabase.from('clubs').insert({
    creator_id: creatorId,
    name: name.trim(),
    icon,
    description: description.trim() || null,
  });
  if (error) throw error;
}

export async function joinClub(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('club_members').insert({ club_id: clubId, user_id: userId });
  if (error) throw error;
}

export async function leaveClub(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
  if (error) throw error;
}

// ---- follows / amigos ----

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.following_id as string);
}

export async function fetchFollowerIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.follower_id as string);
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  if (error) throw error;
}

export async function fetchFriends(userId: string): Promise<Profile[]> {
  const [followingIds, followerIds] = await Promise.all([fetchFollowingIds(userId), fetchFollowerIds(userId)]);
  const followerSet = new Set(followerIds);
  const mutualIds = followingIds.filter((id) => followerSet.has(id));
  if (mutualIds.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('id, username, avatar').in('id', mutualIds);
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('id, username, avatar').in('id', ids);
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfile(userId: string, fields: { username?: string; avatar?: string }): Promise<void> {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw error;
}
