import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DailyMetrics {
  questionsAttempted: number;
  correctAnswers: number;
  eventsPracticed: string[];
}

const getLocalMetrics = (): DailyMetrics => {
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
  if (!userId) {
    return getLocalMetrics();
  }
  
  const today = new Date().toISOString().split('T')[0];

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
    return null;
  } catch (error) {
    console.error('Error getting metrics:', error);
    return null;
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
  
  const today = new Date().toISOString().split('T')[0];
  
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

    const updatedTodayStats = {
      ...todayStats,
      questionsAttempted: todayStats.questionsAttempted + (updates.questionsAttempted || 0),
      correctAnswers: todayStats.correctAnswers + (updates.correctAnswers || 0),
      eventsPracticed: updates.eventName && !todayStats.eventsPracticed.includes(updates.eventName)
        ? [...todayStats.eventsPracticed, updates.eventName]
        : todayStats.eventsPracticed
    };

    await setDoc(userRef, {
      dailyStats: {
        ...dailyStats,
        [today]: updatedTodayStats
      }
    }, { merge: true });

    return updatedTodayStats;
  } catch (error) {
    console.error('Error updating metrics:', error);
    return null;
  }
}; 