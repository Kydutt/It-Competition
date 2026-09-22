<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\RegisterCompetitionRequest;
use App\Http\Resources\RegistrationResource;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationController extends ApiController
{
    public function __construct(
        protected RegistrationService $registrationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $registrations = $this->registrationService->getUserRegistrations($request->user());

        return $this->successResponse(
            RegistrationResource::collection($registrations),
            'Registrations retrieved successfully'
        );
    }

    public function store(RegisterCompetitionRequest $request): JsonResponse
    {
        $registration = $this->registrationService->register($request->user(), $request->validated());

        return $this->successResponse(
            new RegistrationResource($registration),
            'Registration submitted successfully',
            201
        );
    }
}
