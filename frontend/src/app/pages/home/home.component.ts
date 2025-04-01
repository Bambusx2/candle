import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  bestSellers: Product[] = [];
  newArrivals: Product[] = [];
  isLoading: boolean = true;
  emailSubscription: string = '';
  subscribeMessage: string = '';
  showSubscribeMessage: boolean = false;
  error: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    console.log('Loading home page products...');
    
    // Using forkJoin to handle all product loading in parallel
    forkJoin({
      featured: this.productService.getFeaturedProducts().pipe(
        catchError(err => {
          console.error('Error loading featured products:', err);
          return of([]);
        })
      ),
      bestsellers: this.productService.getBestSellers().pipe(
        catchError(err => {
          console.error('Error loading bestsellers:', err);
          return of([]);
        })
      ),
      newArrivals: this.productService.getNewArrivals().pipe(
        catchError(err => {
          console.error('Error loading new arrivals:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (results) => {
        console.log('Featured products loaded:', results.featured.length);
        console.log('Best sellers loaded:', results.bestsellers.length);
        console.log('New arrivals loaded:', results.newArrivals.length);
        
        this.featuredProducts = results.featured;
        this.bestSellers = results.bestsellers;
        this.newArrivals = results.newArrivals;
        this.isLoading = false;
        
        if (this.bestSellers.length === 0) {
          console.warn('No best sellers were returned from the API');
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error = 'Unable to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  addToCart(product: Product): void {
    // The product-card component already added the item to cart,
    // so we just need to log or handle any home-specific logic
    console.log(`Product "${product.name}" added to cart from home page`);
    // Don't call this.cartService.addToCart(product) again to avoid duplicates
  }

  submitSubscription(): void {
    if (this.emailSubscription && this.validateEmail(this.emailSubscription)) {
      // In a real app, this would call a service to submit the email
      this.subscribeMessage = 'Thank you for subscribing! Check your inbox for a special welcome gift.';
      this.showSubscribeMessage = true;
      this.emailSubscription = '';
      
      // Hide the message after 5 seconds
      setTimeout(() => {
        this.showSubscribeMessage = false;
      }, 5000);
    } else {
      this.subscribeMessage = 'Please enter a valid email address.';
      this.showSubscribeMessage = true;
      
      // Hide the error message after 3 seconds
      setTimeout(() => {
        this.showSubscribeMessage = false;
      }, 3000);
    }
  }
  
  private validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }
}
