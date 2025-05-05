import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Star,
  ThumbsUp,
  Trash2,
  Search,
  ChevronDown,
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import { formatDate } from '../utils/date';

interface Review {
  review_id: number;
  product_id: number;
  buyer_id: string;
  rating: number;
  comment: string;
  likes: number;
  created_at: string;
  shop_id: string;
  product_name?: string;
  product_image?: string;
  buyer_name?: string;
  shop_name?: string;
  products?: any;
  buyers?: any;
  shops?: any;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showRatingFilter, setShowRatingFilter] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // First fetch reviews with products and buyers
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          products (
            name,
            images
          ),
          buyers (
            nickname
          )
        `)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then fetch all shops to map them
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('shop_id, shop_name');

      if (shopsError) throw shopsError;

      // Create a map of shop_id to shop_name for quick lookup
      const shopMap = new Map(shopsData.map(shop => [shop.shop_id, shop.shop_name]));

      const transformedData: Review[] = (reviewsData || []).map(review => ({
        ...review,
        product_name: review.products?.name || 'Unknown Product',
        product_image: review.products?.images?.[0] || null,
        buyer_name: review.buyers?.nickname || 'Unknown Buyer',
        shop_name: shopMap.get(review.shop_id) || 'Unknown Shop'
      }));

      setReviews(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('review_id', selectedReview.review_id);

      if (error) throw error;

      setReviews(reviews.filter(r => r.review_id !== selectedReview.review_id));
      setShowDeleteModal(false);
      setSelectedReview(null);
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reviews</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* Rating Filter */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={() => setShowRatingFilter(!showRatingFilter)}
          >
            <span>{filterRating === 'all' ? 'All Ratings' : `${filterRating} Stars`}</span>
            <ChevronDown size={20} />
          </button>
          {showRatingFilter && (
            <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                  filterRating === 'all' ? 'text-purple-600' : 'text-gray-700'
                }`}
                onClick={() => {
                  setFilterRating('all');
                  setShowRatingFilter(false);
                }}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    filterRating === rating ? 'text-purple-600' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    setFilterRating(rating);
                    setShowRatingFilter(false);
                  }}
                >
                  {rating} Stars
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.review_id} className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-6">
              {/* Product Image */}
              <div className="w-24 h-24 flex-shrink-0">
                {review.product_image ? (
                  <img
                    src={review.product_image}
                    alt={review.product_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <h3 className="font-medium text-gray-900">{review.product_name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>by {review.buyer_name}</p>
                      <p>Shop: {review.shop_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(review)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{review.comment}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <ThumbsUp size={16} />
                    <span>{review.likes} likes</span>
                  </div>
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredReviews.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No reviews found matching your criteria
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Delete Review</h2>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this review? This action cannot be undone.
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

export default Reviews; 