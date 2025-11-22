import { UserProfile } from '../types';

const STORAGE_KEY = 'przerobmizdjecie_user_session';
const DB_KEY = 'przerobmizdjecie_users_db';

// Mock database simulation to persist credits across sessions
const getDatabase = (): Record<string, UserProfile> => {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : {};
};

const saveDatabase = (db: Record<string, UserProfile>) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const authService = {
  // Simulate Google Login
  loginWithGoogle: async (): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate a user coming from Google
        const mockUser: UserProfile = {
          id: 'google_123456789',
          name: 'Jan Kowalski',
          email: 'jan.kowalski@gmail.com',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan',
          credits: 5 // Start bonus for new users
        };

        // Check if user exists in our "database" to retrieve their real credits
        const db = getDatabase();
        let finalUser = mockUser;

        if (db[mockUser.id]) {
          finalUser = db[mockUser.id];
        } else {
          // New user, save to db
          db[mockUser.id] = mockUser;
          saveDatabase(db);
        }

        // Save session
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUser));
        resolve(finalUser);
      }, 800); // Simulate network delay
    });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  getCurrentUser: (): UserProfile | null => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;
    
    // Always sync with DB to get latest credits
    const user = JSON.parse(session) as UserProfile;
    const db = getDatabase();
    return db[user.id] || user;
  },

  updateCredits: (userId: string, amountToAdd: number): UserProfile => {
    const db = getDatabase();
    if (db[userId]) {
      db[userId].credits += amountToAdd;
      saveDatabase(db);
      
      // Update session as well
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db[userId]));
      return db[userId];
    }
    throw new Error("User not found");
  }
};