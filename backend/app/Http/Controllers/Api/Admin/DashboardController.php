<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\DashboardActivityResource;
use App\Http\Resources\Admin\DashboardOrderResource;
use App\Http\Resources\Admin\DashboardStatsResource;
use App\Models\Catalog\Product;
use App\Models\Inventory\InventoryAdjustment;
use App\Models\Inventory\Transfer;
use App\Models\Order\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Admin Dashboard Controller
 *
 * Provides dashboard statistics, recent orders, and activity feed
 * for the admin dashboard interface.
 */
class DashboardController extends Controller
{
    /**
     * Get dashboard statistics and chart data.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $thisWeek = $now->copy()->startOfWeek();
        $thisMonth = $now->copy()->startOfMonth();
        $thirtyDaysAgo = $now->copy()->subDays(30)->startOfDay();

        // Revenue calculations
        $revenueToday = Order::where('created_at', '>=', $today)
            ->where('status', '!=', 'canceled')
            ->sum('grand_total');

        $revenueThisWeek = Order::where('created_at', '>=', $thisWeek)
            ->where('status', '!=', 'canceled')
            ->sum('grand_total');

        $revenueThisMonth = Order::where('created_at', '>=', $thisMonth)
            ->where('status', '!=', 'canceled')
            ->sum('grand_total');

        $revenueAllTime = Order::where('status', '!=', 'canceled')
            ->sum('grand_total');

        // Order counts
        $ordersToday = Order::where('created_at', '>=', $today)->count();
        $ordersThisWeek = Order::where('created_at', '>=', $thisWeek)->count();
        $ordersThisMonth = Order::where('created_at', '>=', $thisMonth)->count();
        $ordersAllTime = Order::count();

        // Product and customer counts
        $totalProducts = Product::count();
        $totalCustomers = User::count();

        // Average order value
        $avgOrderValue = $ordersAllTime > 0
            ? $revenueAllTime / $ordersAllTime
            : 0;

        // Revenue chart data (last 30 days)
        $revenueChartData = Order::where('created_at', '>=', $thirtyDaysAgo)
            ->where('status', '!=', 'canceled')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'revenue' => (float) $item->revenue,
                ];
            });

        // Fill in missing dates with 0 revenue
        $revenueChartData = $this->fillMissingDates($revenueChartData, $thirtyDaysAgo, $now);

        // Orders chart data (last 30 days)
        $ordersChartData = Order::where('created_at', '>=', $thirtyDaysAgo)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => (int) $item->count,
                ];
            });

        // Fill in missing dates with 0 orders
        $ordersChartData = $this->fillMissingDates($ordersChartData, $thirtyDaysAgo, $now, 'count');

        // Order status distribution
        $orderStatusDistribution = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status,
                    'count' => (int) $item->count,
                ];
            });

        // Top 5 products by revenue
        try {
            $topProducts = Order::join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('product_variants', 'order_items.variant_id', '=', 'product_variants.id')
                ->join('products', 'product_variants.product_id', '=', 'products.id')
                ->where('orders.status', '!=', 'canceled')
                ->select(
                    'products.id',
                    'products.name',
                    DB::raw('SUM(order_items.total) as revenue'),
                    DB::raw('SUM(order_items.qty) as units_sold')
                )
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('revenue')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'revenue' => (float) $item->revenue,
                        'units_sold' => (int) $item->units_sold,
                    ];
                });
        } catch (\Exception $e) {
            // If query fails (e.g., no orders yet), return empty collection
            $topProducts = collect();
        }

        $stats = [
            'revenue' => [
                'today' => (float) $revenueToday,
                'this_week' => (float) $revenueThisWeek,
                'this_month' => (float) $revenueThisMonth,
                'all_time' => (float) $revenueAllTime,
            ],
            'orders' => [
                'today' => $ordersToday,
                'this_week' => $ordersThisWeek,
                'this_month' => $ordersThisMonth,
                'all_time' => $ordersAllTime,
            ],
            'products' => [
                'total' => $totalProducts,
            ],
            'customers' => [
                'total' => $totalCustomers,
            ],
            'average_order_value' => (float) $avgOrderValue,
            'charts' => [
                'revenue' => $revenueChartData->values(),
                'orders' => $ordersChartData->values(),
                'order_status' => $orderStatusDistribution->values(),
            ],
            'top_products' => $topProducts->values(),
        ];

        return response()->json([
            'data' => $stats,
        ]);
    }

    /**
     * Get recent orders for dashboard.
     *
     * @return JsonResponse
     */
    public function recentOrders(): JsonResponse
    {
        $orders = Order::with(['user', 'billingAddress', 'shippingAddress'])
            ->orderByDesc('created_at')
            ->limit(15)
            ->get();

        return response()->json([
            'data' => DashboardOrderResource::collection($orders),
        ]);
    }

