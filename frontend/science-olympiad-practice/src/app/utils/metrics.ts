import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DailyMetrics {
  questionsAttempted: number;
  correctAnswers: number;
  eventsPracticed: string[];
  eventQuestions: Record<string, number>;
  gamePoints: number;
}

const getLocalMetrics = (): DailyMetrics => {
  const today = new Date().toISOString().split('T')[0];
  const localStats = localStorage.getItem(`metrics_${today}`);
  const defaultMetrics = {
    questionsAttempted: 0,
    correctAnswers: 0,
    eventsPracticed: [],
    eventQuestions: {},
    gamePoints: 0
  };
  return localStats ? { ...defaultMetrics, ...JSON.parse(localStats) } : defaultMetrics;
};

const saveLocalMetrics = (metrics: DailyMetrics) => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`metrics_${today}`, JSON.stringify(metrics));
};

export const getDailyMetrics = async (userId: string | null): Promise<DailyMetrics | null> => {
  const defaultMetrics = {
    questionsAttempted: 0,
    correctAnswers: 0,
    eventsPracticed: [],
    eventQuestions: {},
    gamePoints: 0
  };

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
      return { ...defaultMetrics, ...(dailyStats[today] || {}) };
    }
    return defaultMetrics;
  } catch (error) {
    console.error('Error getting metrics:', error);
    return defaultMetrics;
  }
};

export const updateMetrics = async (
  userId: string | null,
  updates: {
    questionsAttempted?: number;
    correctAnswers?: number;
    eventName?: string;
  }
): Promise<DailyMetrics | null> => {
  if (!userId) {
    const currentStats = getLocalMetrics();
    const updatedStats: DailyMetrics = {
      ...currentStats,
      questionsAttempted: currentStats.questionsAttempted + (updates.questionsAttempted || 0),
      correctAnswers: currentStats.correctAnswers + (updates.correctAnswers || 0),
      eventsPracticed: updates.eventName && !currentStats.eventsPracticed.includes(updates.eventName)
        ? [...currentStats.eventsPracticed, updates.eventName]
        : currentStats.eventsPracticed,
      eventQuestions: {
        ...currentStats.eventQuestions,
        ...(updates.eventName && updates.questionsAttempted ? {
          [updates.eventName]: (currentStats.eventQuestions?.[updates.eventName] || 0) + updates.questionsAttempted
        } : {})
      }
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

    const defaultTodayStats = {
      questionsAttempted: 0,
      correctAnswers: 0,
      eventsPracticed: [],
      eventQuestions: {},
      gamePoints: 0
    };

    const todayStats = { ...defaultTodayStats, ...(dailyStats[today] || {}) };

    const updatedTodayStats: DailyMetrics = {
      ...todayStats,
      questionsAttempted: todayStats.questionsAttempted + (updates.questionsAttempted || 0),
      correctAnswers: todayStats.correctAnswers + (updates.correctAnswers || 0),
      eventsPracticed: updates.eventName && !todayStats.eventsPracticed.includes(updates.eventName)
        ? [...todayStats.eventsPracticed, updates.eventName]
        : todayStats.eventsPracticed,
      eventQuestions: {
        ...todayStats.eventQuestions,
        ...(updates.eventName && updates.questionsAttempted ? {
          [updates.eventName]: (todayStats.eventQuestions?.[updates.eventName] || 0) + updates.questionsAttempted
        } : {})
      }
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