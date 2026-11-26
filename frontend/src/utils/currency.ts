export function formatRupiah(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0)
  if (!Number.isFinite(numeric)) {
    return 'Rp0'
  }

  return `Rp${Math.round(numeric).toLocaleString('id-ID')}`
}

export function formatCompetitionFee(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'Gratis'
  }
  const numeric = typeof amount === 'string' ? Number(amount) : Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Gratis'
  }

  return formatRupiah(numeric)
}

export function getLockedRegistrationFee(
  registration?: {
    registration_fee_snapshot?: number | null
    competition?: { registration_fee?: number | string | null } | null
  } | null
): number | null {
  if (!registration) {
    return null
  }
  if ('registration_fee_snapshot' in registration) {
    return registration.registration_fee_snapshot ?? null
  }
  const fallback = registration.competition?.registration_fee
  return fallback !== undefined && fallback !== null ? Number(fallback) : null
}

export function formatRegistrationFee(fee: number | null | undefined): string {
  if (fee === null || fee === undefined) {
    return 'Menunggu Konfirmasi'
  }

  return formatCompetitionFee(fee)
}

export function formatDateTimeID(isoString: string | null | undefined): string {
  if (!isoString) {
    return '-'
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
