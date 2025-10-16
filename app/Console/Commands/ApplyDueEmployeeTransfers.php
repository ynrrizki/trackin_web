<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmployeeHistory;

class ApplyDueEmployeeTransfers extends Command
{
    protected $signature = 'employee:apply-transfers {--dry-run : Only display due items without applying}';
    protected $description = 'Apply approved employee transfers/mutations/rotations whose effective date has arrived.';

    public function handle(): int
    {
        $query = EmployeeHistory::whereNull('applied_at')
            ->whereDate('effective_date', '<=', now()->toDateString())
            ->whereHas('approvals', function($q){ $q->where('status','approved'); })
            ->whereDoesntHave('approvals', function($q){ $q->where('status','pending'); })
            ->whereDoesntHave('approvals', function($q){ $q->where('status','rejected'); });

        $count = $query->count();
        if ($count === 0) {
            $this->info('No due approved histories to apply.');
            return self::SUCCESS;
        }

        $this->info("Found {$count} due approved history records.");
        if ($this->option('dry-run')) {
            $query->orderBy('effective_date')->limit(20)->get()->each(function ($h) {
                $this->line("#{$h->id} emp={$h->employee_id} type={$h->type} eff={$h->effective_date->toDateString()} -> position {$h->to_position_id}");
            });
            return self::SUCCESS;
        }

        $applied = 0;
        $query->chunkById(50, function ($chunk) use (&$applied) {
            foreach ($chunk as $history) {
                if ($history->applyIfDue()) {
                    $applied++;
                    $this->line("Applied history #{$history->id} for employee {$history->employee_id}.");
                }
            }
        });

        $this->info("Applied {$applied} histories.");
        return self::SUCCESS;
    }
}
