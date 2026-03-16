
import { Product, Category, Transaction, Staff } from '../types';

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

export const MOCK_STAFF: Staff = {
  id: 's-1',
  name: 'Gemma Cruz',
  role: 'admin',
  email: 'gemma@gulayan.ph',
};
