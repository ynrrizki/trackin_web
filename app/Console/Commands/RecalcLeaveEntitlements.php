<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;
use App\Models\LeaveCategory;
use App\Services\LeaveEntitlementEngine;

class RecalcLeaveEntitlements extends Command
{
    protected $signature = 'leave:recalc {year?} {--employee_id=} {--category_code=}';
    protected $description = 'Recalculate leave entitlements for a year';

    public function handle(LeaveEntitlementEngine $engine)
    {
        $year = (int)($this->argument('year') ?? now()->year);
        $employees = Employee::query();
        if ($id = $this->option('employee_id')) {
            $employees->where('id', $id);
        }
        $employees = $employees->get();

        $categories = LeaveCategory::query();
        if ($code = $this->option('category_code')) {
            $categories->where('code', $code);
        }
        $categories = $categories->get();

        foreach ($employees as $emp) {
            foreach ($categories as $cat) {
                $ent = $engine->recalcYear($emp, $cat, $year);
                $this->info("Recalced {$emp->id} {$cat->code} {$year}: closing={$ent->closing}");
            }
        }

        return self::SUCCESS;
    }
}
