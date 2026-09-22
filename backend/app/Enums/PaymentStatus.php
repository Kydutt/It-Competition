<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case NotRequired = 'NOT_REQUIRED';
    case Unpaid = 'UNPAID';
    case WaitingVerification = 'WAITING_VERIFICATION';
    case Paid = 'PAID';
    case PaymentRejected = 'PAYMENT_REJECTED';
    case Refund = 'REFUND';
}
