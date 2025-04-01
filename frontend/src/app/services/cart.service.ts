import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ProductService } from './product.service';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();
  
  private cartKey = 'candle_shop_cart';
  private syncNotificationShown = false;

  constructor(
    private productService: ProductService,
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.loadCart();
    
    // Subscribe to auth state changes to sync cart
    this.authService.currentUser.subscribe(user => {
      if (user && this.authService.getToken()) {
        // User just logged in - sync with server
        console.log('User logged in, syncing cart with server');
        this.syncCartWithServer();
        this.syncNotificationShown = false;
      }
    });
    
    // Add an event listener to ensure cart is saved before page unload/refresh
    window.addEventListener('beforeunload', () => {
      const currentCart = this.getCartItems();
      if (currentCart.length > 0) {
        localStorage.setItem(this.cartKey, JSON.stringify(currentCart));
      }
    });
  }

  // Helper method to safely check if user is logged in
  private isUserLoggedIn(): boolean {
    try {
      // First, make sure the auth service is available
      if (!this.authService) {
        console.log('Auth service not available');
        return false;
      }

      // Use the isLoggedIn method from AuthService which checks for token existence
      const isLoggedIn = this.authService.isLoggedIn();
      return isLoggedIn;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  private loadCart(): void {
    console.log('Loading cart data');
    
    // First load from localStorage to ensure we have cart items right away
    this.loadLocalCart();
    
    // Then try to get from server if user is logged in
    if (this.authService && this.authService.getToken()) {
      console.log('User is authenticated, attempting to fetch cart from server');
      this.getCartFromServer().subscribe(
        cartItems => {
          console.log('Successfully retrieved cart from server, merging with local');
          // Merge server cart with local cart
          this.mergeServerAndLocalCarts(cartItems);
        },
        error => {
          // Silent error handling for auth failures
          console.log('Error fetching cart from server (silent handling)');
        }
      );
    } else {
      console.log('User is not authenticated, using only local cart data');
    }
  }

  // Merge server cart with local cart to ensure no items are lost
  private mergeServerAndLocalCarts(serverItems: CartItem[]): void {
    const localItems = this.getCartItems();
    console.log(`Merging carts: local (${localItems.length} items) with server (${serverItems.length} items)`);
    
    // If we have no local items, just use server items
    if (localItems.length === 0 && serverItems.length > 0) {
      console.log('No local items, using server items only');
      this.cartItemsSubject.next(serverItems);
      localStorage.setItem(this.cartKey, JSON.stringify(serverItems));
      return;
    }
    
    // If we have no server items, push local items to server
    if (serverItems.length === 0 && localItems.length > 0) {
      console.log('No server items, pushing local items to server');
      this.saveCartToServer(localItems).subscribe(
        () => console.log('Successfully pushed local cart to server'),
        error => console.log('Error pushing local cart to server (silent handling)')
      );
      return;
    }
    
    // If we have both, merge them
    if (serverItems.length > 0 && localItems.length > 0) {
      console.log('Both local and server carts have items, merging them');
      const mergedItems: CartItem[] = [...localItems];
      let itemsAdded = 0;
      let itemsUpdated = 0;
      
      // Add or update items from server
      serverItems.forEach(serverItem => {
        const existingItemIndex = mergedItems.findIndex(
          item => item.product.id === serverItem.product.id
        );
        
        if (existingItemIndex >= 0) {
          // Item exists in both carts, take the highest quantity
          const oldQuantity = mergedItems[existingItemIndex].quantity;
          mergedItems[existingItemIndex].quantity = Math.max(
            oldQuantity,
            serverItem.quantity
          );
          
          if (mergedItems[existingItemIndex].quantity > oldQuantity) {
            itemsUpdated++;
          }
        } else {
          // Item only exists in server cart, add it
          mergedItems.push(serverItem);
          itemsAdded++;
        }
      });
      
      console.log(`Merge complete: ${itemsAdded} items added, ${itemsUpdated} items updated`);
      
      // Update both local storage and server
      this.cartItemsSubject.next(mergedItems);
      localStorage.setItem(this.cartKey, JSON.stringify(mergedItems));
      
      // Only save to server if there were changes
      if (itemsAdded > 0 || itemsUpdated > 0) {
        console.log('Changes detected, saving merged cart to server');
        this.saveCartToServer(mergedItems).subscribe(
          () => console.log('Successfully saved merged cart to server'),
          error => console.log('Error saving merged cart to server (silent handling)')
        );
        
        // Notify user that items were merged
        if (itemsAdded > 0) {
          // this.notificationService.info(`${itemsAdded} additional item(s) from your account were added to your cart.`);
        }
      } else {
        console.log('No changes needed, skipping server update');
      }
    }
  }

  private loadLocalCart(): void {
    const savedCart = localStorage.getItem(this.cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          this.cartItemsSubject.next(parsedCart);
        } else {
          this.cartItemsSubject.next([]);
        }
      } catch (e) {
        this.cartItemsSubject.next([]);
      }
    } else {
      this.cartItemsSubject.next([]);
    }
  }

  private saveCart(items: CartItem[]): void {
    // Always save to localStorage for immediate access
    localStorage.setItem(this.cartKey, JSON.stringify(items));
    this.cartItemsSubject.next(items);
    
    // If user is logged in, also save to server
    if (this.authService && this.authService.getToken()) {
      console.log('User is authenticated, saving cart to server');
      this.saveCartToServer(items).subscribe(
        () => {
          console.log('Cart saved to server successfully');
        },
        error => {
          // Silent error handling
          console.log('Error saving cart to server (silent handling)');
        }
      );
    } else {
      // Notification disabled as requested - just set the flag
      if (items.length > 0) {
        // this.notificationService.info('Sign in to sync your cart across devices.', 5000);
        this.syncNotificationShown = true;
      }
    }
  }

  getCartItems(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }

  getCartCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((sum, item) => sum + item.quantity, 0))
    );
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentItems = this.getCartItems();
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      this.notificationService.success(`Added another ${product.name} to your cart.`);
    } else {
      const newItem: CartItem = {
        product: product,
        quantity: quantity
      };
      currentItems.push(newItem);
      this.notificationService.success(`${product.name} added to your cart!`);
      
      // Sync notification disabled as requested
      if (!(this.authService && this.authService.getToken()) && !this.syncNotificationShown && currentItems.length > 1) {
        setTimeout(() => {
          // this.notificationService.info('Sign in to sync your cart across all your devices.', 6000);
          this.syncNotificationShown = true;
        }, 2000); 
      }
    }

    this.saveCart(currentItems);
  }

  updateItemQuantity(productId: number, quantity: number): void {
    const currentItems = this.getCartItems();
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      const product = currentItems[itemIndex].product;
      const oldQuantity = currentItems[itemIndex].quantity;
      
      currentItems[itemIndex].quantity = quantity;
      this.saveCart(currentItems);
      
      if (quantity > oldQuantity) {
        this.notificationService.info(`Updated ${product.name} quantity to ${quantity}.`);
      }
    }
  }

  removeFromCart(productId: number): void {
    const currentItems = this.getCartItems();
    const itemToRemove = currentItems.find(item => item.product.id === productId);
    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    
    this.saveCart(updatedItems);
    
    if (itemToRemove) {
      this.notificationService.info(`${itemToRemove.product.name} removed from your cart.`);
    }
  }

  clearCart(): void {
    this.saveCart([]);
    this.notificationService.info('Your cart has been cleared.');
  }

  // Server integration methods
  private getCartFromServer(): Observable<CartItem[]> {
    // More strict check to avoid API calls completely when not logged in
    if (!this.isUserLoggedIn()) {
      console.log('User not authenticated, skipping server cart fetch');
      return of([]); // Return empty array if not logged in
    }

    return this.apiService.get<any>('cart').pipe(
      map(response => {
        if (response && response.items) {
          console.log('Successfully retrieved cart from server with', response.items.length, 'items');
          return response.items.map((item: any) => ({
            product: item.product,
            quantity: item.quantity
          }));
        }
        return [];
      }),
      catchError(error => {
        // Silent error handling
        console.log('Error fetching cart from server (silent handling)');
        return of([]);
      })
    );
  }

  private saveCartToServer(items: CartItem[]): Observable<any> {
    // More strict check to avoid API calls completely when not logged in
    if (!this.isUserLoggedIn()) {
      console.log('User not authenticated, skipping server cart save');
      return of(null); // Return empty observable if not logged in
    }

    const cartData = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };
    
    return this.apiService.post('cart', cartData).pipe(
      tap(() => console.log('Successfully saved cart to server')),
      catchError(error => {
        // Silent error handling
        console.log('Error saving cart to server (silent handling)');
        return of(null);
      })
    );
  }

  private syncCartWithServer(): void {
    // More strict check to avoid API calls completely when not logged in
    if (!this.authService || !this.authService.getToken()) {
      console.log('User not authenticated, skipping cart sync');
      return;
    }

    console.log('User is logged in, attempting to sync cart with server');
    
    // No sync notification - removed as requested
    
    // Get server cart
    this.getCartFromServer().subscribe(
      serverItems => {
        console.log('Retrieved cart from server for sync, merging with local cart');
        
        // Check if server has items
        if (serverItems.length > 0) {
          // Merge with local items
          this.mergeServerAndLocalCarts(serverItems);
          
          // No success notification - removed as requested
        } else {
          console.log('No items in server cart');
          
          // If local cart has items, push them to server
          const localItems = this.getCartItems();
          if (localItems.length > 0) {
            this.saveCartToServer(localItems).subscribe(
              () => {
                console.log('Successfully pushed local cart to server');
                // Changed notification to be less intrusive
                // this.notificationService.success('Your cart has been saved to your account!', 4000);
              },
              error => console.log('Error pushing local cart to server (silent handling)')
            );
          }
        }
      },
      error => {
        // Silent error handling for all errors
        console.log('Error during cart sync (silent handling)');
      }
    );
  }

  checkout(): Observable<any> {
    if (!this.isUserLoggedIn()) {
      this.notificationService.warning('Please sign in to complete your purchase.', 5000);
      return of(null);
    }
    
    return this.apiService.post('orders', {}).pipe(
      tap(() => this.clearCart())
    );
  }
}
