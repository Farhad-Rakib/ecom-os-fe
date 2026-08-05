export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardData {
  stats: StatCard[];
  chartData: {
    revenue: ChartData[];
    users: ChartData[];
    orders: ChartData[];
  };
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
}
