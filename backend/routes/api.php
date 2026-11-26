<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Participant\DashboardController;
use App\Http\Controllers\Api\Participant\NotificationController;
use App\Http\Controllers\Api\Participant\PaymentController;
use App\Http\Controllers\Api\Participant\ProfileController;
use App\Http\Controllers\Api\Participant\RegistrationController;
use App\Http\Controllers\Api\Participant\SubmissionController;
use App\Http\Controllers\Api\Participant\TeamController;
use App\Http\Controllers\Api\Public\AnnouncementController;
use App\Http\Controllers\Api\Public\CategoryController;
use App\Http\Controllers\Api\Public\CompetitionController;
use App\Http\Controllers\Api\Public\EventController;
use App\Http\Controllers\Api\Public\FaqController;
use App\Http\Controllers\Api\Public\PaymentConfigController;
use App\Http\Controllers\Api\Public\ScheduleController;
use App\Http\Controllers\Api\Public\StatisticsController;
use App\Http\Controllers\Api\Webhook\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (Prefix: /api/v1)
|--------------------------------------------------------------------------
*/

// Health & Connectivity Check
Route::get('/ping', [AuthController::class, 'ping']);

// Public Data Routes (Read-only, no auth required)
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{slug}', [EventController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/competitions', [CompetitionController::class, 'index']);
Route::get('/competitions/{slug}', [CompetitionController::class, 'show']);
Route::get('/schedules', [ScheduleController::class, 'index']);
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/announcements/{slug}', [AnnouncementController::class, 'show']);
Route::get('/faqs', [FaqController::class, 'index']);
Route::get('/public/statistics', [StatisticsController::class, 'index']);
Route::get('/public/payment-config', [PaymentConfigController::class, 'show']);

// Payment Gateway Webhooks (Stateless, signature-verified)
Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'handle'])->middleware('throttle:120,1');

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Participant Portal Routes (Authenticated + Role: Participant)
Route::prefix('participant')->middleware(['auth:sanctum', 'participant'])->group(function () {
    // Dashboard Summary
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    // Team Management
    Route::get('/teams', [TeamController::class, 'index']);
    Route::post('/teams', [TeamController::class, 'store']);
    Route::get('/teams/{team}', [TeamController::class, 'show']);
    Route::put('/teams/{team}', [TeamController::class, 'update']);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{member}', [TeamController::class, 'removeMember']);

    // Competition Registrations
    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::post('/registrations', [RegistrationController::class, 'store']);
    Route::get('/registrations/{registration}', [RegistrationController::class, 'show']);
    Route::put('/registrations/{registration}', [RegistrationController::class, 'update']);
    Route::post('/registrations/{registration}/documents', [RegistrationController::class, 'uploadDocument']);
    Route::get('/documents/{document}/download', [RegistrationController::class, 'downloadDocument']);
    Route::post('/registrations/{registration}/submit', [RegistrationController::class, 'submit']);

    // Payments (Midtrans Snap - Phase 1B & Phase 2)
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/payments/{payment}/sync', [PaymentController::class, 'sync']);
    Route::get('/registrations/{registration}/payments', [PaymentController::class, 'registrationIndex']);
    Route::post('/registrations/{registration}/payments', [PaymentController::class, 'store']);

    // Submissions
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
    Route::post('/submissions/{submission}/revisions', [SubmissionController::class, 'submitRevision']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

// Authorized Document Downloads (Owner or Admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/documents/registration/{document}/download', [\App\Http\Controllers\Api\DocumentDownloadController::class, 'downloadRegistrationDocument']);
    Route::get('/documents/submission/{submission}/download', [\App\Http\Controllers\Api\DocumentDownloadController::class, 'downloadSubmission']);
});

// Admin Portal Routes (Authenticated + Role: Admin)
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'index']);

    // Reports / CSV Export
    Route::get('/reports/registrations', [\App\Http\Controllers\Api\Admin\RegistrationController::class, 'exportCsv']);
    Route::get('/reports/submissions', [\App\Http\Controllers\Api\Admin\SubmissionController::class, 'exportCsv']);

    // Events Management
    Route::apiResource('events', \App\Http\Controllers\Api\Admin\EventController::class);

    // Categories Management
    Route::apiResource('categories', \App\Http\Controllers\Api\Admin\CategoryController::class);

    // Competitions Management
    Route::apiResource('competitions', \App\Http\Controllers\Api\Admin\CompetitionController::class);

    // Registrations Verification & Review
    Route::get('/registrations', [\App\Http\Controllers\Api\Admin\RegistrationController::class, 'index']);
    Route::get('/registrations/{registration}', [\App\Http\Controllers\Api\Admin\RegistrationController::class, 'show']);
    Route::patch('/registrations/{registration}/status', [\App\Http\Controllers\Api\Admin\RegistrationController::class, 'updateStatus']);
    Route::patch('/documents/{document}/verify', [\App\Http\Controllers\Api\Admin\RegistrationController::class, 'verifyDocument']);

    // Submissions Review
    Route::get('/submissions', [\App\Http\Controllers\Api\Admin\SubmissionController::class, 'index']);
    Route::get('/submissions/{submission}', [\App\Http\Controllers\Api\Admin\SubmissionController::class, 'show']);
    Route::patch('/submissions/{submission}/review', [\App\Http\Controllers\Api\Admin\SubmissionController::class, 'review']);
    Route::get('/submissions/{submission}/download', [\App\Http\Controllers\Api\Admin\SubmissionController::class, 'downloadFile']);

    // Announcements Management
    Route::apiResource('announcements', \App\Http\Controllers\Api\Admin\AnnouncementController::class);

    // FAQ Management
    Route::apiResource('faqs', \App\Http\Controllers\Api\Admin\FaqController::class);

    // Schedule Management
    Route::apiResource('schedules', \App\Http\Controllers\Api\Admin\ScheduleController::class);

    // Audit Activity Logs
    Route::get('/activity-logs', [\App\Http\Controllers\Api\Admin\ActivityLogController::class, 'index']);

    // System / Event Settings
    Route::get('/settings', [\App\Http\Controllers\Api\Admin\SettingController::class, 'index']);
    Route::patch('/settings', [\App\Http\Controllers\Api\Admin\SettingController::class, 'update']);
});
