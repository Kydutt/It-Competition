<?php

namespace App\Http\Controllers\Api\Participant;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\RegistrationResource;
use App\Models\Announcement;
use App\Models\Notification;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get user registrations (either as individual participant or through team membership)
        $registrationsQuery = Registration::query()
            ->where(function ($q) use ($user) {
                $q->where('participant_id', $user->id)
                  ->orWhereHas('team.members', function ($mq) use ($user) {
                      $mq->where('users.id', $user->id);
                  });
            })
            ->with(['competition.category', 'competition.event', 'team.leader', 'documents', 'submissions', 'submission']);

        $allRegistrations = (clone $registrationsQuery)->get();

        $statusCounts = [
            'total' => $allRegistrations->count(),
            'draft' => $allRegistrations->where('status', RegistrationStatus::DRAFT)->count(),
            'submitted' => $allRegistrations->where('status', RegistrationStatus::SUBMITTED)->count(),
            'under_review' => $allRegistrations->where('status', RegistrationStatus::UNDER_REVIEW)->count(),
            'revision_required' => $allRegistrations->where('status', RegistrationStatus::REVISION_REQUIRED)->count(),
            'approved' => $allRegistrations->where('status', RegistrationStatus::APPROVED)->count(),
            'rejected' => $allRegistrations->where('status', RegistrationStatus::REJECTED)->count(),
            'cancelled' => $allRegistrations->where('status', RegistrationStatus::CANCELLED)->count(),
        ];

        // Active registrations for table preview (latest 5)
        $recentRegistrations = (clone $registrationsQuery)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Competition IDs user participates in
        $competitionIds = $allRegistrations->pluck('competition_id')->unique()->filter()->values()->all();

        // Relevant announcements (public, all participants, or specific competitions user follows)
        $announcements = Announcement::query()
            ->where('status', AnnouncementStatus::PUBLISHED)
            ->where(function ($q) use ($competitionIds) {
                $q->where('audience', AnnouncementAudience::PUBLIC)
                  ->orWhere('audience', AnnouncementAudience::ALL_PARTICIPANTS)
                  ->orWhere(function ($sq) use ($competitionIds) {
                      $sq->where('audience', AnnouncementAudience::SPECIFIC_COMPETITION)
                         ->whereIn('competition_id', $competitionIds);
                  });
            })
            ->orderBy('published_at', 'desc')
            ->limit(4)
            ->get();

        // Recent notifications
        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $unreadCount = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        // Upcoming deadlines from active competitions
        $upcomingDeadlines = $allRegistrations
            ->filter(fn ($r) => in_array($r->status, [RegistrationStatus::DRAFT, RegistrationStatus::APPROVED, RegistrationStatus::REVISION_REQUIRED]))
            ->map(function ($r) {
                $comp = $r->competition;
                return [
                    'competition_name' => $comp?->name ?? 'Kompetisi',
                    'registration_number' => $r->registration_number,
                    'registration_deadline' => $comp?->registration_deadline?->toISOString(),
                    'submission_deadline' => $comp?->submission_deadline?->toISOString(),
                    'status' => $r->status->value,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard peserta berhasil diambil.',
            'data' => [
                'status_counts' => $statusCounts,
                'recent_registrations' => RegistrationResource::collection($recentRegistrations),
                'announcements' => AnnouncementResource::collection($announcements),
                'notifications' => NotificationResource::collection($notifications),
                'unread_notifications_count' => $unreadCount,
                'upcoming_deadlines' => $upcomingDeadlines,
            ],
        ]);
    }
}
