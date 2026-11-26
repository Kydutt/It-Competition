<?php

declare(strict_types=1);

namespace App\Support;

use InvalidArgumentException;

/**
 * Exact string/integer monetary conversion helpers for IDR (Rupiah).
 *
 * Avoids binary floating-point arithmetic when reading DECIMAL(12,2) values,
 * validating whole-integer Rupiah, and comparing minor units (cents).
 */
class MoneyHelper
{
    public const MAX_DB_RUPIAH = 9_999_999_999;

    public const MAX_COMPETITION_FEE_RUPIAH = 1_000_000_000;

    public const MAX_DB_CENTS = 999_999_999_999;

    /**
     * Parse a DECIMAL(12,2) string or integer into an exact whole-Rupiah integer.
     *
     * Rejects negative values, fractional Rupiah digits (e.g. "50000.50"),
     * malformed strings, and values exceeding the configured maximum bound.
     */
    public static function parseWholeRupiahStrict(int|string|null $value, int $maxRupiah = self::MAX_DB_RUPIAH): ?int
    {
        if ($value === null) {
            return null;
        }

        if (is_int($value)) {
            if ($value < 0 || $value > $maxRupiah) {
                throw new InvalidArgumentException("Nominal Rupiah berada di luar batas yang diizinkan (0..{$maxRupiah}).");
            }

            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '' || ! preg_match('/^(\d+)(?:\.(\d+))?$/', $trimmed, $matches)) {
            throw new InvalidArgumentException('Format nominal Rupiah tidak valid.');
        }

        $whole = ltrim($matches[1], '0');
        $whole = $whole === '' ? '0' : $whole;
        $fraction = $matches[2] ?? '';

        if ($fraction !== '' && preg_match('/[1-9]/', $fraction)) {
            throw new InvalidArgumentException('Nominal biaya pendaftaran harus bilangan bulat Rupiah tanpa pecahan desimal.');
        }

        if (self::comparePositiveDigitStrings($whole, (string) $maxRupiah) > 0) {
            throw new InvalidArgumentException("Nominal Rupiah melebihi batas maksimal ({$maxRupiah}).");
        }

        return (int) $whole;
    }

    /**
     * Convert a non-negative decimal string or integer (up to 2 decimal places)
     * into exact integer minor units (cents / x100) without floating-point math.
     */
    public static function decimalToCents(int|string $value, int $maxCents = self::MAX_DB_CENTS): int
    {
        if (is_int($value)) {
            if ($value < 0 || $value > intdiv($maxCents, 100)) {
                throw new InvalidArgumentException('Nominal di luar batas konversi minor unit.');
            }

            return $value * 100;
        }

        $trimmed = trim($value);
        if ($trimmed === '' || ! preg_match('/^(\d+)(?:\.(\d+))?$/', $trimmed, $matches)) {
            throw new InvalidArgumentException('Format nominal desimal tidak valid.');
        }

        $whole = ltrim($matches[1], '0');
        $whole = $whole === '' ? '0' : $whole;
        $fraction = $matches[2] ?? '';

        if (strlen($fraction) > 2) {
            $extra = substr($fraction, 2);
            if (preg_match('/[1-9]/', $extra)) {
                throw new InvalidArgumentException('Nominal mendukung maksimal 2 angka di belakang koma.');
            }
            $fraction = substr($fraction, 0, 2);
        }

        $frac2 = str_pad($fraction, 2, '0', STR_PAD_RIGHT);
        $centsString = ltrim($whole . $frac2, '0');
        $centsString = $centsString === '' ? '0' : $centsString;

        if (self::comparePositiveDigitStrings($centsString, (string) $maxCents) > 0) {
            throw new InvalidArgumentException('Nominal melebihi batas maksimum penyimpanan database.');
        }

        return (int) $centsString;
    }

    /**
     * Format whole-Rupiah integer into canonical DECIMAL(12,2) storage string.
     */
    public static function rupiahToDecimalString(int $rupiah): string
    {
        if ($rupiah < 0 || $rupiah > self::MAX_DB_RUPIAH) {
            throw new InvalidArgumentException('Nominal Rupiah berada di luar batas penyimpanan.');
        }

        return $rupiah . '.00';
    }

    /**
     * Convert minor-unit cents integer back into a numeric scalar for JSON/audit metadata.
     */
    public static function centsToNumericAmount(int $cents): int|float
    {
        if ($cents < 0) {
            $cents = 0;
        }

        if ($cents % 100 === 0) {
            return intdiv($cents, 100);
        }

        return round($cents / 100, 2);
    }

    /**
     * Format minor-unit cents integer as whole-Rupiah text with Indonesian thousands separator.
     */
    public static function formatCentsForDisplay(int $cents): string
    {
        $whole = intdiv(max(0, $cents), 100);
        $rem = max(0, $cents) % 100;
        $formattedWhole = self::formatThousands($whole);

        if ($rem === 0) {
            return $formattedWhole;
        }

        return $formattedWhole . ',' . str_pad((string) $rem, 2, '0', STR_PAD_LEFT);
    }

    protected static function formatThousands(int $whole): string
    {
        $digits = (string) max(0, $whole);
        $result = '';
        $count = 0;

        for ($i = strlen($digits) - 1; $i >= 0; $i--) {
            if ($count > 0 && $count % 3 === 0) {
                $result = '.' . $result;
            }
            $result = $digits[$i] . $result;
            $count++;
        }

        return $result;
    }

    /**
     * Lexicographical numerical comparison of two non-negative normalized digit strings.
     */
    protected static function comparePositiveDigitStrings(string $left, string $right): int
    {
        $lenDiff = strlen($left) <=> strlen($right);
        if ($lenDiff !== 0) {
            return $lenDiff;
        }

        return strcmp($left, $right);
    }
}
