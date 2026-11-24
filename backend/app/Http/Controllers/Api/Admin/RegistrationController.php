<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DocumentVerificationStatus;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRegistrationStatusRequest;
use App\Http\Requests\Admin\VerifyDocumentRequest;
use App\Models\ActivityLog;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Services\ActivityLogService;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationController extends Controller
{
    public function __construct(
        protected RegistrationService $registrationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Registration::with([
            'competition:id,name,slug,category_id,registration_type',
            'competition.category:id,name',
            'user:id,name,email',
            'user.profile:id,user_id,institution,phone',
            'team:id,name,leader_id',
        ])->withCount(['documents', 'submissions']);

        if ($request->filled('competition_id')) {
            $query->where('competition_id', $request->input('competition_id'));
        }

        if ($request->filled('category_id')) {
            $categoryId = $request->input('category_id');
            $query->whereHas('competition', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('registration_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('team', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $registrations = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $registrations,
        ]);
    }

    public function show(Registration $registration): JsonResponse
    {
        $registration->load([
            'competition.category',
            'competition.event',
            'participant.profile',
            'user.profile',
            'team.leader.profile',
            'team.members.profile',
            'documents.verifier:id,name',
            'submissions.revisions',
            'verifier:id,name,email',
        ]);

        $auditLogs = ActivityLog::where('entity_type', 'Registration')
            ->where('entity_id', $registration->id)
            ->with('user:id,name,email,role')
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'registration' => $registration,
                'audit_logs' => $auditLogs,
            ],
        ]);
    }

    public function updateStatus(UpdateRegistrationStatusRequest $request, Registration $registration): JsonResponse
    {
        $statusValue = $request->validated('status');
        $targetStatus = $statusValue instanceof RegistrationStatus ? $statusValue : RegistrationStatus::from($statusValue);
        $note = $request->validated('note') ?? $request->input('admin_notes');

        $updated = $this->registrationService->updateStatus(
            registration: $registration,
            targetStatus: $targetStatus,
            note: $note,
            admin: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Status pendaftaran {$updated->registration_number} berhasil diperbarui menjadi {$updated->status->value}.",
            'data' => $updated->load([
                'competition.category',
                'participant.profile',
                'user.profile',
                'team.leader.profile',
                'team.members.profile',
                'documents',
                'verifier:id,name',
            ]),
        ]);
    }

    public function verifyDocument(VerifyDocumentRequest $request, RegistrationDocument $document): JsonResponse
    {
        $statusValue = $request->validated('status');
        $statusEnum = $statusValue instanceof DocumentVerificationStatus ? $statusValue : DocumentVerificationStatus::from($statusValue);
        $note = $request->validated('note');

        $oldStatus = $document->verification_status?->value;

        $document->update([
            'verification_status' => $statusEnum,
            'verification_note' => $note,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        ActivityLogService::log(
            action: 'document.verify',
            entityType: 'RegistrationDocument',
            entityId: $document->id,
            oldValues: ['verification_status' => $oldStatus],
            newValues: ['verification_status' => $statusEnum->value, 'note' => $note],
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Status verifikasi dokumen berhasil diperbarui.',
            'data' => $document->fresh(['verifier:id,name']),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Registration::with([
            'competition:id,name',
            'user:id,name,email',
            'user.profile:id,user_id,institution,phone',
            'team.members',
        ]);

        if ($request->filled('competition_id')) {
            $query->where('competition_id', $request->input('competition_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $filename = 'registrations_export_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header
            fputcsv($handle, [
                'No',
                'Nomor Pendaftaran',
                'Cabang Kompetisi',
                'Tipe Registrasi',
                'Nama Pendaftar / Ketua',
                'Email',
                'Telepon / WhatsApp',
                'Institusi / Kampus',
                'Nama Tim',
                'Jumlah Anggota',
                'Status Pendaftaran',
                'Tanggal Submit',
                'Tanggal Verifikasi',
                'Catatan Panitia',
            ]);

            $index = 1;
            $query->chunk(100, function ($registrations) use ($handle, &$index) {
                foreach ($registrations as $reg) {
                    $teamCount = $reg->team ? $reg->team->members->count() : 1;

                    // Anti-CSV Formula Injection sanitization
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

                    fputcsv($handle, [
                        $index++,
                        $sanitize($reg->registration_number),
                        $sanitize($reg->competition?->name),
                        $sanitize($reg->registration_type?->value ?? 'individual'),
                        $sanitize($reg->user?->name),
                        $sanitize($reg->user?->email),
                        $sanitize($reg->user?->profile?->phone),
                        $sanitize($reg->user?->profile?->institution),
                        $sanitize($reg->team?->name ?? '-'),
                        $teamCount,
                        $sanitize($reg->status?->value),
                        $reg->submitted_at ? $reg->submitted_at->format('Y-m-d H:i:s') : '-',
                        $reg->verified_at ? $reg->verified_at->format('Y-m-d H:i:s') : '-',
                        $sanitize($reg->admin_notes ?? '-'),
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
