import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, DollarSign, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Eye, RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../../../core/api/services/dashboard.api';
import { Loader } from '../../../components/ui/Loader/Loader';

const channelData = [
  { name: 'Direct', value: 35, color: '#3b82f6' },
  { name: 'Organic', value: 30, color: '#10b981' },
  { name: 'Social', value: 20, color: '#f59e0b' },
  { name: 'Referral', value: 15, color: '#ef4444' },
];

const weeklyData = [
  { day: 'Mon', sales: 340, orders: 45 },
  { day: 'Tue', sales: 280, orders: 38 },
  { day: 'Wed', sales: 520, orders: 67 },
  { day: 'Thu', sales: 410, orders: 52 },
  { day: 'Fri', sales: 680, orders: 84 },
  { day: 'Sat', sales: 390, orders: 41 },
  { day: 'Sun', sales: 250, orders: 29 },
];

const defaultRevenueData = [
  { name: 'Jan', value: 12000 },
  { name: 'Feb', value: 19000 },
  { name: 'Mar', value: 15000 },
  { name: 'Apr', value: 22000 },
  { name: 'May', value: 28000 },
  { name: 'Jun', value: 24000 },
  { name: 'Jul', value: 32000 },
  { name: 'Aug', value: 29000 },
  { name: 'Sep', value: 35000 },
  { name: 'Oct', value: 31000 },
  { name: 'Nov', value: 38000 },
  { name: 'Dec', value: 42000 },
];

const recentOrders = [
  { id: '#ORD-7812', customer: 'Sarah Johnson', product: 'Wireless Headphones', amount: '$259.00', status: 'completed', avatar: 'SJ' },
  { id: '#ORD-7811', customer: 'Michael Chen', product: 'Smart Watch Pro', amount: '$499.00', status: 'pending', avatar: 'MC' },
  { id: '#ORD-7810', customer: 'Emma Wilson', product: 'Laptop Stand', amount: '$79.99', status: 'completed', avatar: 'EW' },
  { id: '#ORD-7809', customer: 'David Brown', product: 'USB-C Hub', amount: '$49.99', status: 'processing', avatar: 'DB' },
  { id: '#ORD-7808', customer: 'Lisa Anderson', product: 'Keyboard MX', amount: '$169.00', status: 'completed', avatar: 'LA' },
];

const defaultActivity = [
  { id: '1', user: 'John Admin', action: 'created a new user account', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'success' as const },
  { id: '2', user: 'System', action: 'completed daily backup', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'info' as const },
  { id: '3', user: 'Jane Manager', action: 'updated role permissions', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'warning' as const },
  { id: '4', user: 'System', action: 'detected unusual login attempt', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'error' as const },
  { id: '5', user: 'Mike User', action: 'exported report data', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), type: 'info' as const },
];

const statusBadge: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export const DashboardPage: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboardData(),
    retry: false,
  });

  const revenueData = data?.chartData?.revenue || defaultRevenueData;
  const activityData = data?.recentActivity || defaultActivity;

  const stats = [
    { title: 'Total Users', value: '2,543', change: 12.5, type: 'increase' as const, icon: Users, color: 'text-blue-600', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Revenue', value: '$45,231', change: 8.2, type: 'increase' as const, icon: DollarSign, color: 'text-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Orders', value: '1,234', change: 3.1, type: 'decrease' as const, icon: ShoppingCart, color: 'text-amber-600', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Conversion', value: '3.24%', change: 2.4, type: 'increase' as const, icon: TrendingUp, color: 'text-rose-600', lightBg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  if (isLoading) return <Loader text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Welcome back! Here is your business overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.type === 'increase';
          return (
            <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 ${stat.lightBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Monthly revenue performance</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.08} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Sales</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sales performance this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.08} />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
              <Eye className="w-3 h-3" /> View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Product</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {order.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.customer}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{order.product}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{order.product}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900 dark:text-white">{order.amount}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${statusBadge[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {channelData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(value) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 mt-4">
            {channelData.map((ch) => (
              <div key={ch.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ch.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${ch.value}%`, backgroundColor: ch.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{ch.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="relative">
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-5">
            {activityData.map((activity) => {
              const typeColors: Record<string, string> = {
                success: 'bg-emerald-500',
                error: 'bg-red-500',
                warning: 'bg-amber-500',
                info: 'bg-blue-500',
              };
              return (
                <div key={activity.id} className="flex items-start gap-4 relative">
                  <div className={`w-[9px] h-[9px] mt-1.5 rounded-full ${typeColors[activity.type]} ring-4 ring-white dark:ring-gray-800 z-10`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
