<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Store an image and return its path
     *
     * @param UploadedFile $file
     * @param string $directory
     * @return string
     */
    public function storeImage(UploadedFile $file, string $directory = 'images'): string
    {
        // Generate a unique filename
        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        
        // Store the file in the public disk
        $path = $file->storeAs($directory, $filename, 'public');
        
        // Return the storage path (which will be used as URL path)
        return '/storage/' . $path;
    }

    /**
     * Delete an image from storage
     *
     * @param string $path
     * @return bool
     */
    public function deleteImage(string $path): bool
    {
        // Remove /storage/ prefix if present
        $storagePath = str_replace('/storage/', '', $path);
        
        // Check if file exists and delete it
        if (Storage::disk('public')->exists($storagePath)) {
            return Storage::disk('public')->delete($storagePath);
        }
        
        return false;
    }

    /**
     * Store multiple images
     *
     * @param array $files
     * @param string $directory
     * @return array
     */
    public function storeImages(array $files, string $directory = 'images'): array
    {
        $paths = [];
        
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $paths[] = $this->storeImage($file, $directory);
            }
        }
        
        return $paths;
    }

    /**
     * Delete multiple images
     *
     * @param array $paths
     * @return int Number of files deleted
     */
    public function deleteImages(array $paths): int
    {
        $deleted = 0;
        
        foreach ($paths as $path) {
            if ($this->deleteImage($path)) {
                $deleted++;
            }
        }
        
        return $deleted;
    }
}

