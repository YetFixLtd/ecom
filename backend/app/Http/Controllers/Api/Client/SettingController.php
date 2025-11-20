<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Get public settings
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'site_name' => Setting::get('site_name', 'E-Commerce Store'),
                'site_description' => Setting::get('site_description'),
                'site_logo_url' => Setting::get('site_logo_url'),
                'site_favicon_url' => Setting::get('site_favicon_url'),
            ],
        ]);
    }
}
