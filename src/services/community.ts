import { supabase } from './supabase';

export type CommunityPost = {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; avatar: string } | null;
  likes: { user_id: string }[];
};

export async function fetchFeed(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, user_id, photo_url, caption, created_at, profiles(username, avatar), likes(user_id)')
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

export async function createPost(userId: string, photoUri: string, caption: string): Promise<void> {
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
  });
  if (insertError) throw insertError;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}
