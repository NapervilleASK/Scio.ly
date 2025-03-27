import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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

export const loadBookmarksFromFirebase = async (userId: string): Promise<BookmarkedQuestion[]> => {
  if (!userId) return [];
  
  const bookmarksRef = doc(db, 'bookmarks', userId);
  const bookmarksDoc = await getDoc(bookmarksRef);
  
  if (bookmarksDoc.exists()) {
    const data = bookmarksDoc.data();
    return data.questions || [];
  }
  
  return [];
};

export const addBookmark = async (
  userId: string | null,
  question: Question,
  eventName: string,
  source: string
) => {
  if (!userId) return;

  const bookmark: BookmarkedQuestion = {
    question,
    eventName,
    source,
    timestamp: Date.now()
  };
  
  const bookmarksRef = doc(db, 'bookmarks', userId);
  const bookmarksDoc = await getDoc(bookmarksRef);
  
  if (bookmarksDoc.exists()) {
    const data = bookmarksDoc.data();
    const questions: BookmarkedQuestion[] = data.questions || [];
    
    // Check if the question is already bookmarked
    if (!questions.some(b => 
      b.question.question === question.question && 
      b.eventName === eventName && 
      b.source === source
    )) {
      // Add the bookmark to the array
      await updateDoc(bookmarksRef, {
        questions: arrayUnion(bookmark)
      });
    }
  } else {
    // Create new document with the bookmark
    await setDoc(bookmarksRef, {
      questions: [bookmark]
    });
  }
};

export const removeBookmark = async (
  userId: string | null,
  question: Question,
  source: string
) => {
  if (!userId) return;

  const bookmarksRef = doc(db, 'bookmarks', userId);
  const bookmarksDoc = await getDoc(bookmarksRef);
  
  if (bookmarksDoc.exists()) {
    const data = bookmarksDoc.data();
    const questions: BookmarkedQuestion[] = data.questions || [];
    
    // Find the bookmark to remove
    const bookmarkToRemove = questions.find(b => 
      b.question.question === question.question && b.source === source
    );
    
    if (bookmarkToRemove) {
      // Remove the bookmark
      await updateDoc(bookmarksRef, {
        questions: arrayRemove(bookmarkToRemove)
      });
    }
  }
}; 