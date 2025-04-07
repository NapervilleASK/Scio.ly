import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getDailyMetrics, DailyMetrics } from './metrics'; // Import necessary functions and types

const saveLocalMetrics = (metrics: DailyMetrics) => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`metrics_${today}`, JSON.stringify(metrics));
};

/**
 * Updates the game points for the current day.
 * @param userId The user's ID, or null for anonymous users.
 * @param pointsChange The amount to change the game points by (e.g., 1, -1, 0).
 * @returns The updated DailyMetrics or null if an error occurs.
 */
export const updateGamePoints = async (
  userId: string | null,
  pointsChange: number
): Promise<DailyMetrics | null> => {

  const currentMetrics = await getDailyMetrics(userId);

  // If metrics couldn't be fetched, we can't update.
  if (!currentMetrics) {
    console.error('Could not fetch current metrics to update game points.');
    return null;
  }

  const updatedMetrics: DailyMetrics = {
    ...currentMetrics,
    gamePoints: (currentMetrics.gamePoints || 0) + pointsChange, // Update only gamePoints
  };

  // Save back to the appropriate storage
  if (!userId) {
    // Anonymous user: save to localStorage
    saveLocalMetrics(updatedMetrics);
    return updatedMetrics;
  } else {
    // Logged-in user: save to Firestore
    const today = new Date().toISOString().split('T')[0];
    try {
      const userRef = doc(db, 'users', userId);
      // Fetch existing daily stats again to merge properly, avoiding race conditions if possible
      // Although getDailyMetrics was just called, fetching again ensures we merge with the latest server state
      // before overwriting the specific day's gamePoints.
      const userDoc = await getDoc(userRef);
      let dailyStats: Record<string, DailyMetrics> = {};
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Ensure data.dailyStats exists and is an object before assigning
        if (data && typeof data.dailyStats === 'object' && data.dailyStats !== null) {
           dailyStats = data.dailyStats as Record<string, DailyMetrics>;
        }
      }

      await setDoc(userRef, {
        dailyStats: {
          ...dailyStats,
          [today]: updatedMetrics // Overwrite today's stats with the new object containing updated gamePoints
        }
      }, { merge: true });

      return updatedMetrics;
    } catch (error) {
      console.error('Error updating game points in Firestore:', error);
      return null;
    }
  }
};

/**
 * Sets the game points for a specific user for the current day directly.
 * Intended for admin use.
 * @param userId The user's ID.
 * @param newScore The new integer score to set.
 * @returns boolean Indicating success or failure.
 */
export const setGamePoints = async (
  userId: string,
  newScore: number
): Promise<boolean> => {
  if (!userId) {
    console.error('[setGamePoints] User ID is required.');
    return false;
  }
  if (typeof newScore !== 'number' || !Number.isInteger(newScore)) {
      console.error('[setGamePoints] New score must be an integer.');
      return false;
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    let dailyStats: Record<string, DailyMetrics> = {};
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Ensure data.dailyStats exists and is an object before assigning
      if (data && typeof data.dailyStats === 'object' && data.dailyStats !== null) {
         dailyStats = data.dailyStats as Record<string, DailyMetrics>;
      }
    }

    // Get current stats for the day, or default if none exist
    const currentDayStats: DailyMetrics = dailyStats[today] || {
        correctAnswers: 0,
        incorrectAnswers: 0,
        questionsSeen: 0,
        gamePoints: 0, // Will be overwritten
        lastQuestionTimestamp: null,
    };

    // Create the updated metrics object for the day
    const updatedMetrics: DailyMetrics = {
      ...currentDayStats,
      gamePoints: newScore, // Set the game points directly
    };

    // Save back to Firestore, merging with existing user data
    await setDoc(userRef, {
      dailyStats: {
        ...dailyStats,
        [today]: updatedMetrics // Overwrite today's stats
      }
    }, { merge: true });

    console.log(`[setGamePoints] Successfully set gamePoints for user ${userId} on ${today} to ${newScore}`);
    return true;
  } catch (error) {
    console.error(`[setGamePoints] Error setting game points for user ${userId}:`, error);
    return false;
  }
};
