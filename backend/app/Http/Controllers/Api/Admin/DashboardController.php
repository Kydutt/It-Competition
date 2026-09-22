<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Api\ApiController;
use App\Models\Competition;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function __invoke(): JsonResponse
    {
        $stats = [
            'total_participants' => User::where('role', UserRole::Participant)->count(),
            'total_competitions' => Competition::count(),
            'total_registrations' => Registration::count(),
            'pending_registrations' => Registration::where('status', RegistrationStatus::Submitted)->count(),
            'pending_payments' => Payment::where('status', PaymentStatus::WaitingVerification)->count(),
            'total_submissions' => Submission::count(),
        ];

        return $this->successResponse($stats, 'Admin dashboard statistics retrieved');
    }
}
