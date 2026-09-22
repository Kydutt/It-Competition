import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import ParticipantLayout from '../layouts/ParticipantLayout';
import AdminLayout from '../layouts/AdminLayout';
import JudgeLayout from '../layouts/JudgeLayout';

// Common Components
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import CompetitionsPage from '../pages/public/CompetitionsPage';
import CompetitionDetailPage from '../pages/public/CompetitionDetailPage';
import TimelinePage from '../pages/public/TimelinePage';
import AnnouncementsPage from '../pages/public/AnnouncementsPage';
import AnnouncementDetailPage from '../pages/public/AnnouncementDetailPage';
import WinnersPage from '../pages/public/WinnersPage';
import FaqPage from '../pages/public/FaqPage';
import ContactPage from '../pages/public/ContactPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Participant Pages
import ParticipantDashboard from '../pages/participant/DashboardPage';
import ParticipantProfile from '../pages/participant/ProfilePage';
import ParticipantCompetitions from '../pages/participant/MyCompetitionsPage';
import ParticipantTeam from '../pages/participant/MyTeamPage';
import ParticipantRegistrations from '../pages/participant/RegistrationsPage';
import ParticipantSubmissions from '../pages/participant/SubmissionsPage';
import ParticipantPayments from '../pages/participant/PaymentsPage';
import ParticipantAnnouncements from '../pages/participant/AnnouncementsPage';

// Admin Pages
import AdminDashboard from '../pages/admin/DashboardPage';
import AdminCompetitions from '../pages/admin/CompetitionsPage';
import AdminParticipants from '../pages/admin/ParticipantsPage';
import AdminRegistrations from '../pages/admin/RegistrationsPage';
import AdminPayments from '../pages/admin/PaymentsPage';
import AdminSubmissions from '../pages/admin/SubmissionsPage';
import AdminAnnouncements from '../pages/admin/AnnouncementsPage';
import AdminFaqs from '../pages/admin/FaqsPage';
import AdminSponsors from '../pages/admin/SponsorsPage';
import AdminWinners from '../pages/admin/WinnersPage';

// Judge Pages
import JudgeDashboard from '../pages/judge/DashboardPage';
import JudgeSubmissions from '../pages/judge/SubmissionsPage';
import JudgeSubmissionDetail from '../pages/judge/SubmissionDetailPage';
import JudgeScores from '../pages/judge/ScoresPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:slug" element={<CompetitionDetailPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
        <Route path="/winners" element={<WinnersPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. AUTHENTICATION ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 3. PARTICIPANT PROTECTED ROUTES */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['participant', 'admin']}>
            <ParticipantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ParticipantDashboard />} />
        <Route path="/profile" element={<ParticipantProfile />} />
        <Route path="/my-competitions" element={<ParticipantCompetitions />} />
        <Route path="/my-team" element={<ParticipantTeam />} />
        <Route path="/registrations" element={<ParticipantRegistrations />} />
        <Route path="/submissions" element={<ParticipantSubmissions />} />
        <Route path="/payments" element={<ParticipantPayments />} />
        <Route path="/my-announcements" element={<ParticipantAnnouncements />} />
      </Route>

      {/* 4. ADMIN PROTECTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="competitions" element={<AdminCompetitions />} />
        <Route path="participants" element={<AdminParticipants />} />
        <Route path="registrations" element={<AdminRegistrations />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="faqs" element={<AdminFaqs />} />
        <Route path="sponsors" element={<AdminSponsors />} />
        <Route path="winners" element={<AdminWinners />} />
      </Route>

      {/* 5. JUDGE PROTECTED ROUTES */}
      <Route
        path="/judge"
        element={
          <ProtectedRoute allowedRoles={['judge', 'admin']}>
            <JudgeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<JudgeDashboard />} />
        <Route path="submissions" element={<JudgeSubmissions />} />
        <Route path="submissions/:id" element={<JudgeSubmissionDetail />} />
        <Route path="scores" element={<JudgeScores />} />
      </Route>

      {/* 6. FALLBACK ROUTE */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
