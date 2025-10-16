<?php

namespace Database\Seeders;

use App\Models\ApprovableType;
use Illuminate\Database\Seeder;

class ApprovableTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ApprovableType::query()->delete(); // Clear existing approvable types

        $approvableTypes = [
            [
                'name' => 'Leave Requests',
                'model_class' => 'App\\Models\\LeaveRequest',
                'status' => 'active',
            ],
            [
                'name' => 'Overtime Requests',
                'model_class' => 'App\\Models\\Overtime',
                'status' => 'active',
            ],
            // [
            //     'name' => 'Expense Claims',
            //     'model_class' => 'App\\Models\\ClientInvoice',
            //     'status' => 'active',
            // ],
            // [
            //     'name' => 'Document Approvals',
            //     'model_class' => 'App\\Models\\Document',
            //     'status' => 'active',
            // ],
        ];

        foreach ($approvableTypes as $type) {
            ApprovableType::firstOrCreate(
                ['model_class' => $type['model_class']],
                $type
            );
        }
    }
}
