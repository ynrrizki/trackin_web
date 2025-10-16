<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class IncidentFactory extends Factory
{
    public function definition(): array
    {
        $locations = [
            ['Bekasi, Jawa Barat', -6.241586, 106.992416],
            ['Semarang, Jawa Tengah', -7.005145, 110.438125],
            ['Surabaya, Jawa Timur', -7.257472, 112.752090],
            ['Bandung, Jawa Barat', -6.914864, 107.608238],
            ['Yogyakarta', -7.797068, 110.370529],
        ];

        $loc = $this->faker->randomElement($locations);

        return [
            'name' => $this->faker->sentence(3),
            'date' => $this->faker->date(),
            'time' => $this->faker->time(),
            'location' => $loc[0],
            'handling_steps' => $this->faker->sentence(6),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['Selesai', 'Dalam Penanganan', 'Belum Ditangani']),
            'severity' => $this->faker->randomElement(['Rendah', 'Sedang', 'Tinggi']),
            'lat' => $loc[1],
            'long' => $loc[2],
        ];
    }
}
