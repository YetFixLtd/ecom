<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SettingController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            return [$setting->key => [
                'value' => Setting::get($setting->key),
                'type' => $setting->type,
                'description' => $setting->description,
            ]];
        });

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * Update settings
     */
    public function update(Request $request, ImageService $imageService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'site_name' => 'nullable|string|max:255',
            'site_description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,svg,webp|max:2048',
            'favicon' => 'nullable|image|mimes:jpg,jpeg,png,ico,svg|max:1024',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            $oldLogo = Setting::get('site_logo_path');
            if ($oldLogo) {
                $imageService->deleteImage($oldLogo);
            }

            $logo = $request->file('logo');
            $path = $imageService->storeImage($logo, 'settings');
            
            Setting::set('site_logo_url', $path, 'string', 'Site logo URL');
            Setting::set('site_logo_path', $path, 'string', 'Site logo storage path');
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            // Delete old favicon if exists
            $oldFavicon = Setting::get('site_favicon_path');
            if ($oldFavicon) {
                $imageService->deleteImage($oldFavicon);
            }

            $favicon = $request->file('favicon');
            $path = $imageService->storeImage($favicon, 'settings');
            
            Setting::set('site_favicon_url', $path, 'string', 'Site favicon URL');
            Setting::set('site_favicon_path', $path, 'string', 'Site favicon storage path');
        }

        // Update text settings
        if ($request->has('site_name')) {
            Setting::set('site_name', $request->site_name, 'string', 'Site name');
        }

        if ($request->has('site_description')) {
            Setting::set('site_description', $request->site_description, 'string', 'Site description');
        }

        // Check for delete flags
        if ($request->boolean('delete_logo')) {
            $oldLogo = Setting::get('site_logo_path');
            if ($oldLogo) {
                $imageService->deleteImage($oldLogo);
            }
            Setting::where('key', 'site_logo_url')->delete();
            Setting::where('key', 'site_logo_path')->delete();
        }

        if ($request->boolean('delete_favicon')) {
            $oldFavicon = Setting::get('site_favicon_path');
            if ($oldFavicon) {
                $imageService->deleteImage($oldFavicon);
            }
            Setting::where('key', 'site_favicon_url')->delete();
            Setting::where('key', 'site_favicon_path')->delete();
        }

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => [
                'site_name' => Setting::get('site_name'),
                'site_description' => Setting::get('site_description'),
                'site_logo_url' => Setting::get('site_logo_url'),
                'site_favicon_url' => Setting::get('site_favicon_url'),
            ],
        ]);
    }
}
