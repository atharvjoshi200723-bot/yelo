import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LinkupPage from './pages/LinkupPage';
import RentPage from './pages/RentPage';
import RentDetailPage from './pages/RentDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import BuddyPage from './pages/BuddyPage';
import BuddyDetailPage from './pages/BuddyDetailPage';
import BuddyRequestDetailPage from './pages/BuddyRequestDetailPage';
import BecomeBuddyPage from './pages/BecomeBuddyPage';
import MyBuddyProfilePage from './pages/MyBuddyProfilePage';
import ForumsPage from './pages/ForumsPage';
import ForumCategoryPage from './pages/ForumCategoryPage';
import ForumPostPage from './pages/ForumPostPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import RentalGuidelinesPage from './pages/RentalGuidelinesPage';
import { usePageMeta } from './hooks/usePageMeta';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>;
  if (user) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  usePageMeta();
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
      <Route path="/rental-guidelines" element={<RentalGuidelinesPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/rent" element={<RentPage />} />
        <Route path="/rent/:id" element={<RentDetailPage />} />
        <Route path="/rent/create" element={<CreateListingPage />} />
        <Route path="/buddy" element={<BuddyPage />} />
        <Route path="/buddy/become" element={<BecomeBuddyPage />} />
        <Route path="/buddy/manage" element={<MyBuddyProfilePage />} />
        <Route path="/buddy/requests/:id" element={<BuddyRequestDetailPage />} />
        <Route path="/buddy/:id" element={<BuddyDetailPage />} />
        <Route path="/linkup" element={<LinkupPage onClose={() => window.history.back()} />} />
        <Route path="/forums" element={<ForumsPage />} />
        <Route path="/forums/:slug" element={<ForumCategoryPage />} />
        <Route path="/forums/post/:id" element={<ForumPostPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/settings" element={<ProfileSettingsPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
