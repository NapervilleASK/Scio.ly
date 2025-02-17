import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface DailyMetrics {
  questionsAttempted: number;
  correctAnswers: number;
  eventsPracticed: string[];
}

const getLocalMetrics = () => {
  const today = new Date().toISOString().split('T')[0];
  const localStats = localStorage.getItem(`metrics_${today}`);
  return localStats ? JSON.parse(localStats) : {
    questionsAttempted: 0,
    correctAnswers: 0,
    eventsPracticed: []
  };
};

const saveLocalMetrics = (metrics: DailyMetrics) => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`metrics_${today}`, JSON.stringify(metrics));
};

export const getDailyMetrics = async (userId: string | null) => {
  const today = new Date().toISOString().split('T')[0];

  if (!userId) {
    return getLocalMetrics();
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const dailyStats = userData.dailyStats || {};
      return dailyStats[today] || {
        questionsAttempted: 0,
        correctAnswers: 0,
        eventsPracticed: []
      };
    }
    return getLocalMetrics();
  } catch (error) {
    console.error('Error getting metrics:', error);
    return getLocalMetrics();
  }
};

export const updateMetrics = async (
  userId: string | null,
  updates: {
    questionsAttempted?: number;
    correctAnswers?: number;
    eventName?: string;
  }
) => {
  const today = new Date().toISOString().split('T')[0];

  if (!userId) {
    const currentStats = getLocalMetrics();
    const updatedStats = {
      questionsAttempted: currentStats.questionsAttempted + (updates.questionsAttempted || 0),
      correctAnswers: currentStats.correctAnswers + (updates.correctAnswers || 0),
      eventsPracticed: updates.eventName && !currentStats.eventsPracticed.includes(updates.eventName)
        ? [...currentStats.eventsPracticed, updates.eventName]
        : currentStats.eventsPracticed
    };
    saveLocalMetrics(updatedStats);
    return updatedStats;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    let dailyStats = {};

    if (userDoc.exists()) {
      const userData = userDoc.data();
      dailyStats = userData.dailyStats || {};
    }

    const todayStats = dailyStats[today] || {
      questionsAttempted: 0,
      correctAnswers: 0,
      eventsPracticed: []
    };

    // Update stats
    const updatedTodayStats = {
      ...todayStats,
      questionsAttempted: todayStats.questionsAttempted + (updates.questionsAttempted || 0),
      correctAnswers: todayStats.correctAnswers + (updates.correctAnswers || 0),
      eventsPracticed: updates.eventName && !todayStats.eventsPracticed.includes(updates.eventName)
        ? [...todayStats.eventsPracticed, updates.eventName]
        : todayStats.eventsPracticed
    };

    // Update Firestore with the correct structure
    await setDoc(userRef, {
      dailyStats: {
        ...dailyStats,
        [today]: updatedTodayStats
      }
    }, { merge: true });

    return updatedTodayStats;
  } catch (error) {
    console.error('Error updating metrics:', error);
    return updateMetrics(null, updates);
  }
}; 