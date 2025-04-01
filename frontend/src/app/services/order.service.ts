import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Order, OrderStatus, PaymentMethod } from '../models/order';
import { CartService } from './cart.service';
import { CartItem, CartSummary } from '../models/cart-item';
import { AuthService } from './auth.service';
import { Product } from '../models/product';
import { Address } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Keep mock orders for fallback in case API calls fail
  private mockOrders: Order[] = [
    {
      id: 10001,
      userId: 1,
      orderDate: new Date(2023, 11, 15),
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'SHIPPING'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'BILLING'
      },
      items: [],
      summary: {
        subtotal: 89.97,
        shipping: 0,
        tax: 7.20,
        total: 97.17
      },
      trackingNumber: 'USPS1234567890'
    },
    {
      id: 10002,
      userId: 1,
      orderDate: new Date(2023, 11, 5),
      status: OrderStatus.SHIPPED,
      paymentMethod: PaymentMethod.PAYPAL,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'SHIPPING'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'BILLING'
      },
      items: [],
      summary: {
        subtotal: 45.99,
        shipping: 5.99,
        tax: 3.68,
        total: 55.66
      },
      trackingNumber: 'FEDEX9876543210'
    },
    {
      id: 10003,
      userId: 1,
      orderDate: new Date(2023, 10, 20),
      status: OrderStatus.PROCESSING,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'SHIPPING'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true,
        addressType: 'BILLING'
      },
      items: [],
      summary: {
        subtotal: 120.00,
        shipping: 0,
        tax: 9.60,
        total: 129.60
      }
    }
  ];
  
  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private authService: AuthService
  ) {
    // Keep this for fallback
    this.populateMockOrderItems();
  }

  /**
   * Initialize mock order items with product data (for fallback)
   */
  private populateMockOrderItems(): void {
    // Mock products for order items
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Vanilla Bliss Candle',
        price: 29.99,
        description: 'A smooth and warm vanilla scent to create a cozy atmosphere.',
        imageUrl: 'assets/images/candles/vanilla-candle.jpg',
        category: { id: 1, name: 'Scented' },
        scent: 'Vanilla',
        burnTime: '40 hours',
        size: 'Medium',
        weight: '10 oz',
        inStock: true,
        rating: 4.5,
        reviewCount: 127
      },
      {
        id: 2,
        name: 'Lavender Dreams Candle',
        price: 34.99,
        description: 'Calming lavender scent to help you relax and unwind.',
        imageUrl: 'assets/images/candles/lavender-candle.jpg',
        category: { id: 1, name: 'Scented' },
        scent: 'Lavender',
        burnTime: '45 hours',
        size: 'Large',
        weight: '12 oz',
        inStock: true,
        rating: 4.8,
        reviewCount: 93
      },
      {
        id: 3,
        name: 'Pure Soy Pillar Candle',
        price: 24.99,
        description: 'Unscented pure soy candle, perfect for sensitive environments.',
        imageUrl: 'assets/images/candles/soy-pillar-candle.jpg',
        category: { id: 3, name: 'Soy' },
        burnTime: '30 hours',
        size: 'Medium',
        weight: '8 oz',
        inStock: true,
        rating: 4.2,
        reviewCount: 58
      },
      {
        id: 4,
        name: 'Ocean Breeze Candle',
        price: 32.99,
        description: 'Fresh ocean scent that brings the beach to your home.',
        imageUrl: 'assets/images/candles/ocean-candle.jpg',
        category: { id: 1, name: 'Scented' },
        scent: 'Ocean Breeze',
        burnTime: '50 hours',
        size: 'Large',
        weight: '14 oz',
        inStock: true,
        rating: 4.6,
        reviewCount: 72
      }
    ];

    // Assign products to orders
    this.mockOrders[0].items = [
      { product: mockProducts[0], quantity: 1, price: mockProducts[0].price },
      { product: mockProducts[1], quantity: 1, price: mockProducts[1].price },
      { product: mockProducts[3], quantity: 1, price: mockProducts[3].price }
    ];
    
    this.mockOrders[1].items = [
      { product: mockProducts[2], quantity: 1, price: mockProducts[2].price },
      { product: mockProducts[3], quantity: 1, price: mockProducts[3].price }
    ];
    
    this.mockOrders[2].items = [
      { product: mockProducts[0], quantity: 2, price: mockProducts[0].price },
      { product: mockProducts[1], quantity: 1, price: mockProducts[1].price },
      { product: mockProducts[2], quantity: 1, price: mockProducts[2].price }
    ];
  }

  /**
   * Get order history for the currently logged in user
   */
  getOrderHistory(): Observable<Order[]> {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.warn('User is not authenticated. Returning empty order history.');
      return of([]);
    }
    
    console.log('Fetching order history from backend');
    
    // Call the real API endpoint
    return this.apiService.get<Order[]>('orders').pipe(
      tap(orders => console.log('Order history retrieved:', orders)),
      catchError(error => {
        console.error('Error fetching order history:', error);
        // Fallback to mock data in case of error
        console.warn('Falling back to mock order data');
        return of(this.mockOrders).pipe(
          delay(800),
          map(orders => {
            // Sort orders by date, newest first
            return orders.sort((a, b) => {
              const dateA = new Date(a.orderDate);
              const dateB = new Date(b.orderDate);
              return dateB.getTime() - dateA.getTime();
            });
          })
        );
      })
    );
  }

  /**
   * Get a specific order by ID
   */
  getOrderById(orderId: number): Observable<Order> {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.error('User is not authenticated.');
      return throwError(() => new Error('Authentication required to view order details'));
    }
    
    console.log(`Fetching order ${orderId} from backend`);
    
    // Call the real API endpoint
    return this.apiService.get<Order>(`orders/${orderId}`).pipe(
      tap(order => console.log('Order details retrieved:', order)),
      catchError(error => {
        console.error(`Error fetching order ${orderId}:`, error);
        // Fallback to mock data in case of error
        const mockOrder = this.mockOrders.find(o => o.id === orderId);
        if (mockOrder) {
          console.warn('Falling back to mock order data');
          return of(mockOrder).pipe(delay(500));
        } else {
          return throwError(() => new Error(`Order with ID ${orderId} not found`));
        }
      })
    );
  }

  /**
   * Create a new order from the current cart
   */
  createOrder(shippingAddress: Address, billingAddress: Address | null, paymentMethod: string): Observable<Order> {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.error('User is not authenticated.');
      return throwError(() => new Error('Authentication required to create an order'));
    }
    
    const cartItems = this.cartService.getCartItems();
    
    if (cartItems.length === 0) {
      return throwError(() => new Error('Cannot create order with empty cart'));
    }

    // Prepare request payload
    const orderRequest = {
      shippingAddress: shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: paymentMethod,
      useShippingAsBilling: !billingAddress || billingAddress === shippingAddress
    };

    console.log('Creating new order with backend API', orderRequest);
    
    // Call the real API endpoint
    return this.apiService.post<Order>('orders', orderRequest).pipe(
      tap(order => {
        console.log('Order created successfully:', order);
        // Clear the cart after successful order creation
        this.cartService.clearCart();
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        // Don't fallback to mock for creation - we don't want to clear the cart if it fails
        return throwError(() => new Error(`Failed to create order: ${error.message || 'Unknown error'}`));
      })
    );
  }

  /**
   * Cancel an order if it's in a cancellable state
   */
  cancelOrder(orderId: number): Observable<Order> {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.error('User is not authenticated.');
      return throwError(() => new Error('Authentication required to cancel an order'));
    }
    
    console.log(`Cancelling order ${orderId} with backend API`);
    
    // Call the real API endpoint
    return this.apiService.put<Order>(`orders/${orderId}/cancel`, {}).pipe(
      tap(order => console.log('Order cancelled successfully:', order)),
      catchError(error => {
        console.error(`Error cancelling order ${orderId}:`, error);
        // Fallback to mock for testing
        const orderIndex = this.mockOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          console.warn('Falling back to mock order cancellation');
          const order = this.mockOrders[orderIndex];
          if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
            return throwError(() => new Error(`Order with status ${order.status} cannot be cancelled`));
          }
          order.status = OrderStatus.CANCELLED;
          this.mockOrders[orderIndex] = order;
          return of(order).pipe(delay(800));
        } else {
          return throwError(() => new Error(`Order with ID ${orderId} not found`));
        }
      })
    );
  }

  /**
   * Track an order's status and shipping
   */
  trackOrder(orderId: number): Observable<any> {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.error('User is not authenticated.');
      return throwError(() => new Error('Authentication required to track an order'));
    }
    
    console.log(`Tracking order ${orderId} with backend API`);
    
    // Call the real API endpoint
    return this.apiService.get<Order>(`orders/${orderId}/track`).pipe(
      tap(order => console.log('Order tracking information retrieved:', order)),
      map(order => {
        // Format the tracking information from the order object
        // This will depend on what data your backend returns
        // For now, we'll use a similar format to our mock data
        if (!order.trackingNumber) {
          return { message: 'Tracking information not available yet' };
        }
        
        // Format tracking info (can be extended with more detail from backend)
        return {
          trackingNumber: order.trackingNumber,
          carrier: order.trackingNumber.startsWith('TRK') ? 'Standard Shipping' : 'Express',
          status: order.status,
          estimatedDelivery: new Date(new Date(order.orderDate).getTime() + 5 * 24 * 60 * 60 * 1000)
        };
      }),
      catchError(error => {
        console.error(`Error tracking order ${orderId}:`, error);
        // Fallback to mock tracking data
        return this.fallbackToMockTracking(orderId);
      })
    );
  }
  
  /**
   * Fallback to mock tracking data if API fails
   */
  private fallbackToMockTracking(orderId: number): Observable<any> {
    console.warn('Falling back to mock order tracking');
    const order = this.mockOrders.find(o => o.id === orderId);
    
    if (!order) {
      return throwError(() => new Error(`Order with ID ${orderId} not found`));
    }
    
    if (!order.trackingNumber) {
      return throwError(() => new Error('Tracking information not available yet'));
    }
    
    // Mock tracking info
    const trackingInfo = {
      trackingNumber: order.trackingNumber,
      carrier: order.trackingNumber.startsWith('USPS') ? 'USPS' : 'FedEx',
      status: order.status,
      estimatedDelivery: new Date(order.orderDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      trackingHistory: [
        {
          status: 'Order Placed',
          location: 'Online',
          timestamp: order.orderDate
        },
        {
          status: 'Processing',
          location: 'Distribution Center',
          timestamp: new Date(order.orderDate.getTime() + 1 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Shipped',
          location: 'Distribution Center',
          timestamp: new Date(order.orderDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        }
      ]
    };
    
    // Add delivery info if delivered
    if (order.status === OrderStatus.DELIVERED) {
      trackingInfo.trackingHistory.push({
        status: 'Delivered',
        location: 'Customer Address',
        timestamp: new Date(order.orderDate.getTime() + 5 * 24 * 60 * 60 * 1000)
      });
    }
    
    return of(trackingInfo).pipe(delay(700)); // Simulate API delay
  }
} 