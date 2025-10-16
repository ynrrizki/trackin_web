<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        // Use delete instead of truncate to avoid FK constraint issues on MySQL
        Client::query()->delete();
        Client::insert([
            [
                'code' => 'CLI-ACME',
                'name' => 'PT Acme Indonesia',
                'contact_person' => 'Budi',
                'email' => 'contact@acme.id',
                'phone' => '021-555-1234',
                'address' => 'Jl. Merdeka No. 1, Jakarta',
                'industry' => 'Manufaktur',
                'status' => 'active',
                'notes' => 'Klien prioritas',
                'logo_url' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'CLI-BETA',
                'name' => 'CV Beta Solusi',
                'contact_person' => 'Sari',
                'email' => 'info@betasolusi.co.id',
                'phone' => '022-123-789',
                'address' => 'Jl. Asia Afrika No. 10, Bandung',
                'industry' => 'Jasa',
                'status' => 'active',
                'notes' => null,
                'logo_url' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
