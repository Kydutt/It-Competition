<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\StoreSubmissionRequest;
use App\Http\Requests\Participant\UploadSubmissionFileRequest;
use App\Http\Resources\SubmissionFileResource;
use App\Http\Resources\SubmissionResource;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionController extends ApiController
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    /**
     * List submissions for current user.
     */
    public function index(Request $request): JsonResponse
    {
        $submissions = $this->submissionService->getUserSubmissions($request->user());

        return $this->successResponse(
            SubmissionResource::collection($submissions),
            'Submissions retrieved successfully'
        );
    }

    /**
     * Initialize submission work for an eligible registration.
     */
    public function store(StoreSubmissionRequest $request): JsonResponse
    {
        $submission = $this->submissionService->createSubmission(
            $request->user(),
            (int) $request->input('registration_id'),
            $request->validated()
        );

        return $this->successResponse(
            new SubmissionResource($submission),
            'Pengumpulan karya berhasil dibuat sebagai draf',
            201
        );
    }

    /**
     * View submission detail.
     */
    public function show(Request $request, Submission $submission): JsonResponse
    {
        $user = $request->user();
        $reg = $submission->registration;
        $isOwner = $reg && $reg->user_id === $user->id;
        $isTeamMember = $submission->team?->members()->where('user_id', $user->id)->exists() ?? false;

        if (! $user->isAdmin() && ! $isOwner && ! $isTeamMember) {
            abort(403, 'Anda tidak memiliki hak akses ke data pengumpulan karya ini.');
        }

        $submission->load(['competition', 'team.leader', 'files', 'registration.user']);

        return $this->successResponse(
            new SubmissionResource($submission),
            'Submission retrieved successfully'
        );
    }

    /**
     * Upload a project file to submission.
     */
    public function uploadFile(UploadSubmissionFileRequest $request, Submission $submission): JsonResponse
    {
        $file = $this->submissionService->uploadFile(
            $request->user(),
            $submission,
            $request->file('file')
        );

        return $this->successResponse(
            new SubmissionFileResource($file),
            'Berkas karya berhasil diunggah',
            201
        );
    }

    /**
     * Delete a project file from submission.
     */
    public function removeFile(Request $request, Submission $submission, int $fileId): JsonResponse
    {
        $this->submissionService->removeFile($request->user(), $submission, $fileId);

        return $this->successResponse(
            null,
            'Berkas berhasil dihapus'
        );
    }

    /**
     * Finalize submission work before deadline.
     */
    public function submit(Request $request, Submission $submission): JsonResponse
    {
        $submitted = $this->submissionService->submitSubmission($request->user(), $submission);

        return $this->successResponse(
            new SubmissionResource($submitted),
            'Karya kompetisi berhasil dikumpulkan'
        );
    }

    /**
     * Download authorized submission file.
     */
    public function downloadFile(Request $request, Submission $submission, int $fileId): StreamedResponse
    {
        return $this->submissionService->getSubmissionFile($request->user(), $submission, $fileId);
    }
}
