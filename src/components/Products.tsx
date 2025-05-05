import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Download,
  Upload,
  Eye,
  X,
  AlertCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  Heart,
  ShoppingBag,
  Image as ImageIcon} from 'lucide-react';
import { Product, ProductFormData, Shop } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { formatDate } from '../utils/date';

// Sample data

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [] = useState<keyof Product>('created_at');
  const [] = useState<'asc' | 'desc'>('desc');
  const [filterGender, setFilterGender] = useState<'all' | 'F' | 'M'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const initialFormData: ProductFormData = {
    shop_id: '',
    product_name: '',
    gender: 'F',
    category: '',
    images: [],
    price: 0,
    stock: 0,
    size_chart: '',
    size_measurements: {}
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Update refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch shops from database
  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('shop_name', { ascending: true });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShops();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shops:shop_id (
            shop_name
          )
        `);

      if (error) throw error;

      // Transform the data to match our Product interface
      const transformedData = data?.map(product => ({
        ...product,
        shop_name: product.shops?.shop_name || 'Unknown Shop',
        gender: product.gender || 'F'  // Default to 'F' if not specified
      })) || [];

      setProducts(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || product.gender === filterGender;
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesGender && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Handle product deletion
  const handleDelete = (id: number) => {
    const productToDelete = products.find(p => p.product_id === id);
    if (productToDelete) {
      setSelectedProduct(productToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      setProducts(products.filter(product => product.product_id !== selectedProduct.product_id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  // Handle viewing product details
  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Handle editing product
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      shop_id: product.shop_id?.toString() || '',
      product_name: product.name,
      gender: product.gender,
      category: product.category,
      images: product.images,
      price: product.price,
      stock: product.stock,
      size_chart: product.size_chart,
      size_measurements: product.size_measurements
    });
    setShowAddModal(true);
  };

  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64String]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle import
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedProducts: Product[] = [];

        if (file.name.endsWith('.csv')) {
          importedProducts = parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          importedProducts = JSON.parse(content);
        }

        if (Array.isArray(importedProducts) && importedProducts.length > 0) {
          setProducts(prev => [...prev, ...importedProducts]);
          setImportStatus('success');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Import error:', error);
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const data = format === 'csv' ? convertToCSV(products) : JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Convert to CSV
  const convertToCSV = (data: Product[]) => {
    const headers = [
      'product_id',
      'shop_id',
      'shop_name',
      'product_name',
      'gender',
      'category',
      'price',
      'stock',
      'likes',
      'orders_count',
      'created_at',
      'updated_at'
    ];

    const rows = data.map(product => headers.map(header => {
      const value = product[header as keyof Product];
      return typeof value === 'string' ? `"${value}"` : value;
    }));

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Parse CSV data
  const parseCSV = (content: string): Product[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '')) as Array<keyof Product>;
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const product: Partial<Product> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch(header) {
          case 'product_id':
          case 'shop_id':
          case 'stock':
          case 'likes':
          case 'orders_count':
          case 'wish':
          case 'wear':
            (product as any)[header] = parseInt(value);
            break;
          case 'price':
            (product as any)[header] = parseFloat(value);
            break;
          case 'images':
            product[header] = value.split(';');
            break;
          case 'size_measurements':
            try {
              product[header] = JSON.parse(value);
            } catch {
              product[header] = {};
            }
            break;
          case 'gender':
            product[header] = (value === 'M' || value === 'F')
              ? value
              : 'F';
            break;
          default:
            product[header] = value;
        }
      });

      return {
        ...product,
        product_id: product.product_id || Math.floor(Math.random() * 10000),
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        images: product.images || [],
        likes: product.likes || 0,
        orders_count: product.orders_count || 0,
        wish: product.wish || 0,
        wear: product.wear || 0,
        size_measurements: product.size_measurements || {},
        gender: product.gender || 'F'
      } as Product;
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();

    const selectedShopName = shops.find(shop => shop.shop_id === formData.shop_id)?.shop_name || "Unknown Shop";

    const newProduct: Product = {
      product_id: selectedProduct ? selectedProduct.product_id : Math.floor(Math.random() * 10000),
      shop_id: formData.shop_id,
      shop_name: selectedShopName,
      name: formData.product_name,
      gender: formData.gender,
      category: formData.category,
      images: formData.images,
      price: formData.price,
      stock: formData.stock,
      likes: selectedProduct?.likes || 0,
      orders_count: selectedProduct?.orders_count || 0,
      size_chart: formData.size_chart,
      size_measurements: formData.size_measurements,
      created_at: selectedProduct ? selectedProduct.created_at : timestamp,
      updated_at: timestamp,
      wish: selectedProduct?.wish || 0,
      wear: selectedProduct?.wear || 0
    };

    if (selectedProduct) {
      setProducts(products.map(p => p.product_id === selectedProduct.product_id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }

    setShowAddModal(false);
    setFormData(initialFormData);
    setSelectedProduct(null);
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Upload size={20} />
            Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Gender Filter */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setShowGenderFilter(!showGenderFilter)}
            >
              <span>{filterGender === 'all' ? 'All Genders' : filterGender === 'F' ? 'Female' : 'Male'}</span>
              <ChevronDown size={20} />
            </button>
            {showGenderFilter && (
              <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {['all', 'F', 'M'].map((gender) => (
                  <button
                    key={gender}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      filterGender === gender ? 'text-purple-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setFilterGender(gender as typeof filterGender);
                      setShowGenderFilter(false);
                    }}
                  >
                    {gender === 'all' ? 'All Genders' : gender === 'F' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            >
              <span>{filterCategory === 'all' ? 'All Categories' : filterCategory}</span>
              <ChevronDown size={20} />
            </button>
            {showCategoryFilter && (
              <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    filterCategory === 'all' ? 'text-purple-600' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    setFilterCategory('all');
                    setShowCategoryFilter(false);
                  }}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      filterCategory === category ? 'text-purple-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setFilterCategory(category);
                      setShowCategoryFilter(false);
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.product_id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="relative aspect-square">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <div className="bg-white p-2 rounded-full shadow flex items-center gap-1">
                  <Heart size={16} className="text-red-500" />
                  <span className="text-sm">{product.likes}</span>
                </div>
                <div className="bg-white p-2 rounded-full shadow flex items-center gap-1">
                  <ShoppingBag size={16} className="text-green-500" />
                  <span className="text-sm">{product.orders_count}</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.shop_name}</p>
                </div>
                <span className="text-lg font-semibold text-purple-600">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{product.category}</span>
                <span>{product.gender === 'F' ? 'Female' : 'Male'}</span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(product)}
                    className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.product_id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(initialFormData);
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                  <select
                    required
                    value={formData.shop_id}
                    onChange={(e) => setFormData({...formData, shop_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a shop</option>
                    {shops.map((shop) => (
                      <option key={shop.shop_id} value={shop.shop_id}>
                        {shop.shop_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'F' | 'M'})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== index)
                            });
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500"
                    >
                      <ImageIcon size={24} />
                      <span className="text-sm mt-1">Add Image</span>
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size Chart</label>
                  <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg transition-colors relative">
                    {formData.size_chart ? (
                      <>
                        <img
                          src={formData.size_chart}
                          alt="Size Chart"
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, size_chart: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <label
                        htmlFor="size-chart-upload"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50"
                      >
                        <ImageIcon size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload size chart</span>
                      </label>
                    )}
                    <input
                      type="file"
                      id="size-chart-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({
                              ...formData,
                              size_chart: reader.result as string
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size Measurements</label>
                  <div className="space-y-4">
                    {formData.size_measurements && Object.entries(formData.size_measurements).map(([size, measurements]) => (
                      <div key={size} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={size}
                            onChange={(e) => {
                              const newMeasurements = { ...formData.size_measurements };
                              if (newMeasurements) {
                                delete newMeasurements[size];
                                newMeasurements[e.target.value] = measurements;
                                setFormData({
                                  ...formData,
                                  size_measurements: newMeasurements
                                });
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            placeholder="Size (e.g., S, M, L or 30, 32, 34)"
                          />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          {measurements && Object.entries(measurements).map(([key, value]) => (
                            <div key={key}>
                              <input
                                type="text"
                                value={key}
                                onChange={(e) => {
                                  if (measurements) {
                                    const newMeasurements = { ...measurements };
                                    delete newMeasurements[key];
                                    newMeasurements[e.target.value] = value;
                                    setFormData({
                                      ...formData,
                                      size_measurements: {
                                        ...formData.size_measurements,
                                        [size]: newMeasurements
                                      }
                                    });
                                  }
                                }}
                                className="w-full px-4 py-2 mb-2 border border-gray-200 rounded-lg"
                                placeholder="Measurement name"
                              />
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    size_measurements: {
                                      ...formData.size_measurements,
                                      [size]: {
                                        ...measurements,
                                        [key]: parseFloat(e.target.value)
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                placeholder="Value"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMeasurements = { ...formData.size_measurements };
                            if (newMeasurements) {
                              delete newMeasurements[size];
                              setFormData({
                                ...formData,
                                size_measurements: newMeasurements
                              });
                            }
                          }}
                          className="p-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          size_measurements: {
                            ...formData.size_measurements,
                            'New Size': { measurement: 0 }
                          }
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-purple-500 hover:border-purple-500"
                    >
                      Add Size
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(initialFormData);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {selectedProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Images */}
              <div className="grid grid-cols-4 gap-4">
                {selectedProduct.images.length > 1 ? (
                  // Multiple images display
                  selectedProduct.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))
                ) : (
                  // Single image display in grid cell size
                  <div className="aspect-square">
                    {selectedProduct.images.length === 1 ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      // No image placeholder
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-gray-500">{selectedProduct.shop_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-purple-600">{formatCurrency(selectedProduct.price)}</p>
                  <p className={`text-sm ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Product Details</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Category:</span> {selectedProduct.category}</p>
                    <p><span className="text-gray-500">Gender:</span> {selectedProduct.gender === 'F' ? 'Female' : 'Male'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Statistics</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Likes:</span> {selectedProduct.likes}</p>
                    <p><span className="text-gray-500">Orders:</span> {selectedProduct.orders_count}</p>
                    <p><span className="text-gray-500">Wish:</span> {selectedProduct.wish}</p>
                    <p><span className="text-gray-500">Wear:</span> {selectedProduct.wear}</p>
                  </div>
                </div>
              </div>

              {/* Size Measurements */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Size Measurements</h4>
                {/* Add Size Chart Image */}
                {selectedProduct?.size_chart && (
                  <div className="mb-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={selectedProduct.size_chart}
                        alt="Size Chart"
                        className="w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'placeholder-image-url'; // You can add a placeholder image URL here
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {selectedProduct?.size_measurements && Object.entries(selectedProduct.size_measurements).map(([size, measurements]) => (
                    <div key={size} className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium mb-2">Size {size}</h5>
                      <div className="space-y-1">
                        {measurements && Object.entries(measurements).map(([key, value]) => (
                          <p key={key} className="text-sm">
                            <span className="text-gray-500">{key}:</span> {value}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <p>Created: {formatDate(selectedProduct.created_at)}</p>
                  <p>Last Updated: {formatDate(selectedProduct.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Delete Product</h2>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Products</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 mb-6">
              <div className="flex flex-col items-center text-center">
                <FileText size={48} className="text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV or JSON file containing product data
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Choose File
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">File requirements:</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                  <li>CSV or JSON format</li>
                  <li>Required columns: product_name, category, gender, price, stock</li>
                  <li>Optional: images, size_measurements, size_chart</li>
                </ul>
              </div>

              {importStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                  <CheckCircle size={20} />
                  <span className="text-sm">Import successful!</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle size={20} />
                  <span className="text-sm">Import failed. Please check the file format.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Export Products</h2>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">Export Format</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <FileText size={20} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    exportFormat === 'json'
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <FileText size={20} />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">This will export all product data including:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Basic information (name, category, gender)</li>
                <li>Price and stock details</li>
                <li>Size measurements and charts</li>
                <li>Statistics (likes, orders, etc.)</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleExport(exportFormat);
                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Download size={20} />
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        accept=".csv,.json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={imageInputRef}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default Products; 