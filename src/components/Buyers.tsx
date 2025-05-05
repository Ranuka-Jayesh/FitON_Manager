import React, { useState, useRef, useEffect} from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  Filter,
  Download,
  Upload,
  Eye,
  X,
  AlertCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

interface Buyer {
  buyer_id: string;
  nickname: string | null;
  phone_number: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  created_at: string;
  updated_at: string;
  interests: string[] | null;
  recommendation_opt_out: boolean;
  address: Address | null;
}

interface BuyerFormData {
  buyer_id?: string;
  nickname: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  interests: string;
  address: string;
  password: string;
}

// Add Toast interface and component
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastNotification: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 z-50
      ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {toast.type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const Buyers: React.FC = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<Buyer | null>(null);

  // Add toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const initialFormData: BuyerFormData = {
    buyer_id: '',
    nickname: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    gender: 'Male',
    interests: '',
    address: '',
    password: ''
  };

  const [formData, setFormData] = useState<BuyerFormData>(initialFormData);

  // Add toast helper functions
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch buyers from database
  const fetchBuyers = async () => {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select(`
          buyer_id,
          nickname,
          phone_number,
          email,
          date_of_birth,
          gender,
          created_at,
          updated_at,
          interests,
          recommendation_opt_out,
          address
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBuyers(data || []);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  // Format date to local string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Update the handleDelete function
  const handleDelete = async () => {
    if (!selectedBuyer) return;
    try {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('buyer_id', selectedBuyer.buyer_id);

      if (error) throw error;
      await fetchBuyers();
      setShowDeleteModal(false);
      setSelectedBuyer(null);
    } catch (error) {
      console.error('Error deleting buyer:', error);
    }
  };

  // Handle viewing buyer details
  const handleView = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setShowViewModal(true);
  };

  // Filter and sort buyers
  const filteredBuyers = buyers
    .filter(buyer => {
      const matchesSearch = 
        (buyer.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (buyer.phone_number?.includes(searchTerm) || false);
      
      const matchesGender = filterGender === 'all' || buyer.gender === filterGender;
      
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Buyer];
      const bValue = b[sortBy as keyof Buyer];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuyers = filteredBuyers.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, sortBy, sortOrder]);

  const handleEdit = (buyer: Buyer) => {
    setIsEditing(true);
    setSelectedBuyer(buyer);
    
    // Format the address for display
    const formattedAddress = buyer.address 
      ? Object.values(buyer.address)
          .filter(value => value !== null && value !== undefined)
          .join('')
      : '';

    // Format interests for display
    const formattedInterests = Array.isArray(buyer.interests) 
      ? buyer.interests.join(',')
      : '';

    // Set form data with formatted values including buyer_id
    setFormData({
      buyer_id: buyer.buyer_id,
      nickname: buyer.nickname || '',
      phone_number: buyer.phone_number || '',
      email: buyer.email || '',
      date_of_birth: buyer.date_of_birth || '',
      gender: buyer.gender || 'Male',
      interests: formattedInterests,
      address: formattedAddress,
      password: ''
    });

    setShowAddModal(true);
  };

  // Update handleSubmit to use toasts

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let newBuyers: Buyer[] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const rows = content.split('\n');
          const headers = rows[0].split(',');
          
          newBuyers = rows.slice(1).map((row, index) => {
            const values = row.split(',');
            const buyer: any = {
              buyer_id: (buyers.length + index + 1).toString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            headers.forEach((header, i) => {
              if (header.trim() === 'interests') {
                buyer[header.trim()] = values[i].split(';').map((i: string) => i.trim());
              } else if (header.trim().startsWith('address.')) {
                const addressField = header.trim().split('.')[1];
                if (!buyer.address) buyer.address = {};
                buyer.address[addressField] = values[i].trim();
              } else {
                buyer[header.trim()] = values[i].trim();
              }
            });
            
            return buyer;
          });
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          const data = JSON.parse(content);
          newBuyers = data.map((buyer: any, index: number) => ({
            ...buyer,
            buyer_id: (buyers.length + index + 1).toString()
          }));
        }

        setBuyers([...buyers, ...newBuyers]);
        setImportStatus('success');
        setTimeout(() => {
          setShowImportModal(false);
          setImportStatus('idle');
        }, 1500);
      } catch (error) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleExport = () => {
    let content = '';
    const filename = `buyers_export_${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'csv') {
      // Create CSV content
      const headers = ['nickname', 'phone_number', 'email', 'date_of_birth', 'gender', 'interests', 'address.street', 'address.city', 'address.state', 'address.country', 'address.postal_code'];
      content = headers.join(',') + '\n';
      
      content += buyers.map(buyer => {
        const interests = Array.isArray(buyer.interests) ? buyer.interests.join(';') : '';
        const address = buyer.address || {};
        return [
          buyer.nickname || '',
          buyer.phone_number || '',
          buyer.email || '',
          buyer.date_of_birth || '',
          buyer.gender || '',
          interests,
          address.street || '',
          address.city || '',
          address.state || '',
          address.country || '',
          address.postal_code || ''
        ].join(',');
      }).join('\n');

      downloadFile(`${filename}.csv`, content, 'text/csv');
    } else {
      // Create JSON content
      content = JSON.stringify(buyers, null, 2);
      downloadFile(`${filename}.json`, content, 'application/json');
    }

    setShowExportModal(false);
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // View Modal Component
  const ViewModal = () => {
    if (!selectedBuyer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Buyer Details</h2>
            <button 
              onClick={() => setShowViewModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Nickname</label>
                <p className="font-medium">{selectedBuyer.nickname}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone Number</label>
                <p className="font-medium">{selectedBuyer.phone_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{selectedBuyer.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date of Birth</label>
                <p className="font-medium">{selectedBuyer.date_of_birth}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Gender</label>
                <p className="font-medium">{selectedBuyer.gender}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created At</label>
                <p className="font-medium">{formatDate(selectedBuyer.created_at)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Updated At</label>
                <p className="font-medium">{formatDate(selectedBuyer.updated_at)}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Interests</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedBuyer?.interests?.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                )) || 'No interests'}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Address</label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                {selectedBuyer.address ? (
                  <div>
                    {Object.entries(selectedBuyer.address as Address)
                      .filter(([_, value]) => value !== null && value !== undefined)
                      .map(([_, value]) => value)
                      .join('')}
              </div>
                ) : (
                  <p>No address information available</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Recommendation Opt-out</label>
              <p className="font-medium">{selectedBuyer.recommendation_opt_out ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Form Modal Component
  const FormModal = () => {
    const [localFormData, setLocalFormData] = useState<BuyerFormData>(
      isEditing ? formData : initialFormData
    );

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const addressWithoutSpaces = e.target.value.replace(/\s+/g, '');
      setLocalFormData({...localFormData, address: addressWithoutSpaces});
    };

    const handleLocalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const currentTimestamp = new Date().toISOString();

        // Prepare the buyer data with all required fields
        const buyerData = {
          nickname: localFormData.nickname.trim(),
          phone_number: localFormData.phone_number.trim(),
          email: localFormData.email.trim(),
          date_of_birth: localFormData.date_of_birth,
          gender: localFormData.gender,
          interests: localFormData.interests.split(',').map(i => i.trim()).filter(Boolean),
          address: localFormData.address.replace(/\s+/g, '') || null,
          recommendation_opt_out: false,
          updated_at: currentTimestamp
        };

        if (isEditing && selectedBuyer) {
          // Update query for existing buyer
          const { data: updateData, error: updateError } = await supabase
            .from('buyers')
            .update({
              ...buyerData,
              updated_at: currentTimestamp
            })
            .eq('buyer_id', selectedBuyer.buyer_id)
            .select('*');

          if (updateError) {
            console.error('Database update error:', updateError);
            addToast('Failed to update buyer in database. Please try again.', 'error');
            throw updateError;
          }

          if (!updateData || updateData.length === 0) {
            addToast('Failed to update buyer. No data returned from database.', 'error');
            throw new Error('No data returned after update');
          }

          // Update local state with the returned data
          setBuyers(prevBuyers => 
            prevBuyers.map(buyer => 
              buyer.buyer_id === selectedBuyer.buyer_id ? updateData[0] : buyer
            )
          );

          addToast('Buyer successfully updated in database!', 'success');
      } else {
          // First, create a new user with email and password
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: localFormData.email,
            password: localFormData.password,
          });

          if (authError) {
            console.error('Authentication error:', authError);
            addToast('Failed to create user account. Please try again.', 'error');
            throw authError;
          }

          if (!authData.user) {
            addToast('Failed to create user account. No user data returned.', 'error');
            throw new Error('No user data returned after signup');
          }

          // Then insert the buyer data with the new user's ID
          const { data: insertData, error: insertError } = await supabase
            .from('buyers')
            .insert([{
              ...buyerData,
              buyer_id: authData.user.id,
              created_at: currentTimestamp
            }])
            .select('*');

          if (insertError) {
            console.error('Database insert error:', insertError);
            addToast('Failed to create buyer in database. Please try again.', 'error');
            throw insertError;
          }

          if (!insertData || insertData.length === 0) {
            addToast('Failed to create buyer. No data returned from database.', 'error');
            throw new Error('No data returned after insert');
          }

          // Update local state with the new buyer
          setBuyers(prevBuyers => [...prevBuyers, insertData[0]]);
          addToast('Buyer successfully created in database!', 'success');
        }

        // Reset form and state
        setShowAddModal(false);
        setFormData(initialFormData);
        setIsEditing(false);
        setSelectedBuyer(null);
      } catch (error) {
        console.error('Database operation error:', error);
        addToast('Error saving buyer to database. Please try again.', 'error');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{isEditing ? 'Edit Buyer' : 'Add New Buyer'}</h2>
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

          <form onSubmit={handleLocalSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {isEditing && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer ID</label>
                  <input
                    type="text"
                    value={localFormData.buyer_id}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  required
                  value={localFormData.nickname}
                  onChange={(e) => setLocalFormData({...localFormData, nickname: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={localFormData.phone_number}
                  onChange={(e) => setLocalFormData({...localFormData, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={localFormData.email}
                  onChange={(e) => setLocalFormData({...localFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={localFormData.password}
                    onChange={(e) => setLocalFormData({...localFormData, password: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={localFormData.date_of_birth}
                  onChange={(e) => setLocalFormData({...localFormData, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={localFormData.gender}
                  onChange={(e) => setLocalFormData({...localFormData, gender: e.target.value as 'Male' | 'Female' | 'Other'})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                <input
                  type="text"
                  placeholder="Separate with commas"
                  value={localFormData.interests}
                  onChange={(e) => setLocalFormData({...localFormData, interests: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                  value={localFormData.address}
                  onChange={handleAddressChange}
                  placeholder="Enter address (no spaces)"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
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
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {isEditing ? 'Update Buyer' : 'Add Buyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Update the DeleteModal component
  const DeleteModal = () => {
    if (!selectedBuyer) return null;

    const handleConfirmDelete = async () => {
      try {
        const { error } = await supabase
          .from('buyers')
          .delete()
          .eq('buyer_id', selectedBuyer.buyer_id);

        if (error) {
          console.error('Error deleting buyer:', error);
          addToast('Failed to delete buyer. Please try again.', 'error');
          throw error;
        }

        // Update local state
        setBuyers(prevBuyers => prevBuyers.filter(b => b.buyer_id !== selectedBuyer.buyer_id));
        addToast('Buyer successfully deleted!', 'success');

        // Close modal and reset selected buyer
        setShowDeleteModal(false);
        setSelectedBuyer(null);
      } catch (error) {
        console.error('Error deleting buyer:', error);
        addToast('Error deleting buyer. Please try again.', 'error');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[400px]">
          <div className="flex items-center mb-4 text-red-600">
            <AlertCircle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this buyer?
          </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{selectedBuyer.nickname}</p>
              <p className="text-sm text-gray-500">{selectedBuyer.email}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedBuyer(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <Trash2 size={18} className="mr-2" />
              Delete Buyer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Import Modal Component
  const ImportModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Import Buyers</h2>
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

          <div className="space-y-4">
            {importStatus === 'idle' && (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Upload a CSV or JSON file containing buyer data</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Choose File
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  <p className="font-medium mb-2">File requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>CSV or JSON format</li>
                    <li>Required columns: nickname, email, phone_number, gender</li>
                    <li>Optional: date_of_birth, interests, address details</li>
                  </ul>
                </div>
              </>
            )}

            {importStatus === 'loading' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Importing buyers...</p>
              </div>
            )}

            {importStatus === 'success' && (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p className="text-green-600 font-medium">Import successful!</p>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="text-center py-8">
                <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-red-600 font-medium">Import failed</p>
                <p className="text-gray-500 mt-2">Please check your file format and try again</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Export Modal Component
  const ExportModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Export Buyers</h2>
            <button 
              onClick={() => setShowExportModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    exportFormat === 'csv' ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={20} className="mr-2" />
                  CSV
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    exportFormat === 'json' ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={20} className="mr-2" />
                  JSON
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>This will export all buyer data including:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Basic information (name, contact)</li>
                <li>Address details</li>
                <li>Interests</li>
                <li>Registration dates</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Download size={18} className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update Confirmation Modal
  const UpdateConfirmModal = () => {
    if (!pendingUpdate) return null;

    const handleConfirmUpdate = () => {
      setBuyers(buyers.map(b => b.buyer_id === pendingUpdate.buyer_id ? pendingUpdate : b));
      setShowUpdateConfirmModal(false);
      setShowAddModal(false);
      setFormData(initialFormData);
      setIsEditing(false);
      setSelectedBuyer(null);
      setPendingUpdate(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg p-6 w-[400px]">
          <div className="flex items-center mb-4 text-yellow-600">
            <AlertCircle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">Confirm Update</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to update the details for buyer "{pendingUpdate.nickname}"? This action will modify their information.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowUpdateConfirmModal(false);
                setPendingUpdate(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpdate}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Update Buyer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Buyers</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
          >
            <Upload size={18} className="mr-2" />
            Import
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
          >
            <Download size={18} className="mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Buyer
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search buyers..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              className="pl-4 pr-10 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              className="pl-4 pr-10 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Created Date</option>
              <option value="nickname">Nickname</option>
              <option value="email">Email</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter size={20} className={`transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentBuyers.map((buyer) => (
              <tr key={buyer.buyer_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{buyer.nickname}</div>
                  <div className="text-sm text-gray-500">{buyer.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {buyer.phone_number || 'No phone number'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {buyer.address ? (
                      <div>
                        {Object.entries(buyer.address as Address)
                          .filter(([_, value]) => value !== null && value !== undefined)
                          .map(([_, value]) => value)
                          .join('')}
                      </div>
                    ) : (
                      'No address'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm
                    ${buyer.gender === 'Male' ? 'bg-blue-100 text-blue-800' : ''}
                    ${buyer.gender === 'Female' ? 'bg-pink-100 text-pink-800' : ''}
                    ${buyer.gender === 'Other' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {buyer.gender}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(buyer.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleView(buyer)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleEdit(buyer)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete()}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBuyers.length)} of {filteredBuyers.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded-lg text-sm ${
                    currentPage === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <FormModal />}
      {showViewModal && <ViewModal />}
      {showDeleteModal && <DeleteModal />}
      {showImportModal && <ImportModal />}
      {showExportModal && <ExportModal />}
      {showUpdateConfirmModal && <UpdateConfirmModal />}
    </div>
  );
};

export default Buyers; 