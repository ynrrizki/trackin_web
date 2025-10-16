<?php

namespace App\Support;

use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class WorkdayCalendar
{
    /**
     * Determine if a date is a weekend (Sat/Sun)
     */
    public static function isWeekend(Carbon $date): bool
    {
        return in_array($date->dayOfWeekIso, [6,7], true);
    }

    /**
     * Determine if a date is a holiday (including cuti bersama flag)
     */
    public static function isHoliday(Carbon $date): bool
    {
        return Holiday::where('date', $date->toDateString())->exists();
    }

    /**
     * Count workdays between two dates inclusive, excluding weekends and holidays.
     */
    public static function countWorkdays(Carbon $start, Carbon $end): int
    {
        $count = 0;
        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->startOfDay()) as $day) {
            if (self::isWeekend($day) || self::isHoliday($day)) {
                continue;
            }
            $count++;
        }
        return $count;
    }

    /**
     * Get all workdays between two dates inclusive
     */
    public static function workdaysBetween(Carbon $start, Carbon $end): array
    {
        $days = [];
        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->startOfDay()) as $day) {
            if (self::isWeekend($day) || self::isHoliday($day)) {
                continue;
            }
            $days[] = $day->toDateString();
        }
        return $days;
    }
}
