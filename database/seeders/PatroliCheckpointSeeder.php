<?php

namespace Database\Seeders;

use App\Models\ClientProject;
use App\Models\PatroliCheckpoint;
use Illuminate\Database\Seeder;

class PatroliCheckpointSeeder extends Seeder
{
    public function run(): void
    {
        $projects = ClientProject::all();
        foreach ($projects as $project) {
            PatroliCheckpoint::create([
                'project_id' => $project->id,
                'name' => 'Gate A',
                'description' => 'Gerbang utama',
                'latitude' => -6.2,
                'longitude' => 106.8166,
                'radius_m' => 25,
                'sequence' => 1,
                'active' => true,
            ]);
            PatroliCheckpoint::create([
                'project_id' => $project->id,
                'name' => 'Basement',
                'description' => 'Area parkir bawah',
                'latitude' => -6.201,
                'longitude' => 106.8175,
                'radius_m' => 30,
                'sequence' => 2,
                'active' => true,
            ]);
        }
    }
}
