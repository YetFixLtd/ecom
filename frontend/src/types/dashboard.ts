export interface ChartDataPoint {
  date: string;
  revenue?: number;
  count?: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
}

export interface TopProduct {
  id: number;
  name: string;
  revenue: number;
  units_sold: number;
}

export interface DashboardStats {
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    all_time: number;
  };
  orders: {
    today: number;
    this_week: number;
    this_month: number;
    all_time: number;
  };
  products: {
    total: number;
  };
  customers: {
    total: number;
  };
  average_order_value: number;
  charts: {
    revenue: ChartDataPoint[];
    orders: ChartDataPoint[];
    order_status: OrderStatusData[];
  };
  top_products: TopProduct[];
}

export interface RecentOrder {
  id: number;
  order_number: string;
  status: string;
  currency: string;
  grand_total: number;
  user?: {
    id: number;
    email: string;
    full_name: string;
  };
  created_at: string;
  placed_at?: string;
}

export interface ActivityItem {
  type: "order" | "inventory_adjustment" | "transfer" | "product";
  title: string;
  description: string;
  amount: number | null;
  currency: string | null;
  timestamp: string;
  metadata: Record<string, any>;
}

