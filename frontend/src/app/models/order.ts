import { CartItem, CartSummary } from './cart-item';
import { Address } from './user';

export interface Order {
  id: number;
  userId: number;
  items: CartItem[];
  orderDate: Date;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  billingAddress: Address;
  summary: CartSummary;
  trackingNumber?: string;
}

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  PAYPAL = 'PayPal',
  BANK_TRANSFER = 'Bank Transfer'
}
