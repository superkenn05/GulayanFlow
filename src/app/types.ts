
export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  currentStock: number;
  unit: string; // kg, piece, bunch
  imageUrl: string;
  description: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
};

export type TransactionType = 'in' | 'out' | 'waste';

export type Transaction = {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  reason?: string;
  staffName: string;
};

export type Staff = {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  email: string;
};
