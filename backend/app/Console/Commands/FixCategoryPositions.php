<?php

namespace App\Console\Commands;

use App\Models\Catalog\Category;
use Illuminate\Console\Command;

class FixCategoryPositions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:fix-positions {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix and normalize category positions to ensure sequential ordering within each parent group';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('Running in dry-run mode. No changes will be made.');
            $this->newLine();
        }

        // Get all unique parent_ids (including null for root categories)
        $parentIds = Category::select('parent_id')
            ->distinct()
            ->pluck('parent_id')
            ->toArray();

        $totalFixed = 0;

        foreach ($parentIds as $parentId) {
            $categories = Category::where('parent_id', $parentId)
                ->orderBy('position')
                ->orderBy('name') // Secondary sort by name for consistent ordering
                ->get();

            if ($categories->isEmpty()) {
                continue;
            }

            $parentName = $parentId 
                ? Category::find($parentId)?->name ?? "Unknown (ID: {$parentId})"
                : 'Root Level';

            $this->info("Processing: {$parentName}");

            $position = 0;
            $changesInGroup = 0;

            foreach ($categories as $category) {
                if ($category->position !== $position) {
                    $changesInGroup++;
                    $this->line("  - {$category->name}: position {$category->position} → {$position}");
                    
                    if (!$isDryRun) {
                        $category->update(['position' => $position]);
                    }
                }
                $position++;
            }

            if ($changesInGroup > 0) {
                $totalFixed += $changesInGroup;
                $this->info("  Fixed {$changesInGroup} position(s) in this group.");
            } else {
                $this->line("  All positions are already correct.");
            }
            $this->newLine();
        }

        if ($isDryRun) {
            $this->warn("Dry run complete. {$totalFixed} position(s) would be fixed.");
        } else {
            $this->info("Done! Fixed {$totalFixed} category position(s).");
        }

        return Command::SUCCESS;
    }
}

