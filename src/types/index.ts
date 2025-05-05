export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Shop {
  shop_id: number;
  shop_name: string;
  nickname: string;
  phone_number: string;
  email: string;
  profile_photo: string;
  cover_photo: string;
  paypal_email: string;
  bank_account_number: string;
  bank_name: string;
  cash_on_delivery: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopFormData {
  shop_name: string;
  nickname: string;
  phone_number: string;
  email: string;
  password?: string;
  profile_photo: string;
  cover_photo: string;
  paypal_email: string;
  bank_account_number: string;
  bank_name: string;
  cash_on_delivery: boolean;
}

export interface Product {
  product_id: number;
  shop_id: number;
  name: string;
  category: string;
  images: string[];
  price: number;
  stock: number;
  likes: number;
  orders_count: number;
  size_chart: string;
  size_measurements: Record<string, any>;
  created_at: string;
  updated_at: string;
  gender: 'M' | 'F';
  wish: number;
  wear: number;
}

export interface ProductFormData {
  shop_id: number;
  product_name: string;
  gender: 'M' | 'F';
  category: string;
  images: string[];
  price: number;
  stock: number;
  size_chart: string;
  size_measurements: {
    [key: string]: {
      chest?: number;
      waist?: number;
      hips?: number;
      length?: number;
      [key: string]: number | undefined;
    };
  };
}