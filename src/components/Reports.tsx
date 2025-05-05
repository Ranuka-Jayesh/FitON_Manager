import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  PieChart,
  DollarSign,
  Users,
  Store,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Download,
  Lock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportMetrics {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  buyerCount: number;
  buyerEngagement: number;
  sellerCount: number;
  sellerEngagement: number;
  topCategories: { name: string; value: number }[];
  percentageChange: {
    sales: number;
    buyers: number;
    sellers: number;
  };
  salesTrend: {
    name: string;
    sales: number;
    orders: number;
  }[];
}

// Helper function to get month name
const getMonthName = (month: number) => {
  return new Date(2024, month).toLocaleString('default', { month: 'long' });
};

// Generate monthly data for the entire year

type TimeRange = 'daily' | 'monthly' | 'yearly';
type MonthFilter = number | 'all'; // 0-11 for months, 'all' for entire year

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // State for metrics
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    buyerCount: 0,
    buyerEngagement: 0,
    sellerCount: 0,
    sellerEngagement: 0,
    topCategories: [],
    percentageChange: {
      sales: 0,
      buyers: 0,
      sellers: 0
    },
    salesTrend: []
  });

  // Add this to your existing state
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number }[]>([]);

  // Fetch total sales and order metrics
  useEffect(() => {
    const fetchSalesMetrics = async () => {
      try {
        // Get total sales and order count
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total_price');

        if (ordersError) throw ordersError;

        const totalSales = ordersData.reduce((sum, order) => sum + (order.total_price || 0), 0);
        const orderCount = ordersData.length;
        const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          totalSales,
          orderCount,
          averageOrderValue
        }));

      } catch (error) {
        console.error('Error fetching sales metrics:', error);
      }
    };

    fetchSalesMetrics();
  }, [timeRange, selectedMonth]);

  // Fetch buyer engagement metrics
  useEffect(() => {
    const fetchBuyerMetrics = async () => {
      try {
        // Get total orders count
        const { count: totalOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        // Get total buyers count
        const { count: totalBuyers, error: buyersError } = await supabase
          .from('buyers')
          .select('buyer_id', { count: 'exact', head: true });

        if (ordersError || buyersError) {
          console.error('Error fetching counts:', ordersError || buyersError);
          return;
        }

        // Calculate engagement as orders - buyers
        const buyerEngagement = (totalOrders || 0) - (totalBuyers || 0);
        
        // Calculate percentage change
        const percentageChange = totalBuyers ? (buyerEngagement / totalBuyers) * 100 : 0;

        setMetrics(prev => ({
          ...prev,
          buyerCount: totalBuyers || 0,
          buyerEngagement: buyerEngagement,
          percentageChange: {
            ...prev.percentageChange,
            buyers: Number(percentageChange.toFixed(1))
          }
        }));

      } catch (error) {
        console.error('Error fetching buyer metrics:', error);
      }
    };

    fetchBuyerMetrics();
  }, [timeRange, selectedMonth]);

  // Fetch seller engagement metrics
  useEffect(() => {
    const fetchSellerMetrics = async () => {
      try {
        // Get unique sellers who have orders
        const { data: orderSellers, error: orderSellersError } = await supabase
          .from('orders')
          .select('shop_id');

        // Get total sellers count
        const { count: totalSellers, error: sellersError } = await supabase
          .from('shops')
          .select('shop_id', { count: 'exact', head: true });

        if (orderSellersError || sellersError) throw orderSellersError || sellersError;

        // Calculate unique sellers who have orders
        const uniqueSellersWithOrders = new Set(orderSellers.map(order => order.shop_id)).size;
        
        // Calculate engagement rate
        const sellerEngagement = totalSellers ? (uniqueSellersWithOrders / totalSellers) * 100 : 0;

        setMetrics(prev => ({
          ...prev,
          sellerCount: totalSellers || 0,
          sellerEngagement: Math.round(sellerEngagement)
        }));

      } catch (error) {
        console.error('Error fetching seller metrics:', error);
      }
    };

    fetchSellerMetrics();
  }, [timeRange, selectedMonth]);

  // Fetch sales trend data
  useEffect(() => {
    const fetchSalesTrend = async () => {
      try {
        let query = supabase
          .from('orders')
          .select('created_at, total_price')
          .order('created_at', { ascending: true });

        // Apply time range filter
        const now = new Date();
        let startDate = new Date();

      switch (timeRange) {
        case 'daily':
            startDate.setDate(now.getDate() - 24); // Last 24 hours
            break;
        case 'monthly':
            startDate.setMonth(now.getMonth() - 1); // Last month
            break;
        case 'yearly':
            startDate.setFullYear(now.getFullYear() - 1); // Last year
            break;
        }

        query = query.gte('created_at', startDate.toISOString());

        const { data: salesData, error: salesError } = await query;

        if (salesError) throw salesError;

        // Process sales data into trend format
        const salesByPeriod: Record<string, { sales: number; orders: number }> = {};

        salesData.forEach(order => {
          const date = new Date(order.created_at);
          let key;

          switch (timeRange) {
            case 'daily':
              key = `${date.getHours()}:00`;
              break;
            case 'monthly':
              key = date.toLocaleDateString();
              break;
            case 'yearly':
              key = getMonthName(date.getMonth());
              break;
          }

          if (!salesByPeriod[key]) {
            salesByPeriod[key] = { sales: 0, orders: 0 };
          }
          salesByPeriod[key].sales += order.total_price || 0;
          salesByPeriod[key].orders += 1;
        });

        const salesTrend = Object.entries(salesByPeriod).map(([name, data]) => ({
          name,
          ...data
        }));

        setMetrics(prev => ({
          ...prev,
          salesTrend
        }));

      } catch (error) {
        console.error('Error fetching sales trend:', error);
      }
    };

    fetchSalesTrend();
  }, [timeRange, selectedMonth]);

  // Update the category distribution useEffect
  useEffect(() => {
    const fetchCategoryDistribution = async () => {
      try {
        // Fetch all products with their categories and stock
        const { data: products, error } = await supabase
          .from('products')
          .select('category, stock');

        if (error) throw error;

        // Sum stock by category
        const categoryStocks: Record<string, number> = {};
        let totalStock = 0;

        products.forEach((product) => {
          if (product.category && product.stock) {
            categoryStocks[product.category] = (categoryStocks[product.category] || 0) + product.stock;
            totalStock += product.stock;
          }
        });

        // Calculate percentages based on stock quantities
        const distribution = Object.entries(categoryStocks)
          .map(([category, stockCount]) => ({
            name: category,
            value: Math.round((stockCount / totalStock) * 100),
            stockCount: stockCount // Keep the actual stock count for display
          }))
          .sort((a, b) => b.value - a.value); // Sort by percentage in descending order

        setCategoryDistribution(distribution);

      } catch (error) {
        console.error('Error fetching category distribution:', error);
      }
    };

    fetchCategoryDistribution();
  }, [timeRange]);

  // Update the metrics state to use categoryDistribution
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      topCategories: categoryDistribution
    }));
  }, [categoryDistribution]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPercentageChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPercentageChangeIcon = (value: number) => {
    return value > 0 ? <ArrowUp size={16} /> : value < 0 ? <ArrowDown size={16} /> : <ArrowRight size={16} />;
  };

  const handleExportPDF = async () => {
    setShowPasswordModal(true);
  };

  const generatePDF = async () => {
    try {
      // First verify the password against admin table
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('admin_id')
        .eq('password', password)
        .single();

      if (adminError || !adminData) {
        setExportError('Invalid admin password');
      return;
    }

    setIsExporting(true);
    setExportError('');
    setShowPasswordModal(false);

      const reportElement = document.getElementById('report-content');
      if (!reportElement) throw new Error('Report content not found');

      // Create high-quality canvas
      const canvas = await html2canvas(reportElement, {
        useCORS: true,
        logging: false,
        background: '#ffffff'
      });

      // Rest of the PDF generation code remains the same
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add header with title and branding
      pdf.setFillColor(147, 51, 234); // Purple header
      pdf.rect(0, 0, 210, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('Sales & Analytics Report', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Report ${selectedMonth !== 'all' ? `- ${getMonthName(selectedMonth as number)}` : ''}`, 105, 30, { align: 'center' });

      // Add report metadata
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      const timestamp = new Date().toLocaleString();
      pdf.text(`Generated: ${timestamp}`, 20, 50);

      // Add key metrics summary
      pdf.setFillColor(247, 248, 250);
      pdf.rect(0, 60, 210, 40, 'F');
      pdf.setFontSize(14);
      pdf.text('Key Metrics Summary', 20, 70);
      pdf.setFontSize(10);
      
      // Format metrics for PDF
      const metricsText = [
        `Total Sales: ${formatCurrency(metrics.totalSales)}`,
        `Total Orders: ${formatNumber(metrics.orderCount)}`,
        `Average Order Value: ${formatCurrency(metrics.averageOrderValue)}`,
        `Active Buyers: ${formatNumber(metrics.buyerCount)}`,
        `Active Sellers: ${formatNumber(metrics.sellerCount)}`,
        `Buyer Engagement: ${metrics.buyerEngagement}%`,
        `Seller Engagement: ${metrics.sellerEngagement}%`
      ];

      metricsText.forEach((text, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        pdf.text(text, 20 + (column * 90), 80 + (row * 5));
      });

      // Add charts section
      pdf.addPage();
      
      // Add sales trend chart
      pdf.setFontSize(14);
      pdf.text('Sales Trend Analysis', 20, 20);
      const chartWidth = 170;
      const chartHeight = 80;
      pdf.addImage(imgData, 'PNG', 20, 30, chartWidth, chartHeight);

      // Add category distribution
      pdf.text('Category Distribution', 20, 130);
      pdf.setFontSize(10);
      metrics.topCategories.forEach((category: any, index) => {
        const yPos = 140 + (index * 10);
        pdf.text(`${category.name}: ${category.value}% (${formatNumber(category.stockCount)} items)`, 20, yPos);
        
        // Draw progress bar
        pdf.setFillColor(233, 236, 239); // Light gray background
        pdf.rect(120, yPos - 3, 50, 3, 'F');
        pdf.setFillColor(147, 51, 234); // Purple fill
        pdf.rect(120, yPos - 3, (50 * category.value) / 100, 3, 'F');
      });

      // Add footer with page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: 'center' }
        );
        pdf.text(
          'Confidential - For Internal Use Only',
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 5,
          { align: 'center' }
        );
      }

      // Save the PDF with a formatted filename
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`sales_analytics_report_${timeRange}_${dateStr}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      setExportError('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setPassword('');
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTimeRange('daily');
              setSelectedMonth('all');
            }}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'daily'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => {
              setTimeRange('monthly');
              setSelectedMonth('all');
            }}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'yearly'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Yearly
          </button>
          {timeRange === 'yearly' && (
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                {selectedMonth === 'all' ? 'All Months' : getMonthName(selectedMonth as number)}
                <ChevronDown size={16} />
              </button>
              {showMonthDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      selectedMonth === 'all' ? 'text-purple-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedMonth('all');
                      setShowMonthDropdown(false);
                    }}
                  >
                    All Months
                  </button>
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                        selectedMonth === i ? 'text-purple-600' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedMonth(i);
                        setShowMonthDropdown(false);
                      }}
                    >
                      {getMonthName(i)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            disabled={isExporting}
          >
            <Download size={16} />
            {isExporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={24} className="text-purple-600" />
              <h3 className="text-lg font-medium">Enter Password to Export</h3>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
            />
            {exportError && (
              <p className="text-red-500 text-sm mt-2">{exportError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setExportError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div id="report-content">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Sales Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-medium">Total Sales</h3>
              </div>
              <div className={`flex items-center gap-1 ${getPercentageChangeColor(metrics.percentageChange.sales)}`}>
                {getPercentageChangeIcon(metrics.percentageChange.sales)}
                <span>{Math.abs(metrics.percentageChange.sales)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">{formatCurrency(metrics.totalSales)}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatNumber(metrics.orderCount)} Orders</span>
                <span>Avg. {formatCurrency(metrics.averageOrderValue)}</span>
              </div>
            </div>
          </div>

          {/* Buyer Engagement Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">Buyer Engagement</h3>
              </div>
              <div className={`flex items-center gap-1 ${getPercentageChangeColor(metrics.percentageChange.buyers)}`}>
                {getPercentageChangeIcon(metrics.percentageChange.buyers)}
                <span>{Math.abs(metrics.percentageChange.buyers)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">{formatNumber(metrics.buyerCount)} Buyers</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Orders vs Buyers: {metrics.buyerEngagement}</span>
              </div>
            </div>
          </div>

          {/* Seller Engagement Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Store size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Seller Engagement</h3>
              </div>
              <div className={`flex items-center gap-1 ${getPercentageChangeColor(metrics.percentageChange.sellers)}`}>
                {getPercentageChangeIcon(metrics.percentageChange.sellers)}
                <span>{Math.abs(metrics.percentageChange.sellers)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">{formatNumber(metrics.sellerCount)} Sellers</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{metrics.sellerEngagement}% Engagement Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Sales Trend</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <LineChartIcon size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics.salesTrend}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Category Distribution</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <PieChart size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="h-64">
              <div className="space-y-4">
                {metrics.topCategories.map((category: any, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <div className="text-sm text-gray-500">
                          <span>{category.value}%</span>
                          <span className="ml-2">({category.stockCount} items)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${category.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {metrics.topCategories.length === 0 && (
                  <div className="text-center text-gray-500">No categories found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 