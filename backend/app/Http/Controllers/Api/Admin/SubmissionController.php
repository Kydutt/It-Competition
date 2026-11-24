<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\SubmissionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewSubmissionRequest;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Submission::with([
            'registration:id,registration_number,competition_id,participant_id,team_id',
            'registration.competition:id,name,slug',
            'registration.user:id,name,email',
            'registration.user.profile:id,user_id,institution',
            'registration.team:id,name',
            'revisions',
        ])->withCount('revisions');

        if ($request->filled('competition_id')) {
            $competitionId = $request->input('competition_id');
            $query->whereHas('registration', function ($q) use ($competitionId) {
                $q->where('competition_id', $competitionId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('registration', function ($rq) use ($search) {
                        $rq->where('registration_number', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($uq) use ($search) {
                                $uq->where('name', 'like', "%{$search}%");
                            })
                            ->orWhereHas('team', function ($tq) use ($search) {
                                $tq->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        $submissions = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $submissions,
        ]);
    }

    public function show(Submission $submission): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $submission->load([
                'registration.competition.category',
                'registration.participant.profile',
                'registration.user.profile',
                'registration.team.leader.profile',
                'registration.team.members.profile',
                'revisions',
            ]),
        ]);
    }

    public function review(ReviewSubmissionRequest $request, Submission $submission): JsonResponse
    {
        $statusValue = $request->validated('status');
        $targetStatus = $statusValue instanceof SubmissionStatus ? $statusValue : SubmissionStatus::from($statusValue);
        $notes = $request->validated('notes') ?? $request->validated('admin_notes');

        $updated = $this->submissionService->reviewSubmission(
            submission: $submission,
            targetStatus: $targetStatus,
            notes: $notes,
            admin: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Karya '{$updated->title}' berhasil diperbarui statusnya menjadi {$updated->status->value}.",
            'data' => $updated->load([
                'registration.competition',
                'registration.participant',
                'registration.user',
                'revisions',
            ]),
        ]);
    }

    public function downloadFile(Request $request, Submission $submission): StreamedResponse
    {
        if (! $submission->file_path || ! Storage::exists($submission->file_path)) {
            abort(404, 'Berkas fisik karya tidak ditemukan.');
        }

        $filename = basename($submission->file_path);
        return Storage::download($submission->file_path, $filename);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Submission::with([
            'registration.competition',
            'registration.user.profile',
            'registration.team',
        ]);

        if ($request->filled('competition_id')) {
            $competitionId = $request->input('competition_id');
            $query->whereHas('registration', function ($q) use ($competitionId) {
                $q->where('competition_id', $competitionId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $filename = 'submissions_export_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'No',
                'Nomor Pendaftaran',
                'Kompetisi',
                'Judul Karya',
                'Pendaftar / Tim',
                'Institusi',
                'URL Repositori',
                'URL Demo/Eksternal',
                'Status Submisi',
                'Tanggal Submit',
                'Catatan Panitia',
            ]);

            $index = 1;
            $sanitize = function (?string $val): string {
                if ($val === null) {
                    return '';
                }
                $trimmed = trim($val);
                if (strlen($trimmed) > 0 && in_array($trimmed[0], ['=', '+', '-', '@', "\t", "\r"])) {
                    return "'" . $trimmed;
                }
                return $trimmed;
            };

            $query->chunk(100, function ($submissions) use ($handle, &$index, $sanitize) {
                foreach ($submissions as $sub) {
                    $reg = $sub->registration;
                    $teamOrUser = $reg?->team ? $reg->team->name : ($reg?->user?->name ?? '-');

                    fputcsv($handle, [
                        $index++,
                        $sanitize($reg?->registration_number),
                        $sanitize($reg?->competition?->name),
                        $sanitize($sub->title),
                        $sanitize($teamOrUser),
                        $sanitize($reg?->user?->profile?->institution),
                        $sanitize($sub->repository_url),
                        $sanitize($sub->external_url),
                        $sanitize($sub->status?->value),
                        $sub->submitted_at ? $sub->submitted_at->format('Y-m-d H:i:s') : '-',
                        $sanitize($sub->admin_notes),
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
