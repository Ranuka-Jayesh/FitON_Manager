import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Search } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

const sampleCategories: Category[] = [
  {
    id: 1,
    name: "T-Shirts",
    description: "Casual and comfortable t-shirts for all occasions",
    product_count: 25,
    created_at: "2024-03-15T10:00:00",
    updated_at: "2024-03-15T10:00:00"
  },
  {
    id: 2,
    name: "Jeans",
    description: "Denim jeans in various styles and fits",
    product_count: 15,
    created_at: "2024-03-15T10:00:00",
    updated_at: "2024-03-15T10:00:00"
  }
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();

    if (selectedCategory) {
      // Update existing category
      setCategories(categories.map(cat =>
        cat.id === selectedCategory.id
          ? {
              ...cat,
              name: formData.name,
              description: formData.description,
              updated_at: timestamp
            }
          : cat
      ));
    } else {
      // Add new category
      const newCategory: Category = {
        id: Math.max(0, ...categories.map(c => c.id)) + 1,
        name: formData.name,
        description: formData.description,
        product_count: 0,
        created_at: timestamp,
        updated_at: timestamp
      };
      setCategories([...categories, newCategory]);
    }

    setShowAddModal(false);
    setFormData({ name: '', description: '' });
    setSelectedCategory(null);
  };

  // Handle category deletion
  const handleDelete = (id: number) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete) {
      setSelectedCategory(categoryToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      setCategories(categories.filter(category => category.id !== selectedCategory.id));
      setShowDeleteModal(false);
      setSelectedCategory(null);
    }
  };

  // Handle category edit
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setShowAddModal(true);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setSelectedCategory(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{category.product_count} products</span>
              <span>Updated {formatDate(category.updated_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', description: '' });
                  setSelectedCategory(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', description: '' });
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {selectedCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Delete Category</h2>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{selectedCategory.name}"? This action cannot be undone.
              {selectedCategory.product_count > 0 && (
                <span className="block mt-2 text-red-600">
                  Warning: This category contains {selectedCategory.product_count} products.
                </span>
              )}
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
    </div>
  );
};

export default Categories; 