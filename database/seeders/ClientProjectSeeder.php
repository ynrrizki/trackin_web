<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientProject;
use App\Models\OutsourcingField;
use Illuminate\Database\Seeder;

class ClientProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have clients
        $clients = Client::all();
        if ($clients->isEmpty()) {
            $this->call(ClientSeeder::class);
            $clients = Client::all();
        }
        // Pastikan outsourcing field Security tersedia
        $securityOutField = OutsourcingField::firstOrCreate(
            ['code' => 'SEC'],
            [
                'name' => 'Security',
                'description' => 'Security / Satpam outsourced field',
                'status' => 'active'
            ]
        );

        foreach ($clients as $client) {
            $code = strtoupper(substr($client->code,0,6)).'-A';
            if (ClientProject::where('code', $code)->exists()) {
                continue; // already seeded
            }
            ClientProject::create([
                'client_id' => $client->id,
                'outsourcing_field_id' => $securityOutField->id,
                'code' => $code,
                'name' => $client->name.' Site A',
                'contact_person' => $client->contact_person,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
                'latitude' => '-6.2',
                'longitude' => '106.8',
                'required_agents' => 2,
                'status' => 'won',
                'contract_start' => now()->subMonths(1),
                'contract_end' => now()->addYear(),
                'hourly_rate' => null,
                'monthly_rate' => 5000000,
                'special_requirements' => null,
                'notes' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
