<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\RegistrationStatus;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Admin\VerifyRegistrationRequest;
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

    public function index(Request $request): JsonResponse
    {
        $registrations = $this->registrationService->getAdminPaginated((int) $request->query('per_page', 15));

        return $this->successResponse(
            RegistrationResource::collection($registrations)->response()->getData(true),
            'Registrations retrieved successfully'
        );
    }

    public function verify(VerifyRegistrationRequest $request, Registration $registration): JsonResponse
    {
        $updated = $this->registrationService->verify(
            $registration,
            $request->enum('status', RegistrationStatus::class),
            $request->input('notes'),
            $request->user()
        );

        return $this->successResponse(
            new RegistrationResource($updated),
            'Registration status updated successfully'
        );
    }
}
