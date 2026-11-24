<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StatisticsController extends Controller
{
    public function index(): JsonResponse
    {
        // Purely aggregated database metrics, no personal data
        $totalEvents = Event::where('status', EventStatus::PUBLISHED)->count();
        $totalCompetitions = Competition::where('status', '!=', CompetitionStatus::DRAFT)->count();
        $totalCategories = CompetitionCategory::count();
        $totalRegistrations = Registration::whereNotIn('status', [
            RegistrationStatus::DRAFT,
            RegistrationStatus::CANCELLED,
        ])->count();
        $totalParticipants = User::where('role', 'participant')->where('is_active', true)->count();

        return response()->json([
            'success' => true,
            'message' => 'Statistik publik berhasil diambil.',
            'data' => [
                'total_events' => $totalEvents,
                'total_competitions' => $totalCompetitions,
                'total_categories' => $totalCategories,
                'total_registrations' => $totalRegistrations,
                'total_participants' => $totalParticipants,
            ],
        ]);
    }
}
