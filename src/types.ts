export interface Product {
  product_id: number;
  shop_id: string;
  shop_name: string;
  name: string;
  gender: 'M' | 'F';
  category: string;
  images: string[];
  price: number;
  stock: number;
  likes: number;
  orders_count: number;
  size_chart: string;
  size_measurements: {
    [size: string]: {
      [measurement: string]: number;
    };
  };
  created_at: string;
  updated_at: string;
  wish: number;
  wear: number;
}

export interface ProductFormData {
  shop_id: string;
  product_name: string;
  gender: 'M' | 'F';
  category: string;
  images: string[];
  price: number;
  stock: number;
  size_chart: string;
  size_measurements: {
    [size: string]: {
      [measurement: string]: number;
    };
  };
}

export interface Shop {
  shop_id: string;
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