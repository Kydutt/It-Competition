<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\MoneyHelper;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class MoneyHelperTest extends TestCase
{
    public function test_parses_valid_decimal_strings_and_integers_to_exact_rupiah(): void
    {
        $this->assertNull(MoneyHelper::parseWholeRupiahStrict(null));
        $this->assertSame(0, MoneyHelper::parseWholeRupiahStrict(0));
        $this->assertSame(0, MoneyHelper::parseWholeRupiahStrict('0.00'));
        $this->assertSame(50000, MoneyHelper::parseWholeRupiahStrict('50000.00'));
        $this->assertSame(1000000000, MoneyHelper::parseWholeRupiahStrict('1000000000.00'));
        $this->assertSame('50000.00', MoneyHelper::rupiahToDecimalString(50000));
    }

    public function test_rejects_fractional_rupiah_and_negative_values(): void
    {
        $this->expectException(InvalidArgumentException::class);
        MoneyHelper::parseWholeRupiahStrict('50000.50');
    }

    public function test_rejects_negative_rupiah(): void
    {
        $this->expectException(InvalidArgumentException::class);
        MoneyHelper::parseWholeRupiahStrict('-1000');
    }

    public function test_rejects_overflow_above_max_bound(): void
    {
        $this->expectException(InvalidArgumentException::class);
        MoneyHelper::parseWholeRupiahStrict('10000000000.00');
    }

    public function test_decimal_to_cents_handles_exact_minor_units_without_float_drift(): void
    {
        $this->assertSame(15000000, MoneyHelper::decimalToCents('150000.00'));
        $this->assertSame(2500050, MoneyHelper::decimalToCents('25000.50'));
        $this->assertSame(2500050, MoneyHelper::decimalToCents('25000.5'));
        $this->assertSame(25000.5, MoneyHelper::centsToNumericAmount(2500050));
        $this->assertSame(150000, MoneyHelper::centsToNumericAmount(15000000));
        $this->assertSame('150.000', MoneyHelper::formatCentsForDisplay(15000000));
    }
}
