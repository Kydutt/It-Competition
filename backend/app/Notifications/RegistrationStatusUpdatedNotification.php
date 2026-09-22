<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(public Registration $registration) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Update Status Pendaftaran - HIMATIF IT Competition')
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Status pendaftaran kompetisi Anda telah diperbarui menjadi: '.$this->registration->status->value)
            ->action('Lihat Pendaftaran', url('/registrations'))
            ->line('Terima kasih telah berpartisipasi dalam HIMATIF IT Competition!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'registration_id' => $this->registration->id,
            'competition_id' => $this->registration->competition_id,
            'status' => $this->registration->status->value,
            'message' => 'Status pendaftaran Anda diperbarui menjadi '.$this->registration->status->value,
        ];
    }
}
