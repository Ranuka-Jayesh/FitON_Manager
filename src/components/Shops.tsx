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
  Bell,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shop {
  shop_id: string;
  shop_name: string;
  nickname: string;
  phone_number: string;
  email: string;
  profile_photo: string | null;
  cover_photo: string | null;
  paypal_email: string;
  bank_account_number: string;
  bank_name: string;
  upi_id: string | null;
  cash_on_delivery: boolean;
  created_at: string;
  updated_at: string;
}

interface ShopFormData {
  shop_name: string;
  nickname: string;
  phone_number: string;
  email: string;
  password: string;
  profile_photo: string | null;
  cover_photo: string | null;
  paypal_email: string;
  bank_account_number: string;
  bank_name: string;
  upi_id: string | null;
  cash_on_delivery: boolean;
}

const Shops: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable'>('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  const initialFormData: ShopFormData = {
    shop_name: '',
    nickname: '',
    phone_number: '',
    email: '',
    password: '',
    profile_photo: null,
    cover_photo: null,
    paypal_email: '',
    bank_account_number: '',
    bank_name: '',
    upi_id: null,
    cash_on_delivery: false
  };

  const [formData, setFormData] = useState<ShopFormData>(initialFormData);

  // Fetch shops from database
  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [sortBy, sortOrder]);

  // Handle file upload to Supabase storage
  const handleFileUpload = async (file: File, type: 'profile' | 'cover'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentTimestamp = new Date().toISOString();

      if (isEditing && selectedShop) {
        // Update existing shop
        const { error } = await supabase
          .from('shops')
          .update({
            ...formData,
            updated_at: currentTimestamp
          })
          .eq('shop_id', selectedShop.shop_id);

        if (error) throw error;
      } else {
        // Create new shop
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        const { error: insertError } = await supabase
          .from('shops')
          .insert([{
            ...formData,
            shop_id: authData.user?.id,
            created_at: currentTimestamp,
            updated_at: currentTimestamp
          }]);

        if (insertError) throw insertError;
      }

      await fetchShops();
      setShowAddModal(false);
      setFormData(initialFormData);
      setIsEditing(false);
      setSelectedShop(null);
    } catch (error) {
      console.error('Error saving shop:', error);
    }
  };

  // Handle shop deletion
  const handleDelete = async () => {
    if (!selectedShop) return;

    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('shop_id', selectedShop.shop_id);

      if (error) throw error;

      await fetchShops();
      setShowDeleteModal(false);
      setSelectedShop(null);
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  // Handle file input change
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'profile') {
        setProfilePreview(base64String);
      } else {
        setCoverPreview(base64String);
      }
    };
    reader.readAsDataURL(file);

    const publicUrl = await handleFileUpload(file, type);
    if (publicUrl) {
      setFormData(prev => ({
        ...prev,
        [type === 'profile' ? 'profile_photo' : 'cover_photo']: publicUrl
      }));
    }
  };

  // Format date to local string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle viewing shop details
  const handleView = (shop: Shop) => {
    setSelectedShop(shop);
    setShowViewModal(true);
  };

  // Filter and sort shops
  const filteredShops = shops
    .filter(shop => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        shop.shop_name.toLowerCase().includes(searchLower) ||
        shop.nickname.toLowerCase().includes(searchLower) ||
        shop.email.toLowerCase().includes(searchLower) ||
        shop.phone_number.includes(searchTerm)
      );

      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'available' 
          ? shop.cash_on_delivery 
          : !shop.cash_on_delivery;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const aValue = a[sortBy as keyof Shop];
      const bValue = b[sortBy as keyof Shop];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setShowStatusFilter(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (shop: Shop) => {
    setIsEditing(true);
    setSelectedShop(shop);
    setProfilePreview(shop.profile_photo || '');
    setCoverPreview(shop.cover_photo || '');
    setFormData({
      shop_name: shop.shop_name,
      nickname: shop.nickname,
      phone_number: shop.phone_number,
      email: shop.email,
      password: '',
      profile_photo: shop.profile_photo,
      cover_photo: shop.cover_photo,
      paypal_email: shop.paypal_email,
      bank_account_number: shop.bank_account_number,
      bank_name: shop.bank_name,
      upi_id: shop.upi_id || null,
      cash_on_delivery: shop.cash_on_delivery
    });
    setShowAddModal(true);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = format === 'csv' 
      ? convertToCSV(shops)
      : JSON.stringify(shops, null, 2);
    
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shops.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const convertToCSV = (data: Shop[]) => {
    const headers = [
      'shop_id',
      'shop_name',
      'nickname',
      'phone_number',
      'email',
      'profile_photo',
      'cover_photo',
      'paypal_email',
      'bank_account_number',
      'bank_name',
      'cash_on_delivery',
      'created_at',
      'updated_at'
    ];
    
    const rows = data.map(shop => headers.map(header => {
      const value = shop[header as keyof Shop];
      return typeof value === 'string' ? `"${value}"` : value;
    }));
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedShops: Shop[] = [];

        if (file.name.endsWith('.csv')) {
          importedShops = parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          importedShops = JSON.parse(content);
        }

        // Validate imported data
        if (Array.isArray(importedShops) && importedShops.length > 0) {
          setShops(prevShops => [...prevShops, ...importedShops]);
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

  const parseCSV = (content: string): Shop[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '')) as Array<keyof Shop>;
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const shop: Partial<Shop> = {};
      
      headers.forEach((header, index) => {
        if (header === 'cash_on_delivery') {
          shop[header] = values[index].toLowerCase() === 'true';
        } else if (header === 'upi_id') {
          shop[header] = values[index] || null;
        } else {
          shop[header] = values[index] as any;
        }
      });
      
      const newShop: Shop = {
        ...shop as Shop,
        shop_id: shop.shop_id?.toString() || Math.floor(Math.random() * 10000).toString(),
        created_at: shop.created_at || new Date().toISOString(),
        updated_at: shop.updated_at || new Date().toISOString()
      };
      
      return newShop;
    });
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Shops</h1>
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
            Add Shop
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
              placeholder="Search shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={statusFilterRef}>
            <button 
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setShowStatusFilter(!showStatusFilter)}
            >
              <span>{filterStatus === 'all' ? 'All Status' : filterStatus === 'available' ? 'COD Available' : 'COD Unavailable'}</span>
              <ChevronDown size={20} />
            </button>
            {showStatusFilter && (
              <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${filterStatus === 'all' ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    setFilterStatus('all');
                    setShowStatusFilter(false);
                  }}
                >
                  All Status
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${filterStatus === 'available' ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    setFilterStatus('available');
                    setShowStatusFilter(false);
                  }}
                >
                  COD Available
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${filterStatus === 'unavailable' ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    setFilterStatus('unavailable');
                    setShowStatusFilter(false);
                  }}
                >
                  COD Unavailable
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={dateFilterRef}>
            <button 
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <span>Created Date {sortOrder === 'asc' ? '(Oldest)' : '(Newest)'}</span>
              <ChevronDown size={20} />
            </button>
            {showDateFilter && (
              <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${sortOrder === 'desc' ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    setSortBy('created_at');
                    setSortOrder('desc');
                    setShowDateFilter(false);
                  }}
                >
                  Newest First
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${sortOrder === 'asc' ? 'text-purple-600' : 'text-gray-700'}`}
                  onClick={() => {
                    setSortBy('created_at');
                    setSortOrder('asc');
                    setShowDateFilter(false);
                  }}
                >
                  Oldest First
                </button>
              </div>
            )}
          </div>
          <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Shop</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Info</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredShops.map((shop) => (
              <tr key={shop.shop_id} className="hover:bg-gray-50">
                <td className="py-4 px-6">
                  <div className="flex items-center">
                    {shop.profile_photo && (
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={shop.profile_photo} 
                        alt="" 
                      />
                    )}
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{shop.shop_name}</div>
                      <div className="text-gray-500">{shop.nickname}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-gray-900">{shop.phone_number}</div>
                  <div className="text-gray-500">{shop.email}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-gray-900">{shop.bank_name}</div>
                  <div className="text-gray-500">{shop.paypal_email}</div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shop.cash_on_delivery 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shop.cash_on_delivery ? 'COD Available' : 'COD Unavailable'}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">
                  {formatDate(shop.created_at)}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleView(shop)}
                      className="text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(shop)}
                      className="text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete()}
                      className="text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{isEditing ? 'Edit Shop' : 'Add New Shop'}</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(initialFormData);
                  setIsEditing(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    required
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 hover:border-purple-500 transition-colors group">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-500">
                            <Camera size={24} />
                            <span className="text-xs mt-1">Add Photo</span>
                          </div>
                        )}
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => profileInputRef.current?.click()}
                        >
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={profileInputRef}
                        onChange={(e) => handleFileChange(e, 'profile')}
                      />
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-purple-500 hover:text-purple-500 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose Profile Photo
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        Recommended: Square image, at least 400x400px
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                  <div className="space-y-4">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 hover:border-purple-500 transition-colors group">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-500">
                          <ImageIcon size={32} />
                          <span className="text-sm mt-2">Add Cover Image</span>
                          <span className="text-xs text-gray-400">1200x400px recommended</span>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={coverInputRef}
                        onChange={(e) => handleFileChange(e, 'cover')}
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-purple-500 hover:text-purple-500 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose Cover Photo
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        Recommended: 1200x400px for best display
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                  <input
                    type="email"
                    required
                    value={formData.paypal_email}
                    onChange={(e) => setFormData({...formData, paypal_email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    required
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.upi_id || ''}
                    onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash on Delivery</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.cash_on_delivery}
                        onChange={(e) => setFormData({...formData, cash_on_delivery: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-gray-700">Available</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(initialFormData);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {isEditing ? 'Update Shop' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Shop Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            {selectedShop && (
              <div className="space-y-6">
                <div>
                  {selectedShop.cover_photo && (
                    <img 
                      src={selectedShop.cover_photo} 
                      alt="Cover" 
                      className="w-full h-48 object-cover rounded-lg" 
                    />
                  )}
                  <div className="flex items-center mt-4">
                    {selectedShop.profile_photo && (
                      <img 
                        src={selectedShop.profile_photo} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover" 
                      />
                    )}
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold">{selectedShop.shop_name}</h3>
                      <p className="text-gray-500">{selectedShop.nickname}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-500">Email:</span> {selectedShop.email}</p>
                      <p><span className="text-gray-500">Phone:</span> {selectedShop.phone_number}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Payment Information</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-500">PayPal:</span> {selectedShop.paypal_email}</p>
                      <p><span className="text-gray-500">Bank:</span> {selectedShop.bank_name}</p>
                      <p><span className="text-gray-500">Account:</span> {selectedShop.bank_account_number}</p>
                      <p>
                        <span className="text-gray-500">Cash on Delivery:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedShop.cash_on_delivery 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedShop.cash_on_delivery ? 'Available' : 'Not Available'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <p><span className="text-gray-500">Created:</span> {formatDate(selectedShop.created_at)}</p>
                    <p><span className="text-gray-500">Last Updated:</span> {formatDate(selectedShop.updated_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Delete Shop</h2>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete the shop "{selectedShop.shop_name}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Export Shops</h2>
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
                  <input
                    type="radio"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="hidden"
                  />
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
                  <input
                    type="radio"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="hidden"
                  />
                  <FileText size={20} />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">This will export all shop data including:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Basic information (name, contact)</li>
                <li>Address details</li>
                <li>Payment information</li>
                <li>Registration dates</li>
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Shops</h2>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus('idle');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 mb-6">
              <div className="flex flex-col items-center text-center">
                <FileText size={48} className="text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV or JSON file containing shop data
                </p>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  id="import-input"
                  onChange={handleImport}
                />
                <button
                  onClick={() => document.getElementById('import-input')?.click()}
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
                  <li>Required columns: shop_name, nickname, email, phone_number</li>
                  <li>Optional: bank_details, payment_info, profile_photo</li>
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
    </div>
  );
};

export default Shops; 