
export type Category = {
  id: string;
  name: string;
  icon: string;
  description?: string;
};

export type NutritionalValues = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  pricePerUnit: number;
  currentStockQuantity: number;
  unitOfMeasure: string; // kg, piece, bunch
  imageUrl: string;
  description: string;
  lowStockThreshold?: number;
  isPopular?: boolean;
  nutritionalValues?: NutritionalValues;
};

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT_SALE' | 'STOCK_OUT_WASTE' | 'STOCK_OUT_TRANSFER';

export type Transaction = {
  id: string;
  productId: string;
  transactionType: TransactionType;
  quantityChange: number;
  transactionDate: any;
  reason?: string;
  staffUserId: string;
};

export type Staff = {
  id: string;
  name: string;
  role: 'Admin' | 'Staff' | 'Superadmin';
  email: string;
  status: 'active' | 'inactive';
  lastLogin: any;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
};

export type Order = {
  id: string;
  address: string;
  createdAt: any;
  items: OrderItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
  userId: string;
};
