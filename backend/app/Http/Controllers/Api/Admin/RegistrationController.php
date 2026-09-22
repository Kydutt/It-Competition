<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Admin\RejectRegistrationRequest;
use App\Http\Requests\Admin\RevisionRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Registration;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationController extends ApiController
{
    public function __construct(
        protected RegistrationService $registrationService
    ) {}

    /**
     * Paginated list of registrations with search and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['competition_id', 'status', 'education_level', 'registration_date', 'search']);
        $perPage = (int) $request->query('per_page', 15);

        $registrations = $this->registrationService->getAdminPaginated($filters, $perPage);

        return $this->successResponse(
            RegistrationResource::collection($registrations)->response()->getData(true),
            'Registrations retrieved successfully'
        );
    }

    /**
     * View single registration detail.
     */
    public function show(Registration $registration): JsonResponse
    {
        $registration->load(['competition', 'team.leader', 'team.members.user', 'user', 'reviewer']);

        return $this->successResponse(
            new RegistrationResource($registration),
            'Registration retrieved successfully'
        );
    }

    /**
     * Approve registration.
     */
    public function approve(Request $request, Registration $registration): JsonResponse
    {
        $approved = $this->registrationService->approveRegistration($registration, $request->user());

        return $this->successResponse(
            new RegistrationResource($approved),
            'Pendaftaran berhasil disetujui'
        );
    }

    /**
     * Reject registration.
     */
    public function reject(RejectRegistrationRequest $request, Registration $registration): JsonResponse
    {
        $rejected = $this->registrationService->rejectRegistration(
            $registration,
            $request->user(),
            (string) $request->input('rejection_reason')
        );

        return $this->successResponse(
            new RegistrationResource($rejected),
            'Pendaftaran berhasil ditolak'
        );
    }

    /**
     * Request revision for registration.
     */
    public function revision(RevisionRegistrationRequest $request, Registration $registration): JsonResponse
    {
        $revisioned = $this->registrationService->requestRevision(
            $registration,
            $request->user(),
            (string) $request->input('revision_note')
        );

        return $this->successResponse(
            new RegistrationResource($revisioned),
            'Permintaan revisi berkas pendaftaran berhasil dikirim'
        );
    }
}
