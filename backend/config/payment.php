<?php

declare(strict_types=1);

return [
    'bank_name' => env('PAYMENT_BANK_NAME', 'Bank Central Asia (BCA)'),
    'account_number' => env('PAYMENT_ACCOUNT_NUMBER', '8240-1234-5678'),
    'account_name' => env('PAYMENT_ACCOUNT_NAME', 'HIMATIF IT Competition'),
    'instructions' => [
        'Lakukan transfer sesuai nominal biaya pendaftaran ke nomor rekening yang tertera.',
        'Sertakan nomor registrasi Anda pada berita transfer (contoh: ITC-2026-XXXXX).',
        'Simpan dan unggah bukti transfer yang jelas (struk ATM, mutasi mobile banking, atau slip setoran).',
        'Format berkas yang didukung: JPG, PNG, atau PDF dengan ukuran maksimal 5 MB.',
        'Panitia akan memverifikasi pembayaran Anda dalam kurun waktu maksimal 1x24 jam kerja.',
    ],
];
