
'use client';

import type { UserProfileFormValues } from '@/lib/schemas';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth'; // Import useAuth

// const USER_PROFILE_KEY_PREFIX = 'nutrisnap_user_profile_'; // No longer used
const USERS_STORAGE_KEY = 'nutritional_app_users'; // Matches useAuth

interface StoredUser {
  email: string;
  // other auth fields if any
  profile: UserProfileFormValues; // This now includes apiKey
}

export function useUserProfile() {
  const { currentUser, updateUserProfileInAuth, isLoading: authIsLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(authIsLoading);
    if (!authIsLoading && currentUser) {
      // Ensure profile includes apiKey from currentUser.profile
      setProfile(currentUser.profile);
    } else if (!authIsLoading && !currentUser) {
      setProfile(null); // No user logged in, so no profile
    }
  }, [currentUser, authIsLoading]);

  const saveProfile = useCallback((newProfileData: UserProfileFormValues) => {
    if (currentUser) {
      const profileToSave: UserProfileFormValues = {
        name: newProfileData.name || "",
        age: newProfileData.age === null || newProfileData.age === undefined ? undefined : Number(newProfileData.age),
        weight: newProfileData.weight === null || newProfileData.weight === undefined ? undefined : Number(newProfileData.weight),
        height: newProfileData.height === null || newProfileData.height === undefined ? undefined : Number(newProfileData.height),
        dietaryRestrictions: newProfileData.dietaryRestrictions || "",
        activityLevel: newProfileData.activityLevel || "",
        apiKey: newProfileData.apiKey || "", // Save apiKey
      };
      updateUserProfileInAuth(profileToSave); // Update in Auth context and localStorage
      setProfile(profileToSave); // Update local state
    } else {
      console.error("Não é possível salvar o perfil: nenhum usuário logado.");
    }
  }, [currentUser, updateUserProfileInAuth]);

  return { profile, saveProfile, isLoading };
}
