<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\CreateRegistrationRequest;
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
     * List user's registrations.
     */
    public function index(Request $request): JsonResponse
    {
        $registrations = $this->registrationService->getUserRegistrations($request->user());

        return $this->successResponse(
            RegistrationResource::collection($registrations),
            'Registrations retrieved successfully'
        );
    }

    /**
     * Start/create a new draft registration.
     */
    public function store(CreateRegistrationRequest $request): JsonResponse
    {
        $registration = $this->registrationService->createRegistration(
            $request->user(),
            $request->validated()
        );

        return $this->successResponse(
            new RegistrationResource($registration),
            'Pendaftaran berhasil dibuat sebagai draf',
            201
        );
    }

    /**
     * View registration details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $registration = $this->registrationService->getRegistration($request->user(), $id);

        return $this->successResponse(
            new RegistrationResource($registration),
            'Registration retrieved successfully'
        );
    }

    /**
     * Finalize and submit registration for admin review.
     */
    public function submit(Request $request, Registration $registration): JsonResponse
    {
        $submitted = $this->registrationService->submitRegistration($registration, $request->user());

        return $this->successResponse(
            new RegistrationResource($submitted),
            'Pendaftaran berhasil disubmit untuk diverifikasi'
        );
    }

    /**
     * Cancel registration.
     */
    public function cancel(Request $request, Registration $registration): JsonResponse
    {
        $cancelled = $this->registrationService->cancelRegistration($registration, $request->user());

        return $this->successResponse(
            new RegistrationResource($cancelled),
            'Pendaftaran berhasil dibatalkan'
        );
    }
}
