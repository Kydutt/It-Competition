<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalParticipants = User::where('role', Role::PARTICIPANT)->count();
        $totalTeams = Team::count();
        $totalCompetitions = Competition::count();
        $totalEvents = Event::count();
        $totalRegistrations = Registration::count();

        // Registrations count grouped by canonical status
        $regCounts = Registration::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $registrationsByStatus = [];
        foreach (RegistrationStatus::cases() as $status) {
            $registrationsByStatus[$status->value] = (int) ($regCounts[$status->value] ?? 0);
        }

        // Submissions count grouped by canonical status
        $subCounts = Submission::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $submissionsByStatus = [];
        foreach (SubmissionStatus::cases() as $status) {
            $submissionsByStatus[$status->value] = (int) ($subCounts[$status->value] ?? 0);
        }

        // 10 most recent activity logs
        $recentLogs = ActivityLog::with('user:id,name,email,role')
            ->latest('id')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_participants' => $totalParticipants,
                    'total_teams' => $totalTeams,
                    'total_competitions' => $totalCompetitions,
                    'total_events' => $totalEvents,
                    'total_registrations' => $totalRegistrations,
                ],
                'registrations_by_status' => $registrationsByStatus,
                'submissions_by_status' => $submissionsByStatus,
                'recent_activity_logs' => $recentLogs,
            ],
        ]);
    }
}
