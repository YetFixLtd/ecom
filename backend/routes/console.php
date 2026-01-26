<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');



// Scheduled tasks
// Requires system cron to run: php artisan schedule:run (typically every minute)
Schedule::command('backup:clean')->dailyAt('00:30');
Schedule::command('backup:run')->dailyAt('01:00');
