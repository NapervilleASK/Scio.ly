import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';

interface Question {
  question: string;
  options?: string[];
  answers: (string | number)[];
  difficulty: number;
}

interface BookmarkedQuestion {
  question: Question;
  eventName: string;
  source: string;
  timestamp: number;
}

export const syncBookmarksToFirebase = async (userId: string) => {
  if (!userId) return;
  
  const localBookmarks = localStorage.getItem('bookmarkedQuestions');
  if (!localBookmarks) return;
  
  const bookmarksRef = collection(db, 'bookmarks');
  const userBookmarksDoc = doc(bookmarksRef, userId);
  
  await setDoc(userBookmarksDoc, {
    questions: JSON.parse(localBookmarks)
  });
};

export const loadBookmarksFromFirebase = async (userId: string): Promise<BookmarkedQuestion[]> => {
  if (!userId) return [];
  
  const bookmarksRef = doc(db, 'bookmarks', userId);
  const bookmarksDoc = await getDoc(bookmarksRef);
  
  if (bookmarksDoc.exists()) {
    const data = bookmarksDoc.data();
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(data.questions));
    return data.questions;
  }
  
  return [];
};

export const addBookmark = async (
  userId: string | null,
  question: Question,
  eventName: string,
  source: string
) => {
  const bookmark: BookmarkedQuestion = {
    question,
    eventName,
    source,
    timestamp: Date.now()
  };

  // Update local storage
  const existingBookmarks = localStorage.getItem('bookmarkedQuestions');
  const bookmarks: BookmarkedQuestion[] = existingBookmarks ? JSON.parse(existingBookmarks) : [];
  
  if (!bookmarks.some(b => 
    b.question.question === question.question && 
    b.eventName === eventName && 
    b.source === source
  )) {
    bookmarks.push(bookmark);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(bookmarks));
    
    // Sync with Firebase if user is logged in
    if (userId) {
      await syncBookmarksToFirebase(userId);
    }
  }
};

export const removeBookmark = async (
  userId: string | null,
  question: Question,
  source: string
) => {
  // Update local storage
  const existingBookmarks = localStorage.getItem('bookmarkedQuestions');
  if (!existingBookmarks) return;

  const bookmarks: BookmarkedQuestion[] = JSON.parse(existingBookmarks);
  const filteredBookmarks = bookmarks.filter(b => 
    !(b.question.question === question.question && b.source === source)
  );
  
  localStorage.setItem('bookmarkedQuestions', JSON.stringify(filteredBookmarks));
  
  // Sync with Firebase if user is logged in
  if (userId) {
    await syncBookmarksToFirebase(userId);
  }
}; 