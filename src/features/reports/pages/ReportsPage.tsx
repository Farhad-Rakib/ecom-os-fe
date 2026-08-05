import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, Users, ShoppingCart, Filter, FileText } from 'lucide-react';
import { Autocomplete, AutocompleteOption } from '../../../components/ui/Autocomplete/Autocomplete';

const monthlyRevenue = [
  { month: 'Jan', revenue: 42000, expenses: 28000, profit: 14000 },
  { month: 'Feb', revenue: 38000, expenses: 25000, profit: 13000 },
  { month: 'Mar', revenue: 51000, expenses: 30000, profit: 21000 },
  { month: 'Apr', revenue: 47000, expenses: 27000, profit: 20000 },
  { month: 'May', revenue: 55000, expenses: 32000, profit: 23000 },
  { month: 'Jun', revenue: 59000, expenses: 31000, profit: 28000 },
  { month: 'Jul', revenue: 63000, expenses: 33000, profit: 30000 },
  { month: 'Aug', revenue: 58000, expenses: 29000, profit: 29000 },
  { month: 'Sep', revenue: 61000, expenses: 34000, profit: 27000 },
  { month: 'Oct', revenue: 67000, expenses: 36000, profit: 31000 },
  { month: 'Nov', revenue: 72000, expenses: 38000, profit: 34000 },
  { month: 'Dec', revenue: 78000, expenses: 40000, profit: 38000 },
];

const categoryData = [
  { name: 'Electronics', value: 35, color: '#3b82f6' },
  { name: 'Clothing', value: 25, color: '#10b981' },
  { name: 'Food & Drink', value: 20, color: '#f59e0b' },
  { name: 'Home & Garden', value: 12, color: '#ef4444' },
  { name: 'Other', value: 8, color: '#6b7280' },
];

const weeklyTraffic = [
  { day: 'Mon', visitors: 1200, pageViews: 3400 },
  { day: 'Tue', visitors: 1400, pageViews: 3900 },
  { day: 'Wed', visitors: 1800, pageViews: 4800 },
  { day: 'Thu', visitors: 1600, pageViews: 4200 },
  { day: 'Fri', visitors: 2100, pageViews: 5600 },
  { day: 'Sat', visitors: 900, pageViews: 2100 },
  { day: 'Sun', visitors: 700, pageViews: 1600 },
];

const topProducts = [
  { name: 'Wireless Headphones', sales: 1234, revenue: '$61,700', growth: '+12.5%' },
  { name: 'Smart Watch Pro', sales: 987, revenue: '$49,350', growth: '+8.3%' },
  { name: 'Laptop Stand', sales: 876, revenue: '$26,280', growth: '+15.1%' },
  { name: 'USB-C Hub', sales: 654, revenue: '$19,620', growth: '-2.4%' },
  { name: 'Mechanical Keyboard', sales: 543, revenue: '$43,440', growth: '+6.7%' },
];

const summaryCards = [
  { label: 'Total Revenue', value: '$691,000', change: '+14.2%', icon: DollarSign, color: 'bg-blue-500' },
  { label: 'Total Orders', value: '8,456', change: '+9.1%', icon: ShoppingCart, color: 'bg-emerald-500' },
  { label: 'New Customers', value: '2,341', change: '+22.5%', icon: Users, color: 'bg-amber-500' },
  { label: 'Growth Rate', value: '14.2%', change: '+3.8%', icon: TrendingUp, color: 'bg-rose-500' },
];

const reportTypeOptions: AutocompleteOption[] = [
  { label: 'Sales Report', value: 'sales' },
  { label: 'Revenue Report', value: 'revenue' },
  { label: 'Expense Report', value: 'expenses' },
  { label: 'Profit & Loss', value: 'pnl' },
  { label: 'Traffic Report', value: 'traffic' },
  { label: 'Customer Report', value: 'customers' },
  { label: 'Product Performance', value: 'products' },
  { label: 'Inventory Report', value: 'inventory' },
];

const categoryOptions: AutocompleteOption[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Food & Drink', value: 'food' },
  { label: 'Home & Garden', value: 'home' },
  { label: 'Sports & Outdoors', value: 'sports' },
  { label: 'Books & Media', value: 'books' },
  { label: 'Health & Beauty', value: 'health' },
];

const regionOptions: AutocompleteOption[] = [
  { label: 'All Regions', value: 'all' },
  { label: 'North America', value: 'na' },
  { label: 'Europe', value: 'eu' },
  { label: 'Asia Pacific', value: 'apac' },
  { label: 'Latin America', value: 'latam' },
  { label: 'Middle East & Africa', value: 'mea' },
];

const statusOptions: AutocompleteOption[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
];

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const hasActiveFilters = useMemo(
    () => dateFrom || dateTo || reportType || category || region || status,
    [dateFrom, dateTo, reportType, category, region, status]
  );

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setReportType('');
    setCategory('');
    setRegion('');
    setStatus('');
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Analytics and business intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Search & Filter</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Report Type */}
            <Autocomplete
              options={reportTypeOptions}
              value={reportType}
              onChange={setReportType}
              placeholder="Select report type..."
              label="Report Type"
            />

            {/* Category */}
            <Autocomplete
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select category..."
              label="Category"
            />

            {/* Region */}
            <Autocomplete
              options={regionOptions}
              value={region}
              onChange={setRegion}
              placeholder="Select region..."
              label="Region"
            />

            {/* Status */}
            <Autocomplete
              options={statusOptions}
              value={status}
              onChange={setStatus}
              placeholder="Select status..."
              label="Status"
            />
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          return (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue & Expenses</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" /> {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : '2024'}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyRevenue} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(value) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Weekly Traffic</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyTraffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Visitors" />
              <Area type="monotone" dataKey="pageViews" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Page Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sales</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {topProducts.map((product) => (
                  <tr key={product.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 text-gray-900 dark:text-white font-medium">{product.name}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">{product.sales.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-900 dark:text-white font-medium">{product.revenue}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-semibold ${product.growth.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {product.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profit Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
            <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Profit" />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
