<?php

namespace Database\Seeders;

use App\Models\Administrator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdministratorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates the initial default super admin account for the system.
     * This is the ONLY way to create the first admin account.
     * After this seeder runs, only existing super_admin users can create
     * additional administrators through the API.
     *
     * IMPORTANT: Change the default password immediately after first login!
     */
    public function run(): void
    {
        // Check if super admin already exists to prevent duplicates
        if (Administrator::where('role', 'super_admin')->where('email', 'admin@ecommerce.com')->exists()) {
            $this->command->info('Super admin already exists. Skipping creation.');
            return;
        }

        // Create default super admin
        Administrator::create([
            'email' => 'ecom@yetfix.com',
            'password_hash' => Hash::make('yetfixIsTHePassword55'),
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'phone' => '+1234567890',
            'role' => 'super_admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->command->info('Default super admin created successfully!');
        $this->command->warn('Email: ecom@yetfix.com');
        $this->command->warn('Password: yetfixIsTHePassword55');
        $this->command->warn('IMPORTANT: Change this password immediately after first login!');

        // Create sample administrators for testing (optional - uncomment if needed)
        /*
        Administrator::create([
            'email' => 'manager@ecommerce.com',
            'password_hash' => Hash::make('Manager@123!'),
            'first_name' => 'John',
            'last_name' => 'Manager',
            'role' => 'manager',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        Administrator::create([
            'email' => 'staff@ecommerce.com',
            'password_hash' => Hash::make('Staff@123!'),
            'first_name' => 'Jane',
            'last_name' => 'Staff',
            'role' => 'staff',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        */
    }
}
