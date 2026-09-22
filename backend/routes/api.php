<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\Auth;
use App\Http\Controllers\Api\Judge;
use App\Http\Controllers\Api\Participant;
use App\Http\Controllers\Api\Public as PublicApi;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // -------------------------------------------------------------
    // Public Authentication Routes
    // -------------------------------------------------------------
    Route::prefix('auth')->group(function () {
        Route::post('register', Auth\RegisterController::class);
        Route::post('login', Auth\LoginController::class);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', Auth\LogoutController::class);
            Route::get('me', function (Request $request) {
                return response()->json([
                    'success' => true,
                    'message' => 'User profile retrieved',
                    'data' => new UserResource($request->user()),
                ]);
            });
        });
    });

    // -------------------------------------------------------------
    // Public Information Endpoints
    // -------------------------------------------------------------
    Route::get('competitions', [PublicApi\CompetitionController::class, 'index']);
    Route::get('competitions/{slug}', [PublicApi\CompetitionController::class, 'show']);

    Route::prefix('public')->group(function () {
        Route::get('competitions', [PublicApi\CompetitionController::class, 'index']);
        Route::get('competitions/{slug}', [PublicApi\CompetitionController::class, 'show']);
    });

    Route::get('announcements', [PublicApi\AnnouncementController::class, 'index']);
    Route::get('announcements/{slug}', [PublicApi\AnnouncementController::class, 'show']);

    Route::get('faqs', [PublicApi\FaqController::class, 'index']);
    Route::get('sponsors', [PublicApi\SponsorController::class, 'index']);
    Route::get('winners', [PublicApi\WinnerController::class, 'index']);

    // -------------------------------------------------------------
    // Participant Protected Routes
    // -------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'role:participant'])->prefix('participant')->group(function () {
        Route::get('profile', [Participant\ProfileController::class, 'show']);
        Route::put('profile', [Participant\ProfileController::class, 'update']);

        Route::get('teams', [Participant\TeamController::class, 'index']);
        Route::post('teams', [Participant\TeamController::class, 'store']);

        Route::get('registrations', [Participant\RegistrationController::class, 'index']);
        Route::post('registrations', [Participant\RegistrationController::class, 'store']);

        Route::get('payments', [Participant\PaymentController::class, 'index']);
        Route::post('payments', [Participant\PaymentController::class, 'store']);

        Route::get('submissions', [Participant\SubmissionController::class, 'index']);
        Route::post('submissions', [Participant\SubmissionController::class, 'store']);
    });

    // -------------------------------------------------------------
    // Admin Protected Routes
    // -------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('dashboard', Admin\DashboardController::class);

        Route::patch('competitions/{competition}/publish', [Admin\CompetitionController::class, 'publish']);
        Route::patch('competitions/{competition}/unpublish', [Admin\CompetitionController::class, 'unpublish']);
        Route::patch('competitions/{competition}/status', [Admin\CompetitionController::class, 'changeStatus']);
        Route::apiResource('competitions', Admin\CompetitionController::class);

        Route::get('participants', [Admin\ParticipantController::class, 'index']);
        Route::get('participants/{participant}', [Admin\ParticipantController::class, 'show']);

        Route::get('registrations', [Admin\RegistrationController::class, 'index']);
        Route::put('registrations/{registration}/verify', [Admin\RegistrationController::class, 'verify']);

        Route::get('payments', [Admin\PaymentController::class, 'index']);
        Route::put('payments/{payment}/verify', [Admin\PaymentController::class, 'verify']);

        Route::get('submissions', [Admin\SubmissionController::class, 'index']);
        Route::get('submissions/{submission}', [Admin\SubmissionController::class, 'show']);

        Route::apiResource('announcements', Admin\AnnouncementController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('faqs', Admin\FaqController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('sponsors', Admin\SponsorController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('winners', Admin\WinnerController::class)->only(['index', 'store', 'destroy']);
    });

    // -------------------------------------------------------------
    // Judge Protected Routes
    // -------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'role:judge'])->prefix('judge')->group(function () {
        Route::get('dashboard', Judge\DashboardController::class);
        Route::get('submissions', [Judge\SubmissionController::class, 'index']);
        Route::get('submissions/{submission}', [Judge\SubmissionController::class, 'show']);
        Route::post('scores', [Judge\ScoreController::class, 'store']);
    });
});
