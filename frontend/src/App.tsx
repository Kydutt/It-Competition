import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicLayout } from './components/layout/PublicLayout';
import { ParticipantLayout } from './components/layout/ParticipantLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { SchedulePage } from './pages/SchedulePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AnnouncementDetailPage } from './pages/AnnouncementDetailPage';
import { FaqPage } from './pages/FaqPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Participant Pages
import { DashboardPage } from './pages/participant/DashboardPage';
import { RegistrationsPage } from './pages/participant/RegistrationsPage';
import { RegistrationCreatePage } from './pages/participant/RegistrationCreatePage';
import { RegistrationDetailPage } from './pages/participant/RegistrationDetailPage';
import { TeamsPage } from './pages/participant/TeamsPage';
import { SubmissionsPage } from './pages/participant/SubmissionsPage';
import { NotificationsPage } from './pages/participant/NotificationsPage';
import { ProfilePage } from './pages/participant/ProfilePage';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage as AdminDashboardPage } from './pages/admin/DashboardPage';
import { RegistrationsPage as AdminRegistrationsPage } from './pages/admin/RegistrationsPage';
import { RegistrationDetailPage as AdminRegistrationDetailPage } from './pages/admin/RegistrationDetailPage';
import { CompetitionsPage as AdminCompetitionsPage } from './pages/admin/CompetitionsPage';
import { SubmissionsPage as AdminSubmissionsPage } from './pages/admin/SubmissionsPage';
import { EventsPage as AdminEventsPage } from './pages/admin/EventsPage';
import { CategoriesPage as AdminCategoriesPage } from './pages/admin/CategoriesPage';
import { AnnouncementsPage as AdminAnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { FaqsPage as AdminFaqsPage } from './pages/admin/FaqsPage';
import { SchedulesPage as AdminSchedulesPage } from './pages/admin/SchedulesPage';
import { SettingsPage as AdminSettingsPage } from './pages/admin/SettingsPage';
import { ActivityLogsPage as AdminActivityLogsPage } from './pages/admin/ActivityLogsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="competitions" element={<CompetitionsPage />} />
            <Route path="competitions/:slug" element={<CompetitionDetailPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcements/:slug" element={<AnnouncementDetailPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Participant Portal Routes */}
          <Route
            path="/participant"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/participant/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="registrations/create" element={<RegistrationCreatePage />} />
            <Route path="registrations/:id" element={<RegistrationDetailPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Protected Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="registrations" element={<AdminRegistrationsPage />} />
            <Route path="registrations/:id" element={<AdminRegistrationDetailPage />} />
            <Route path="competitions" element={<AdminCompetitionsPage />} />
            <Route path="submissions" element={<AdminSubmissionsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="schedules" element={<AdminSchedulesPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="faqs" element={<AdminFaqsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="activity-logs" element={<AdminActivityLogsPage />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
