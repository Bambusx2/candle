import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product, CandleCategory, Category } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product: Product = {
    id: 0,
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    category: {
      id: 1,
      name: 'Scented'
    },
    scent: '',
    burnTime: '',
    size: '',
    weight: '',
    inStock: true,
    rating: 0,
    reviewCount: 0
  };
  @Output() addedToCart = new EventEmitter<Product>();

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  addToCart(event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(this.product);
    this.addedToCart.emit(this.product);
  }

  viewDetails(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/products', this.product.id]);
  }

  // Helper for star rating display
  get ratingArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }
} 