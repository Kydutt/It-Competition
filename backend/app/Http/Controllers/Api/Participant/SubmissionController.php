<?php

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\SubmitRevisionRequest;
use App\Http\Requests\Participant\SubmitWorkRequest;
use App\Http\Resources\SubmissionResource;
use App\Models\Registration;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SubmissionController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $submissions = Submission::query()
            ->whereHas('registration', function ($q) use ($user) {
                $q->where('participant_id', $user->id)
                  ->orWhereHas('team.members', fn ($mq) => $mq->where('users.id', $user->id));
            })
            ->with(['registration.competition', 'revisions'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengumpulan karya berhasil diambil.',
            'data' => SubmissionResource::collection($submissions),
        ]);
    }

    public function store(SubmitWorkRequest $request): JsonResponse
    {
        $user = $request->user();
        $registration = Registration::findOrFail($request->validated('registration_id'));

        Gate::authorize('create', [Submission::class, $registration]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('submissions/' . $registration->id, 'public');
        }

        $data = array_merge($request->validated(), [
            'file_path' => $filePath,
        ]);

        $submission = $this->submissionService->submitWork($registration, $data, $user);

        return response()->json([
            'success' => true,
            'message' => 'Karya kompetisi berhasil dikumpulkan.',
            'data' => new SubmissionResource($submission->load(['registration.competition', 'revisions'])),
        ], 201);
    }

    public function show(Request $request, Submission $submission): JsonResponse
    {
        Gate::authorize('view', $submission);

        $submission->load(['registration.competition', 'revisions']);

        return response()->json([
            'success' => true,
            'message' => 'Detail pengumpulan karya berhasil diambil.',
            'data' => new SubmissionResource($submission),
        ]);
    }

    public function submitRevision(SubmitRevisionRequest $request, Submission $submission): JsonResponse
    {
        Gate::authorize('addRevision', $submission);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('submissions/' . $submission->registration_id, 'public');
        }

        $data = [
            'file_path' => $filePath,
            'external_url' => $request->validated('external_url'),
            'revision_note' => $request->validated('notes') ?? $request->validated('revision_note'),
        ];

        $updated = $this->submissionService->submitRevision($submission, $data, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Berkas revisi karya berhasil dikirimkan.',
            'data' => new SubmissionResource($updated->load(['registration.competition', 'revisions'])),
        ]);
    }
}
