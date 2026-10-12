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
import NotFoundPage from '../pages/public/NotFoundPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Participant Pages
import ParticipantDashboard from '../pages/participant/DashboardPage';
import ParticipantCompetitions from '../pages/participant/CompetitionsPage';
import ParticipantRegistrations from '../pages/participant/RegistrationsPage';
import ParticipantSchedule from '../pages/participant/SchedulePage';
import ParticipantAnnouncements from '../pages/participant/AnnouncementsPage';
import ParticipantProfile from '../pages/participant/ProfilePage';

// Admin Pages
import AdminDashboard from '../pages/admin/DashboardPage';
import AdminParticipants from '../pages/admin/ParticipantsPage';
import AdminCompetitions from '../pages/admin/CompetitionsPage';
import AdminJudges from '../pages/admin/JudgesPage';
import AdminSchedule from '../pages/admin/SchedulePage';
import AdminAnnouncements from '../pages/admin/AnnouncementsPage';
import AdminReports from '../pages/admin/ReportsPage';
import AdminWebsiteManagement from '../pages/admin/WebsiteManagementPage';
import WebsiteEditorPage from '../pages/admin/WebsiteEditorPage';

// Judge Pages
import JudgeDashboard from '../pages/judge/DashboardPage';
import JudgeCompetitions from '../pages/judge/CompetitionsPage';
import JudgeEvaluations from '../pages/judge/EvaluationsPage';
import JudgeResults from '../pages/judge/ResultsPage';
import JudgeProfile from '../pages/judge/ProfilePage';

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
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      {/* 2. AUTHENTICATION ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 3. PARTICIPANT PROTECTED ROUTES */}
      <Route
        path="/participant"
        element={
          <ProtectedRoute allowedRoles={['participant', 'admin']}>
            <ParticipantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/participant/dashboard" replace />} />
        <Route path="dashboard" element={<ParticipantDashboard />} />
        <Route path="competitions" element={<ParticipantCompetitions />} />
        <Route path="registrations" element={<ParticipantRegistrations />} />
        <Route path="schedule" element={<ParticipantSchedule />} />
        <Route path="announcements" element={<ParticipantAnnouncements />} />
        <Route path="profile" element={<ParticipantProfile />} />
      </Route>

      {/* Backward-compatible participant aliases */}
      <Route path="/dashboard" element={<Navigate to="/participant/dashboard" replace />} />
      <Route path="/my-competitions" element={<Navigate to="/participant/competitions" replace />} />
      <Route path="/registrations" element={<Navigate to="/participant/registrations" replace />} />
      <Route path="/profile" element={<Navigate to="/participant/profile" replace />} />

      {/* 4. ADMIN PROTECTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="participants" element={<AdminParticipants />} />
        <Route path="competitions" element={<AdminCompetitions />} />
        <Route path="judges" element={<AdminJudges />} />
        <Route path="schedule" element={<AdminSchedule />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="website-management" element={<AdminWebsiteManagement />} />
        <Route path="website-settings" element={<Navigate to="/admin/website-management" replace />} />
      </Route>

      {/* 4.5. ADMIN VISUAL WEBSITE BUILDER (FULL-SCREEN EDITOR) */}
      <Route
        path="/admin/website-editor"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WebsiteEditorPage />
          </ProtectedRoute>
        }
      />


      {/* 5. JUDGE PROTECTED ROUTES */}
      <Route
        path="/judge"
        element={
          <ProtectedRoute allowedRoles={['judge', 'admin']}>
            <JudgeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/judge/dashboard" replace />} />
        <Route path="dashboard" element={<JudgeDashboard />} />
        <Route path="competitions" element={<JudgeCompetitions />} />
        <Route path="evaluations" element={<JudgeEvaluations />} />
        <Route path="results" element={<JudgeResults />} />
        <Route path="profile" element={<JudgeProfile />} />
      </Route>

      {/* 6. FALLBACK ROUTE */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
