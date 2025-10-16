<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LeaveCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $categories = [
            [
                'code' => 'ANNUAL',
                'name' => 'Cuti Tahunan',
                'is_paid' => true,
                'deduct_balance' => true,
                'half_day_allowed' => true,
                'weekend_rule' => 'workdays',
                'base_quota_days' => 12,
                'prorate_on_join' => true,
                'prorate_on_resign' => true,
                'carryover_max_days' => 6,
                'carryover_expiry_months' => 3,
                'requires_proof' => false,
                'defaults' => json_encode(['cuti_bersama_deducts' => true]),
            ],
            [
                'code' => 'LONG',
                'name' => 'Cuti Besar',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'calendar',
                'base_quota_days' => 30,
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => true,
                'defaults' => null,
            ],
            [
                'code' => 'SICK',
                'name' => 'Cuti Sakit',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'workdays',
                'base_quota_days' => null,
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => true,
                'defaults' => null,
            ],
            [
                'code' => 'MENSTRUATION',
                'name' => 'Cuti Haid',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'workdays',
                'base_quota_days' => 2,
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => false,
                'defaults' => null,
            ],
            [
                'code' => 'MATERNITY',
                'name' => 'Cuti Melahirkan',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'calendar',
                'base_quota_days' => 90, // 1.5 + 1.5 months approx
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => true,
                'defaults' => null,
            ],
            [
                'code' => 'SPECIAL',
                'name' => 'Cuti Alasan Penting',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'workdays',
                'base_quota_days' => null,
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => true,
                'defaults' => json_encode([
                    'reasons' => [
                        'marriage' => 3,
                        'child_marriage' => 2,
                        'circumcision' => 2,
                        'baptism' => 2,
                        'wife_delivery_or_miscarriage' => 2,
                        'death_core_family' => 2,
                        'death_household_member' => 1,
                    ]
                ]),
            ],
            [
                'code' => 'HAJJ',
                'name' => 'Cuti Haji/Umrah',
                'is_paid' => true,
                'deduct_balance' => false,
                'half_day_allowed' => false,
                'weekend_rule' => 'calendar',
                'base_quota_days' => 50,
                'prorate_on_join' => false,
                'prorate_on_resign' => false,
                'carryover_max_days' => null,
                'carryover_expiry_months' => null,
                'requires_proof' => true,
                'defaults' => json_encode(['once_per_employment' => true]),
            ],
        ];

        foreach ($categories as $c) {
            DB::table('leave_categories')->updateOrInsert(
                ['code' => $c['code']],
                array_merge(
                    collect($c)->except(['code'])->all(),
                    ['updated_at' => $now, 'created_at' => $now]
                )
            );
        }
    }
}
