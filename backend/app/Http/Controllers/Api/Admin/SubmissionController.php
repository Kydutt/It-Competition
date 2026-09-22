<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
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
     * Paginated list of submissions with search and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['competition_id', 'status', 'search']);
        $perPage = (int) $request->query('per_page', 15);

        $submissions = $this->submissionService->getAdminPaginated($filters, $perPage);

        return $this->successResponse(
            SubmissionResource::collection($submissions)->response()->getData(true),
            'Submissions retrieved successfully'
        );
    }

    /**
     * View submission detail with uploaded files.
     */
    public function show(Submission $submission): JsonResponse
    {
        $submission->load(['competition', 'team.leader', 'files', 'registration.user']);

        return $this->successResponse(
            new SubmissionResource($submission),
            'Submission details retrieved successfully'
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
