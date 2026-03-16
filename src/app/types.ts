
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
  status: 'active' | 'inactive';
  lastLogin: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: 'active' | 'inactive';
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
  paymentMethod: 'cash' | 'gcash' | 'card';
};

export type Payment = {
  id: string;
  orderId?: string;
  supplierId?: string;
  type: 'income' | 'expense';
  amount: number;
  method: string;
  date: string;
  status: 'successful' | 'pending' | 'failed';
  description: string;
};
