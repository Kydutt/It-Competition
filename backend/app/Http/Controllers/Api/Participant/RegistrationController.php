<?php

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\CreateRegistrationDraftRequest;
use App\Http\Requests\Participant\UploadDocumentRequest;
use App\Http\Resources\RegistrationDocumentResource;
use App\Http\Resources\RegistrationResource;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationController extends Controller
{
    public function __construct(
        protected RegistrationService $registrationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Registration::query()
            ->where(function ($q) use ($user) {
                $q->where('participant_id', $user->id)
                  ->orWhereHas('team.members', fn ($mq) => $mq->where('users.id', $user->id));
            })
            ->with(['competition.category', 'competition.event', 'team.leader', 'documents', 'submissions', 'latestPayment'])
            ->orderBy('created_at', 'desc');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $registrations = $query->paginate(min((int) $request->query('per_page', 10), 50));

        return response()->json([
            'success' => true,
            'message' => 'Daftar pendaftaran kompetisi berhasil diambil.',
            'data' => RegistrationResource::collection($registrations),
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
            ],
        ]);
    }

    public function store(CreateRegistrationDraftRequest $request): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($request->validated('competition_id'));

        $registration = $this->registrationService->createDraft(
            $user,
            $competition,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Draf pendaftaran kompetisi berhasil dibuat.',
            'data' => new RegistrationResource(
                $registration->load(['competition.category', 'team.members', 'documents'])
            ),
        ], 201);
    }

    public function show(Request $request, Registration $registration): JsonResponse
    {
        Gate::authorize('view', $registration);

        $registration->load([
            'competition.category',
            'competition.event',
            'team.members.profile',
            'team.leader',
            'documents',
            'submissions.revisions',
            'latestPayment',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail pendaftaran kompetisi berhasil diambil.',
            'data' => new RegistrationResource($registration),
        ]);
    }

    public function update(Request $request, Registration $registration): JsonResponse
    {
        Gate::authorize('update', $registration);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $registration->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catatan pendaftaran berhasil diperbarui.',
            'data' => new RegistrationResource($registration->fresh(['competition.category', 'documents'])),
        ]);
    }

    public function uploadDocument(UploadDocumentRequest $request, Registration $registration): JsonResponse
    {
        Gate::authorize('uploadDocument', $registration);

        $document = $this->registrationService->uploadDocument(
            $registration,
            $request->validated('document_type'),
            $request->file('file'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Berkas persyaratan berhasil diunggah.',
            'data' => new RegistrationDocumentResource($document),
        ]);
    }

    public function downloadDocument(Request $request, RegistrationDocument $document): StreamedResponse
    {
        Gate::authorize('download', $document);

        if (! Storage::exists($document->file_path)) {
            abort(404, 'Berkas fisik dokumen tidak ditemukan di server.');
        }

        return Storage::download(
            $document->file_path,
            $document->original_filename,
            ['Content-Type' => $document->mime_type]
        );
    }

    public function submit(Request $request, Registration $registration): JsonResponse
    {
        Gate::authorize('submit', $registration);

        $submitted = $this->registrationService->submit($registration, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran kompetisi berhasil dikirimkan untuk verifikasi panitia.',
            'data' => new RegistrationResource(
                $submitted->load(['competition.category', 'team.members', 'documents'])
            ),
        ]);
    }
}