    /**
     * Get recent activity feed.
     *
     * @return JsonResponse
     */
    public function activity(): JsonResponse
    {
        $activities = collect();

        // Recent orders
        $recentOrders = Order::with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                $customerName = $order->user
                    ? ($order->user->full_name ?? $order->user->email ?? 'Guest')
                    : 'Guest';
                
                return [
                    'type' => 'order',
                    'title' => 'New Order',
                    'description' => "Order #{$order->order_number} placed by {$customerName}",
                    'amount' => $order->grand_total,
                    'currency' => $order->currency,
                    'timestamp' => $order->created_at,
                    'metadata' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'status' => $order->status,
                    ],
                ];
            });

        $activities = $activities->merge($recentOrders);

        // Recent inventory adjustments
        $recentAdjustments = InventoryAdjustment::with('warehouse')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($adjustment) {
                $warehouseName = $adjustment->warehouse
                    ? $adjustment->warehouse->name
                    : 'Unknown Warehouse';
                
                return [
                    'type' => 'inventory_adjustment',
                    'title' => 'Inventory Adjustment',
                    'description' => "Stock adjusted in {$warehouseName}",
                    'amount' => null,
                    'currency' => null,
                    'timestamp' => $adjustment->created_at,
                    'metadata' => [
                        'adjustment_id' => $adjustment->id,
                        'warehouse_id' => $adjustment->warehouse_id,
                        'reason_code' => $adjustment->reason_code,
                        'note' => $adjustment->note,
                    ],
                ];
            });

        $activities = $activities->merge($recentAdjustments);

        // Recent transfers
        $recentTransfers = Transfer::with(['fromWarehouse', 'toWarehouse'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($transfer) {
                $fromWarehouse = $transfer->fromWarehouse
                    ? $transfer->fromWarehouse->name
                    : 'Unknown';
                $toWarehouse = $transfer->toWarehouse
                    ? $transfer->toWarehouse->name
                    : 'Unknown';
                
                return [
                    'type' => 'transfer',
                    'title' => 'Stock Transfer',
                    'description' => "Transfer from {$fromWarehouse} to {$toWarehouse}",
                    'amount' => null,
                    'currency' => null,
                    'timestamp' => $transfer->created_at,
                    'metadata' => [
                        'transfer_id' => $transfer->id,
                        'status' => $transfer->status,
                    ],
                ];
            });

        $activities = $activities->merge($recentTransfers);

        // Recent product creations
        $recentProducts = Product::orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'type' => 'product',
                    'title' => 'Product Created',
                    'description' => "Product '{$product->name}' was created",
                    'amount' => null,
                    'currency' => null,
                    'timestamp' => $product->created_at,
                    'metadata' => [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                    ],
                ];
            });

        $activities = $activities->merge($recentProducts);

        // Sort by timestamp and limit to 20 most recent
        $activities = $activities->sortByDesc('timestamp')->take(20)->values();

        return response()->json([
            'data' => DashboardActivityResource::collection($activities),
        ]);
    }

    /**
     * Fill in missing dates in chart data with zero values.
     *
     * @param \Illuminate\Support\Collection $data
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @param string $valueKey
     * @return \Illuminate\Support\Collection
     */
    private function fillMissingDates($data, Carbon $startDate, Carbon $endDate, string $valueKey = 'revenue'): \Illuminate\Support\Collection
    {
        $dateMap = $data->keyBy('date');
        $filled = collect();
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');
            if ($dateMap->has($dateStr)) {
                $filled->push($dateMap->get($dateStr));
            } else {
                $filled->push([
                    'date' => $dateStr,
                    $valueKey => $valueKey === 'revenue' ? 0.0 : 0,
                ]);
            }
            $current->addDay();
        }

        return $filled;
    }
}

