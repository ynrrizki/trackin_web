<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Employee;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        // Filters: type = internal | outsourcing | all; period = months back span (default 12)
        $type = $request->get('type', 'all');
        $months = (int) $request->get('months', 12);
        if ($months < 1 || $months > 36) {
            $months = 12;
        }

        $end = Carbon::now()->startOfMonth();
        $start = (clone $end)->copy()->subMonths($months - 1); // inclusive

        // Base employee query by type
        $base = Employee::query();
        if ($type === 'internal') {
            $base->whereNull('outsourcing_field_id');
        } elseif ($type === 'outsourcing') {
            $base->whereNotNull('outsourcing_field_id');
        }

        // Collect monthly snapshots for headcount, hires, resignations
        $periodMonths = [];
        $cursor = $start->copy();
        while ($cursor <= $end) {
            $periodMonths[] = $cursor->copy();
            $cursor->addMonth();
        }

        $monthly = [];
        foreach ($periodMonths as $month) {
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            // Hires = join_date within month
            $hires = (clone $base)
                ->whereBetween('join_date', [$monthStart, $monthEnd])
                ->count();

            // Resignations = resignation_date within month OR status resigned & end_date within month
            $resignations = (clone $base)
                ->where(function ($q) use ($monthStart, $monthEnd) {
                    $q->whereBetween('resignation_date', [$monthStart, $monthEnd])
                        ->orWhereBetween('end_date', [$monthStart, $monthEnd]);
                })
                ->count();

            // Average headcount = (headcount at start + headcount at end)/2
            $headcountStart = (clone $base)
                ->whereDate('join_date', '<=', $monthStart)
                ->where(function ($q) use ($monthStart) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $monthStart);
                })
                ->count();
            $headcountEnd = (clone $base)
                ->whereDate('join_date', '<=', $monthEnd)
                ->where(function ($q) use ($monthEnd) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $monthEnd);
                })
                ->count();
            $avgHeadcount = ($headcountStart + $headcountEnd) / 2.0;

            $turnoverRate = $avgHeadcount > 0 ? round(($resignations / $avgHeadcount) * 100, 2) : 0.0;

            $monthly[] = [
                'month' => $monthStart->format('Y-m'),
                'label' => $monthStart->format('M Y'),
                'hires' => $hires,
                'resignations' => $resignations,
                'avg_headcount' => $avgHeadcount,
                'turnover_rate' => $turnoverRate,
            ];
        }

        // Aggregate stats
        $totalHires = array_sum(array_column($monthly, 'hires'));
        $totalResignations = array_sum(array_column($monthly, 'resignations'));
        $last = end($monthly) ?: null;

        $overallAvgHeadcount = 0;
        if (count($monthly) > 0) {
            $overallAvgHeadcount = array_sum(array_column($monthly, 'avg_headcount')) / count($monthly);
        }
        $overallTurnoverRate = $overallAvgHeadcount > 0 ? round(($totalResignations / $overallAvgHeadcount) * 100, 2) : 0;

        $currentActive = (clone $base)
            ->whereNull('resignation_date')
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', Carbon::now());
            })
            ->count();

        return Inertia::render('dashboard', [
            'turnover' => [
                'filter' => [
                    'type' => $type,
                    'months' => $months,
                    'range' => [
                        'start' => $start->toDateString(),
                        'end' => $end->toDateString(),
                    ],
                ],
                'monthly' => $monthly,
                'totals' => [
                    'hires' => $totalHires,
                    'resignations' => $totalResignations,
                    'avg_headcount' => round($overallAvgHeadcount, 1),
                    'turnover_rate' => $overallTurnoverRate,
                    'current_active' => $currentActive,
                    'latest_month' => $last['label'] ?? null,
                ],
            ],
        ]);
    }
}
