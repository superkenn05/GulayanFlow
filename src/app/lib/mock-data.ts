
import { Product, Category, Transaction, Staff, Supplier, Order, Payment } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Vegetables', icon: 'LeafyGreen' },
  { id: 'cat-2', name: 'Fruits', icon: 'Apple' },
  { id: 'cat-3', name: 'Root Crops', icon: 'Carrot' },
  { id: 'cat-4', name: 'Grains', icon: 'Wheat' },
  { id: 'cat-5', name: 'Spices', icon: 'Flame' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    name: 'Carrots',
    categoryId: 'cat-3',
    price: 80,
    currentStock: 45,
    unit: 'kg',
    imageUrl: 'https://picsum.photos/seed/carrot/400/300',
    description: 'Fresh highland carrots from Benguet.',
    status: 'in-stock',
  },
  {
    id: 'p-2',
    name: 'Red Onion',
    categoryId: 'cat-5',
    price: 150,
    currentStock: 4,
    unit: 'kg',
    imageUrl: 'https://picsum.photos/seed/onion/400/300',
    description: 'Locally sourced red onions.',
    status: 'low-stock',
  },
  {
    id: 'p-3',
    name: 'Baguio Cabbage',
    categoryId: 'cat-1',
    price: 60,
    currentStock: 25,
    unit: 'kg',
    imageUrl: 'https://picsum.photos/seed/cabbage/400/300',
    description: 'Fresh cabbage from Baguio City.',
    status: 'in-stock',
  },
  {
    id: 'p-4',
    name: 'Lakatan Banana',
    categoryId: 'cat-2',
    price: 95,
    currentStock: 0,
    unit: 'kg',
    imageUrl: 'https://picsum.photos/seed/banana/400/300',
    description: 'Sweet lakatan bananas.',
    status: 'out-of-stock',
  },
  {
    id: 'p-5',
    name: 'Garlic',
    categoryId: 'cat-5',
    price: 200,
    currentStock: 3,
    unit: 'kg',
    imageUrl: 'https://picsum.photos/seed/garlic/400/300',
    description: 'Imported white garlic.',
    status: 'low-stock',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    productId: 'p-1',
    type: 'in',
    quantity: 50,
    date: new Date().toISOString(),
    staffName: 'Gemma',
  },
  {
    id: 't-2',
    productId: 'p-1',
    type: 'out',
    quantity: 5,
    date: new Date().toISOString(),
    staffName: 'Juan',
  },
  {
    id: 't-3',
    productId: 'p-2',
    type: 'waste',
    quantity: 2,
    date: new Date().toISOString(),
    reason: 'Damaged during transit',
    staffName: 'Gemma',
  },
];

export const MOCK_STAFF_LIST: Staff[] = [
  {
    id: 's-1',
    name: 'Gemma Cruz',
    role: 'admin',
    email: 'gemma@gulayan.ph',
    status: 'active',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 's-2',
    name: 'Juan Luna',
    role: 'staff',
    email: 'juan@gulayan.ph',
    status: 'active',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 's-3',
    name: 'Maria Clara',
    role: 'staff',
    email: 'maria@gulayan.ph',
    status: 'inactive',
    lastLogin: new Date(Date.now() - 604800000).toISOString(),
  },
];

export const MOCK_STAFF: Staff = MOCK_STAFF_LIST[0];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Benguet Farmers Coop',
    contactPerson: 'Jose Rizal',
    phone: '0917-123-4567',
    email: 'jose@benguetfarmers.ph',
    category: 'Vegetables',
    status: 'active',
  },
  {
    id: 'sup-2',
    name: 'Davao Fruit Hub',
    contactPerson: 'Maria Clara',
    phone: '0918-987-6543',
    email: 'maria@davaofruits.com',
    category: 'Fruits',
    status: 'active',
  },
  {
    id: 'sup-3',
    name: 'Manila Spice Wholesalers',
    contactPerson: 'Andres Bonifacio',
    phone: '0919-555-0000',
    email: 'andres@spicemanila.com',
    category: 'Spices',
    status: 'inactive',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    customerName: 'Juan Dela Cruz',
    items: [
      { productId: 'p-1', productName: 'Carrots', quantity: 2, price: 80 },
      { productId: 'p-3', productName: 'Baguio Cabbage', quantity: 1, price: 60 },
    ],
    total: 220,
    status: 'completed',
    date: new Date(Date.now() - 3600000).toISOString(),
    paymentMethod: 'cash',
  },
  {
    id: 'ord-1002',
    customerName: 'Liza Soberano',
    items: [
      { productId: 'p-5', productName: 'Garlic', quantity: 0.5, price: 200 },
    ],
    total: 100,
    status: 'pending',
    date: new Date().toISOString(),
    paymentMethod: 'gcash',
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    orderId: 'ord-1001',
    type: 'income',
    amount: 220,
    method: 'Cash',
    date: new Date(Date.now() - 3600000).toISOString(),
    status: 'successful',
    description: 'Payment for Order #ord-1001',
  },
  {
    id: 'pay-2',
    supplierId: 'sup-1',
    type: 'expense',
    amount: 1500,
    method: 'Bank Transfer',
    date: new Date(Date.now() - 172800000).toISOString(),
    status: 'successful',
    description: 'Restock payment to Benguet Farmers',
  },
  {
    id: 'pay-3',
    orderId: 'ord-1002',
    type: 'income',
    amount: 100,
    method: 'GCash',
    date: new Date().toISOString(),
    status: 'pending',
    description: 'Awaiting GCash confirmation',
  },
];
