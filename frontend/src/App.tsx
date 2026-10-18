import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';

import { FeedPage } from './pages/FeedPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyProfilePage } from './pages/MyProfilePage';
import { MessagingPage } from './pages/MessagingPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { GroupPage } from './pages/GroupPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { LandingPage } from './pages/LandingPage';
import { VerifierPage } from './pages/VerifierPage';
import { NotificationsPage } from './pages/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/welcome" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/communities" element={<InstitutionsPage />} />
                  <Route path="/institutions" element={<InstitutionsPage />} />
                  <Route path="/discover" element={<DiscoveryPage />} />
                  <Route path="/profile/me" element={<MyProfilePage />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/messages" element={<MessagingPage />} />
                  <Route path="/connections" element={<ConnectionsPage />} />
                  <Route path="/groups/:groupId" element={<GroupPage />} />
                  <Route path="/verifier" element={<VerifierPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="*" element={<Navigate to="/feed" replace />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
