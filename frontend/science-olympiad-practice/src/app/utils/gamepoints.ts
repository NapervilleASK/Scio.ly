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
      let dailyStats = {};
      if (userDoc.exists()) {
        dailyStats = userDoc.data().dailyStats || {};
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
