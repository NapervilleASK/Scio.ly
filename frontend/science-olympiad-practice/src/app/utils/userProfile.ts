import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define the structure of the user's profile data
export interface UserProfile {
  navbarStyle?: 'default' | 'golden' | 'rainbow';
  // Add other persistent user settings here if needed in the future
}

const defaultProfile: UserProfile = {
  navbarStyle: 'default',
};

// --- Local Storage Functions for Anonymous Users ---

const getLocalProfile = (): UserProfile => {
  const localProfile = localStorage.getItem('userProfile');
  if (localProfile) {
    try {
      // Merge with defaults to ensure all keys exist
      return { ...defaultProfile, ...JSON.parse(localProfile) };
    } catch (e) {
      console.error("Error parsing local profile:", e);
      return { ...defaultProfile }; // Return default on error
    }
  }
  return { ...defaultProfile };
};

const saveLocalProfile = (profile: UserProfile) => {
  localStorage.setItem('userProfile', JSON.stringify(profile));
};

// --- Firestore Functions for Logged-in Users ---

/**
 * Fetches the user's profile data.
 * Returns default profile if not found or for anonymous users.
 * @param userId The user's ID, or null for anonymous users.
 * @returns The user's profile data.
 */
export const getUserProfile = async (userId: string | null): Promise<UserProfile> => {
  if (!userId) {
    return getLocalProfile();
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Merge fetched data with defaults to ensure all expected fields are present
      return { ...defaultProfile, ...(userData.profile || {}) };
    } else {
      // User document might exist but no profile field yet
      return { ...defaultProfile };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Return default profile in case of error
    return { ...defaultProfile };
  }
};

/**
 * Updates specific fields in the user's profile data.
 * @param userId The user's ID, or null for anonymous users.
 * @param updates An object containing the profile fields to update.
 */
export const updateUserProfile = async (userId: string | null, updates: Partial<UserProfile>): Promise<void> => {
  if (!userId) {
    // Anonymous user: Update localStorage
    const currentProfile = getLocalProfile();
    const updatedProfile = { ...currentProfile, ...updates };
    saveLocalProfile(updatedProfile);
    return;
  }

  // Logged-in user: Update Firestore
  try {
    const userRef = doc(db, 'users', userId);
    // Use updateDoc to only modify the profile field, or setDoc with merge if profile might not exist
    // Using setDoc with merge is safer if the 'profile' field might be completely absent
    await setDoc(userRef, { profile: updates }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Optionally re-throw or handle the error based on application needs
  }
}; 