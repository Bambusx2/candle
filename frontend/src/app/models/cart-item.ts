import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
  price?: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  discounts?: number;
  couponCode?: string;
}
