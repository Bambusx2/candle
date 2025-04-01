import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product, CandleCategory } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: Product | undefined;
  quantity: number = 1;
  isLoading: boolean = true;
  relatedProducts: Product[] = [];
  activeImage: string = '';
  quantityOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  activeTab: string = 'description';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const productId = Number(params.get('id'));
      this.loadProduct(productId);
    });
  }

  ngAfterViewInit(): void {
    // Initialize tabs after view is initialized
    setTimeout(() => this.initializeTabs(), 100);
  }

  initializeTabs(): void {
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Hide all tab contents except the active one
    tabContents.forEach(content => {
      if (content.id !== `panel-${this.activeTab}`) {
        (content as HTMLElement).style.display = 'none';
      }
    });
  }

  switchTab(tabName: string, event: Event): void {
    // Prevent default link behavior
    event.preventDefault();
    
    this.activeTab = tabName;
    
    // Update active class on tab headers
    const tabHeaders = document.querySelectorAll('.tab-header');
    tabHeaders.forEach(header => {
      header.classList.remove('active');
      header.setAttribute('aria-selected', 'false');
    });
    
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
      selectedTab.classList.add('active');
      selectedTab.setAttribute('aria-selected', 'true');
    }
    
    // Show selected tab content, hide others
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      (content as HTMLElement).style.display = 'none';
    });
    
    const selectedContent = document.getElementById(`panel-${tabName}`);
    if (selectedContent) {
      (selectedContent as HTMLElement).style.display = 'block';
    }
  }

  loadProduct(productId: number): void {
    this.isLoading = true;
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        if (!product) {
          this.router.navigate(['/products']);
          return;
        }
        
        this.product = product;
        this.activeImage = product.imageUrl;
        this.isLoading = false;
        
        // Get related products from the same category
        this.loadRelatedProducts(product.category);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  loadRelatedProducts(category: any): void {
    // Make sure to pass the category ID properly
    const categoryId = typeof category === 'object' ? category.id : category;
    
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (response) => {
        this.relatedProducts = response.content
          .filter((p: Product) => p.id !== this.product?.id)
          .slice(0, 4);
      },
      error: (err) => console.error('Error loading related products:', err)
    });
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      
      // If the user clicks "Go to Cart" button, we'll navigate them there
      if (this.quantity > 1) {
        setTimeout(() => {
          this.goToCart();
        }, 1000);
      }
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  get ratingArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  getCategoryName(): string {
    if (!this.product || !this.product.category) return '';
    
    return typeof this.product.category === 'object' && this.product.category.name 
      ? this.product.category.name 
      : String(this.product.category);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
