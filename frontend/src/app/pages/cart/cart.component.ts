import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CartItem } from '../../models/cart-item';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

interface PromoCodeMap {
  [key: string]: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  isLoading = true;
  subtotal = 0;
  tax = 0;
  shipping = 5.99;
  freeShippingThreshold = 75;
  total = 0;
  quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  promoCode = '';
  promoDiscount = 0;
  promoApplied = false;
  promoError = '';
  
  private cartSubscription: Subscription | null = null;
  
  // Valid promo codes for testing
  validPromoCodes: PromoCodeMap = {
    'WELCOME10': 10,
    'CANDLE20': 20,
    'FREESHIP': 5.99 // Value of shipping
  };

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    public router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      if (items && items.length >= 0) {
        console.log('Cart updated with', items.length, 'items');
        this.cartItems = items;
        this.updateCartTotals();
        this.isLoading = false;
      }
    });
    
    // Initial load
    this.loadCartItems();
  }
  
  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCartItems(): void {
    this.isLoading = true;
    
    // Get cart data immediately from the service's current value
    const currentCartItems = this.cartService.getCartItems();
    
    if (currentCartItems && currentCartItems.length > 0) {
      console.log('Immediately loading', currentCartItems.length, 'cart items');
      this.cartItems = currentCartItems;
      this.updateCartTotals();
      this.isLoading = false;
    } else {
      // If no items are immediately available, wait a short time for async operations to complete
      setTimeout(() => {
        const items = this.cartService.getCartItems();
        
        if (!this.cartItems.length && items.length > 0) {
          console.log('Loading cart items after delay:', items.length, 'items');
          this.cartItems = items;
          this.updateCartTotals();
        }
        
        this.isLoading = false;
      }, 500);
    }
  }

  updateCartTotals(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity, 
      0
    );
    
    this.tax = Number((this.subtotal * 0.08).toFixed(2)); // 8% tax rate, fixed to 2 decimals
    
    // Free shipping if subtotal is above threshold
    this.shipping = this.subtotal >= this.freeShippingThreshold ? 0 : 5.99;
    
    this.calculateTotal();
  }

  calculateTotal(): void {
    // Use Number().toFixed() to avoid floating point issues
    this.total = Number((this.subtotal + this.tax + this.shipping - this.promoDiscount).toFixed(2));
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    // Convert to number to ensure proper comparison
    newQuantity = Number(newQuantity);
    
    if (newQuantity === 0) {
      this.removeFromCart(item);
      return;
    }
    
    if (newQuantity > 0) {
      this.cartService.updateItemQuantity(item.product.id, newQuantity);
      item.quantity = newQuantity;
      this.updateCartTotals();
    }
  }

  removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item.product.id);
    // We don't need to manually filter since we're subscribing to cartItems$
  }

  clearCart(): void {
    if (this.cartItems.length === 0) return;
    
    if (confirm('Are you sure you want to remove all items from your cart?')) {
      this.cartService.clearCart();
      this.resetPromoCode();
    }
  }

  applyPromoCode(): void {
    this.promoError = '';
    
    if (!this.promoCode.trim()) {
      this.promoError = 'Please enter a promo code';
      return;
    }
    
    const code = this.promoCode.trim().toUpperCase();
    
    if (this.validPromoCodes[code] !== undefined) {
      this.promoDiscount = this.validPromoCodes[code];
      this.promoApplied = true;
      this.calculateTotal();
    } else {
      this.promoError = 'Invalid promo code';
      this.promoDiscount = 0;
      this.promoApplied = false;
      this.calculateTotal();
    }
  }

  resetPromoCode(): void {
    this.promoCode = '';
    this.promoDiscount = 0;
    this.promoApplied = false;
    this.promoError = '';
    this.calculateTotal();
  }

  checkout(): void {
    if (!this.isLoggedIn) {
      // Redirect to login if not authenticated
      this.notificationService.warning('Please sign in to complete your purchase', 5000);
      setTimeout(() => {
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: '/cart' } 
        });
      }, 1000);
      return;
    }
    
    // In a real app, this would navigate to a checkout page or process the order
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  // Helper methods for the template
  get isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  get isLoggedIn(): boolean {
    try {
      return this.authService.isLoggedIn();
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  get isFreeShipping(): boolean {
    return this.subtotal >= this.freeShippingThreshold;
  }

  get remainingForFreeShipping(): number {
    return Number((this.freeShippingThreshold - this.subtotal).toFixed(2));
  }

  get isCheckoutDisabled(): boolean {
    return this.isCartEmpty;
  }
}
