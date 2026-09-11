import React from 'react';

import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

export default function PersonagemScreen() {
  const { session } = useCommunityAuth();
  return <ProfileScreen userId={session?.user.id} isOwnProfile />;
}
