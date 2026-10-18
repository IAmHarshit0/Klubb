import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCurrentUserId, setCurrentUserId } from '../api/client';
import { getMe } from '../api/users';
import type { User } from '../types/api';

interface AuthContextValue {
  userId: string;
  currentUser: User | null;
  isLoading: boolean;
  isVerifiedAlumnus: boolean;
  isStudentOnly: boolean;
  canConfigureAvailability: boolean;
  switchUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(getCurrentUserId);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await getMe();
      if (id === getCurrentUserId()) setCurrentUser(data.user);
    } catch {
      if (id === getCurrentUserId()) setCurrentUser(null);
    } finally {
      if (id === getCurrentUserId()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser(userId);
  }, [userId, loadUser]);

  const switchUser = useCallback((id: string) => {
    setCurrentUserId(id);
    setUserId(id);
    setCurrentUser(null);
  }, []);

  const isVerifiedAlumnus = Boolean(
    currentUser?.affiliations?.some(
      (affiliation) =>
        affiliation.role === 'Alumnus' &&
        affiliation.verificationStatus === 'institution-verified'
    )
  );

  const isStudentOnly = Boolean(
    currentUser?.affiliations &&
      currentUser.affiliations.length > 0 &&
      currentUser.affiliations.every((a) => a.role === 'Student') &&
      (!currentUser.employmentClaims || currentUser.employmentClaims.length === 0)
  );

  const canConfigureAvailability = isVerifiedAlumnus;

  return (
    <AuthContext.Provider
      value={{
        userId,
        currentUser,
        isLoading,
        isVerifiedAlumnus,
        isStudentOnly,
        canConfigureAvailability,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
