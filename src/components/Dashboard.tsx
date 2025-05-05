import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, ChevronDown, Shirt, Tags } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';


const DashboardCard = ({ title, value, change, icon: Icon, color, period, onPeriodChange }: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
  period: string;
  onPeriodChange?: (period: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const periods = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:bg-gray-50 px-2 py-1 rounded-md"
          >
            <span>{period}</span>
            <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && onPeriodChange && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100">
              {periods.map((p) => (
                <button
                  key={p}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${period === p ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    onPeriodChange(p);
                    setIsOpen(false);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{value}</p>
          <span className={`flex items-center ${
            change.startsWith('+') ? 'text-green-500' : 'text-red-500'
          }`}>
            <TrendingUp size={16} className="mr-1" />
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};



const periodOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const Dashboard: React.FC = () => {
  const [chartPeriod, setChartPeriod] = useState('Monthly');
  const [, setBestSellersPeriod] = useState('Weekly');

  // Live counts from database
  const [totalBuyers, setTotalBuyers] = useState<number | null>(null);
  const [totalSellers, setTotalSellers] = useState<number | null>(null);
  const [activeProducts, setActiveProducts] = useState<number | null>(null);
  const [totalCollections, setTotalCollections] = useState<number | null>(null);

  // User Analysis chart data
  const [userAnalysisData, setUserAnalysisData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [userAnalysisPeriod, setUserAnalysisPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [topSellers, setTopSellers] = useState<any[]>([]);

  useEffect(() => {
    // Buyers count
    supabase
      .from('buyers')
      .select('buyer_id', { count: 'exact', head: true })
      .then(({ count }) => setTotalBuyers(count ?? 0));
    // Sellers count
    supabase
      .from('shops')
      .select('shop_id', { count: 'exact', head: true })
      .then(({ count }) => setTotalSellers(count ?? 0));
    // Active products (stock > 1)
    supabase
      .from('products')
      .select('product_id', { count: 'exact', head: true })
      .gt('stock', 1)
      .then(({ count }) => setActiveProducts(count ?? 0));
    // Total collections (all products)
    supabase
      .from('products')
      .select('product_id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCollections(count ?? 0));
  }, []);

  // Helper to get period key from date
  function getPeriodKey(date: string, period: string) {
    const d = new Date(date);
    if (period === 'yearly') return d.getFullYear().toString();
    if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (period === 'weekly') {
      // Get ISO week number
      const temp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = temp.getUTCDay() || 7;
      temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(temp.getUTCFullYear(),0,1));
      const weekNum = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return `${temp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }
    // daily
    return date.slice(0, 10);
  }

  // Fetch User Analysis chart data
  useEffect(() => {
    async function fetchUserAnalysis() {
      setLoadingChart(true);
      // Group by date for buyers
      const { data: buyersData, error: buyersError } = await supabase
        .from('buyers')
        .select('created_at')
        .order('created_at', { ascending: true });
      // Group by date for shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('created_at')
        .order('created_at', { ascending: true });
      if (buyersError || shopsError) {
        setUserAnalysisData([]);
        setLoadingChart(false);
        return;
      }
      // Aggregate counts by period
      const buyersByPeriod: Record<string, number> = {};
      buyersData?.forEach((row: any) => {
        const key = getPeriodKey(row.created_at, userAnalysisPeriod);
        if (key) buyersByPeriod[key] = (buyersByPeriod[key] || 0) + 1;
      });
      const shopsByPeriod: Record<string, number> = {};
      shopsData?.forEach((row: any) => {
        const key = getPeriodKey(row.created_at, userAnalysisPeriod);
        if (key) shopsByPeriod[key] = (shopsByPeriod[key] || 0) + 1;
      });
      // Get all unique periods
      const allPeriods = Array.from(new Set([
        ...Object.keys(buyersByPeriod),
        ...Object.keys(shopsByPeriod),
      ])).sort();
      // Build chart data (cumulative count)
      let cumulativeBuyers = 0;
      let cumulativeShops = 0;
      const chartData = allPeriods.map(period => {
        cumulativeBuyers += buyersByPeriod[period] || 0;
        cumulativeShops += shopsByPeriod[period] || 0;
        return {
          period,
          buyers: cumulativeBuyers,
          sellers: cumulativeShops,
        };
      });
      setUserAnalysisData(chartData);
      setLoadingChart(false);
    }
    fetchUserAnalysis();
  }, [userAnalysisPeriod]);

  // Fetch Best Sellers (top 3 shops by order count)
  useEffect(() => {
    async function fetchTopSellers() {
      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('shop_id');
      if (ordersError || !orders) {
        setTopSellers([]);
        return;
      }
      // Aggregate order counts per shop_id
      const orderCounts: Record<string, number> = {};
      orders.forEach((order: any) => {
        if (order.shop_id) {
          orderCounts[order.shop_id] = (orderCounts[order.shop_id] || 0) + 1;
        }
      });
      // Get top 3 shop_ids
      const topShopIds = Object.entries(orderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([shop_id]) => shop_id);
      if (topShopIds.length === 0) {
        setTopSellers([]);
        return;
      }
      // Fetch shop info for these shop_ids
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('shop_id, shop_name, profile_photo, nickname')
        .in('shop_id', topShopIds);
      if (shopsError || !shopsData) {
        setTopSellers([]);
        return;
      }
      // Merge order count and shop info
      const sellers = topShopIds.map((shopId: string) => {
        const shop = shopsData.find((s: any) => s.shop_id === shopId);
        const orderCount = orderCounts[shopId] || 0;
        return {
          shop_id: shopId,
          shop_name: shop?.shop_name || 'Unknown Shop',
          profile_photo: shop?.profile_photo || '',
          nickname: shop?.nickname || '',
          order_count: orderCount,
        };
      });
      setTopSellers(sellers);
    }
    fetchTopSellers();
  }, []);

  const handleChartPeriodChange = (newPeriod: string) => {
    setChartPeriod(newPeriod);
  };

  // For growth calculation, fallback to 0 if not enough data
  const buyerGrowth = userAnalysisData.length > 1
    ? (((userAnalysisData[userAnalysisData.length - 1].buyers - userAnalysisData[userAnalysisData.length - 2].buyers) /
        (userAnalysisData[userAnalysisData.length - 2].buyers || 1)) * 100).toFixed(1)
    : '0.0';
  const sellerGrowth = userAnalysisData.length > 1
    ? (((userAnalysisData[userAnalysisData.length - 1].sellers - userAnalysisData[userAnalysisData.length - 2].sellers) /
        (userAnalysisData[userAnalysisData.length - 2].sellers || 1)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard
          title="Total Buyers"
          value={totalBuyers !== null ? totalBuyers.toString() : '...'}
          change={buyerGrowth ? `+${buyerGrowth}%` : ''}
          icon={Users}
          color="bg-purple-500"
          period={chartPeriod}
          onPeriodChange={handleChartPeriodChange}
        />
        <DashboardCard
          title="Total Sellers"
          value={totalSellers !== null ? totalSellers.toString() : '...'}
          change={sellerGrowth ? `+${sellerGrowth}%` : ''}
          icon={Users}
          color="bg-blue-500"
          period={chartPeriod}
          onPeriodChange={handleChartPeriodChange}
        />
        <DashboardCard
          title="Active Products"
          value={activeProducts !== null ? activeProducts.toString() : '...'}
          change=""
          icon={Shirt}
          color="bg-green-500"
          period={chartPeriod}
          onPeriodChange={handleChartPeriodChange}
        />
        <DashboardCard
          title="Total Collections"
          value={totalCollections !== null ? totalCollections.toString() : '...'}
          change=""
          icon={Tags}
          color="bg-orange-500"
          period={chartPeriod}
          onPeriodChange={handleChartPeriodChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Analysis</h2>
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => setShowPeriodDropdown((v) => !v)}
              >
                <span>{periodOptions.find(p => p.value === userAnalysisPeriod)?.label}</span>
                <ChevronDown size={20} />
              </button>
              {showPeriodDropdown && (
                <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${userAnalysisPeriod === option.value ? 'text-purple-600' : 'text-gray-700'}`}
                      onClick={() => {
                        setUserAnalysisPeriod(option.value as any);
                        setShowPeriodDropdown(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userAnalysisData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotoneX" dataKey="buyers" name="Buyers" stroke="#9333EA" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 2, fill: '#9333EA' }} />
                <Line type="monotoneX" dataKey="sellers" name="Sellers" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 2, fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
            {loadingChart && <div className="text-center text-gray-500 mt-2">Loading chart...</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Best Sellers</h2>
            <div className="relative">
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded-md flex items-center space-x-2 hover:bg-gray-200"
                onClick={() => setBestSellersPeriod((p) => p)}
                disabled
              >
                <span>All Time</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {topSellers.length === 0 && <div className="text-gray-500 text-center">No sellers found.</div>}
            {topSellers.map((seller) => (
              <div key={seller.shop_id} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  {seller.profile_photo ? (
                    <img src={seller.profile_photo} alt={seller.shop_name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">?
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{seller.shop_name}</h4>
                    <p className="text-gray-500 text-sm">{seller.nickname}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{seller.order_count}</p>
                  <p className="text-sm text-gray-500">Orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;