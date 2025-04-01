import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service'; 
import { Product, CandleCategory } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { debounceTime, distinctUntilChanged, switchMap, take, delay } from 'rxjs/operators';
import { Subject, Observable, Subscription } from 'rxjs';
import { fromEvent } from 'rxjs';

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  isLoading: boolean = true;
  error: string = '';
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 12;
  totalPages: number = 0;
  totalElements: number = 0;
  
  // Filter states
  selectedCategoryId: number | null = null;
  minPrice: number = 0;
  maxPrice: number = 200;
  searchQuery: string = '';
  sortOption: string = 'id,asc';
  showFilters: boolean = false;
  
  // Single slider state
  isDragging: boolean = false;
  
  // For search debounce
  private searchSubject = new Subject<string>();
  
  // Subscriptions
  private queryParamsSub?: Subscription;
  private routeSub?: Subscription;
  
  // Enhanced filter properties
  minPriceFilter: number = 0;
  maxPriceFilter: number = 200;
  selectedRating: number | null = null;
  priceDistribution: {minPrice: number, maxPrice: number, count: number, height: number}[] = [];
  isMobile: boolean = false;
  
  // Store rating counts for the filter display
  ratingCounts: { [key: number]: number } = {};
  
  // New properties
  private sliderDebounceTime = 300; // ms
  private searchDebounceTime = 400; // ms
  private resizeObserver: ResizeObserver | null = null;
  private debouncePriceTimer: any;
  
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if mobile device on component init
    this.checkIfMobile();
    
    // Listen for window resize events to update mobile status
    window.addEventListener('resize', () => {
      this.checkIfMobile();
    });
    
    // Set up search debounce
    this.setupSearchDebounce();
    
    // Load categories and initialize filters
    this.loadCategories();
    this.initializeFilters();
    
    // Set up query parameter subscription
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      // Get category from URL parameters if present
      if (params['category']) {
        this.selectedCategoryId = +params['category'];
      }
      
      // Get search query if present
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      
      // Get price range if present
      if (params['minPrice']) {
        this.minPriceFilter = +params['minPrice'];
      }
      
      if (params['maxPrice']) {
        this.maxPriceFilter = +params['maxPrice'];
      }
      
      // Get rating filter if present
      if (params['rating']) {
        this.selectedRating = +params['rating'];
      }
      
      // Get sort option if present
      if (params['sort']) {
        this.sortOption = params['sort'];
      }
      
      // Get current page if present
      if (params['page']) {
        this.currentPage = +params['page'];
      }
      
      // Load products based on URL parameters
      this.loadProducts();
    });
    
    // Generate price distribution data when component initializes
    this.generatePriceDistribution();
    
    // Subscribe to route changes to update category
    this.routeSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.selectedCategoryId = +params['id'];
        this.loadProducts();
      }
    });
    
    // Set up responsive observation
    this.setupResponsiveObservation();
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    window.removeEventListener('resize', () => this.checkIfMobile());
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // Method to check if viewing on mobile device
  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(this.searchDebounceTime),
      distinctUntilChanged(),
    ).subscribe(searchQuery => {
      // Update the component's searchQuery property
      this.searchQuery = searchQuery;
      
      // Always update query params to ensure URL reflects the current state
      this.updateQueryParams();
    });
  }

  loadCategories(): void {
    console.log('Loading categories and setting up counts');
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        console.log('Received categories:', categories);
        // Initialize category counts to 0 (we'll get actual counts next)
        categories.forEach(category => {
          category.productCount = 0;
        });
        
        // First, get all products to count by category
        this.productService.getAllProducts(0, 1000).pipe(take(1)).subscribe({
          next: (response: any) => {
            const allProducts = response.content || [];
            console.log(`Loaded ${allProducts.length} products for category counts`);
            
            if (allProducts.length === 0) {
              console.warn('No products available for counting categories');
              this.categories = categories;
              return;
            }
            
            // Count products per category
            categories.forEach(category => {
              const count = allProducts.filter((product: any) => {
                const prodCategory = typeof product.category === 'object' 
                  ? Number(product.category.id) 
                  : Number(product.category);
                return prodCategory === Number(category.id);
              }).length;
              
              // Always update the count with actual value
              category.productCount = count;
              console.log(`Category ${category.name} (ID: ${category.id}): ${category.productCount} products`);
            });
            
            // Calculate rating counts (5, 4, 3 stars)
            this.ratingCounts = {};
            [5, 4, 3, 2, 1].forEach(rating => {
              this.ratingCounts[rating] = allProducts.filter((product: any) => 
                (product.rating || 0) >= rating
              ).length;
              console.log(`Rating ${rating}+: ${this.ratingCounts[rating]} products`);
            });
            
            this.categories = categories;
          },
          error: (err) => {
            console.error('Error loading products for category counts:', err);
            // Don't set random counts, just leave them as 0
            this.categories = categories;
          }
        });
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Unable to load categories';
        this.loadProducts();
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    console.log('Loading products with filters:', {
      category: this.selectedCategoryId ? `${this.selectedCategoryId} (${typeof this.selectedCategoryId})` : 'none',
      minPrice: this.minPriceFilter,
      maxPrice: this.maxPriceFilter,
      rating: this.selectedRating,
      search: this.searchQuery,
      sort: this.sortOption,
      page: this.currentPage
    });
    
    // Determine the sort params for API
    const sort = this.getSortParam();
    
    // Choose the appropriate API method based on search criteria
    let productsObservable: Observable<any>;
    
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      console.log(`Searching products with term: "${this.searchQuery}"`);
      productsObservable = this.productService.searchProducts(
        this.searchQuery, 
        this.currentPage, 
        this.pageSize
      );
    } else if (this.selectedCategoryId !== null && this.selectedCategoryId !== undefined) {
      // Convert to number to ensure consistent type
      const categoryId = Number(this.selectedCategoryId);
      console.log(`Loading products for category ID: ${categoryId} (converted from ${this.selectedCategoryId})`);
      
      productsObservable = this.productService.getProductsByCategory(
        categoryId,
        this.currentPage,
        this.pageSize,
        sort
      );
    } else {
      console.log('Loading all products');
      productsObservable = this.productService.getAllProducts(
        this.currentPage,
        this.pageSize,
        sort
      );
    }
    
    console.log('Subscribing to products observable');
    productsObservable.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (!response || !response.content) {
          console.error('Invalid response format:', response);
          this.error = 'Received invalid data from server';
          this.products = [];
          this.filteredProducts = [];
          this.totalElements = 0;
          return;
        }
        
        console.log(`Received response with ${response.content.length} products`);
        
        // Log first few products for debugging
        if (response.content.length > 0) {
          console.log('Sample products:');
          response.content.slice(0, Math.min(3, response.content.length)).forEach((p: any) => {
            console.log(`- Product ${p.id}: ${p.name}, category=${typeof p.category === 'object' ? p.category.id : p.category}`);
          });
        } else {
          console.warn('No products were returned from the API');
        }
        
        this.products = response.content;
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        
        console.log(`Loaded ${this.products.length} products from server, total: ${this.totalElements}`);
        
        // Apply client-side filtering for price and rating
        this.applyFilters();
        
        // Log the filtered products count
        console.log(`After all filters applied: displaying ${this.filteredProducts.length} products`);
        
        // Preload next page for better UX
        this.preloadNextPageImages();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.error = 'Failed to load products. Please try again.';
        console.error('Error loading products:', error);
        this.products = [];
        this.filteredProducts = [];
        this.totalElements = 0;
      }
    });
  }
  
  // Filter products by price
  filterByPrice(products: Product[]): Product[] {
    if (!products) return [];
    
    return products.filter(product => 
      product.price >= this.minPriceFilter && 
      product.price <= this.maxPriceFilter
    );
  }
  
  // Sort products based on current sort option
  sortProducts(products: Product[]): Product[] {
    // Create a copy to avoid modifying the original array
    const sortedProducts = [...products];
    
    // Sort based on the current sort option
    if (this.sortOption === 'price,asc') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'price,desc') {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'rating,desc') {
      sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.sortOption === 'createdAt,desc') {
      sortedProducts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    return sortedProducts;
  }
  
  handleProductResponse(response: PageResponse<Product>): void {
    this.products = response.content || [];
    this.filteredProducts = response.content || [];
    this.totalPages = response.totalPages || 0;
    this.totalElements = response.totalElements || 0;
    this.isLoading = false;
  }
  
  handleProductError(error: any): void {
    console.error('Error loading products:', error);
    this.error = 'Unable to load products. Please try again later.';
    this.isLoading = false;
    this.products = [];
    this.filteredProducts = [];
  }
  
  updateFilters(): void {
    console.log("Updating filters, sort option:", this.sortOption);
    this.currentPage = 0;
    this.updateQueryParams();
  }
  
  // Method to handle category change with radio buttons
  onCategoryChange(categoryId: number): void {
    console.log(`Category change event with ID: ${categoryId} of type ${typeof categoryId}`);
    
    // Explicitly convert to number to ensure consistent type
    const numericCategoryId = Number(categoryId);
    console.log(`Converted to numeric category ID: ${numericCategoryId}`);
    
    // Toggle the category if it's already selected (compare as numbers)
    const currentSelectedId = Number(this.selectedCategoryId);
    
    console.log(`Current selected category: ${currentSelectedId} of type ${typeof this.selectedCategoryId}`);
    console.log(`Comparing: current=${currentSelectedId} with selected=${numericCategoryId}`);
    
    if (currentSelectedId === numericCategoryId) {
      console.log('Deselecting current category');
      this.selectedCategoryId = null;
    } else {
      console.log(`Selecting new category: ${numericCategoryId}`);
      this.selectedCategoryId = numericCategoryId;
    }
    
    // Reset to first page when changing category
    this.currentPage = 0;
    
    // Force direct loading of products to ensure we see changes immediately
    console.log(`Selected category is now: ${this.selectedCategoryId}`);
    
    // This is more reliable than waiting for the queryParams subscription
    if (this.selectedCategoryId !== null) {
      console.log(`Loading products for selected category: ${this.selectedCategoryId}`);
      
      this.isLoading = true;
      this.productService.getProductsByCategory(
        this.selectedCategoryId,
        this.currentPage,
        this.pageSize,
        this.sortOption
      ).subscribe({
        next: (response) => {
          console.log(`Got ${response.content?.length || 0} products directly for category ${this.selectedCategoryId}`);
          
          if (!response.content || response.content.length === 0) {
            console.warn(`No products returned for category ${this.selectedCategoryId}`);
          }
          
          // Store the original products
          this.products = response.content || [];
          
          // Apply any other filters (price, rating, search)
          this.applyFilters();
          
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading category products: ', err);
          this.error = `Failed to load products for category ${this.selectedCategoryId}`;
          this.isLoading = false;
          this.products = [];
          this.filteredProducts = [];
        }
      });
    } else {
      // Update URL and load all products
      console.log('No category selected, loading all products');
      this.loadProducts();
    }
    
    // Update URL parameters 
    this.updateQueryParams();
    
    // Update visual indication for radio buttons
    setTimeout(() => {
      const radioInputs = document.querySelectorAll('input[name="category"]');
      radioInputs.forEach((input: Element) => {
        const radio = input as HTMLInputElement;
        const radioValue = Number(radio.value);
        if (radioValue === this.selectedCategoryId) {
          radio.checked = true;
          console.log(`Setting radio button ${radioValue} to checked`);
        } else {
          radio.checked = false;
        }
      });
    }, 0);
  }
  
  clearFilters(): void {
    // Reset all filter values
    this.selectedCategoryId = null;
    this.minPriceFilter = this.minPrice;
    this.maxPriceFilter = this.maxPrice;
    this.selectedRating = null;
    this.searchQuery = '';
    this.sortOption = 'id,asc';
    this.currentPage = 0;
    
    // Reset the search input field explicitly
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Important: Navigate with completely empty query params to clear everything
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    }).then(() => {
      // Update slider appearance
      setTimeout(() => {
        this.updateSliderBackground();
      });
      
      // Load products with cleared filters
      this.loadProducts();
    });
  }
  
  // Legacy method - keeping for compatibility
  setCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId === this.selectedCategoryId ? null : categoryId;
    this.currentPage = 0;
    this.updateQueryParams();
  }
  
  updateSearch(): void {
    // Reset to first page when search changes
    this.currentPage = 0;
    
    // Trim the search query
    if (this.searchQuery) {
      this.searchQuery = this.searchQuery.trim();
    }
    
    // Pass the query to the search subject for debouncing
    this.searchSubject.next(this.searchQuery || '');
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updateQueryParams();
    }
  }
  
  // Convert UI-friendly sort options to API-friendly sort parameters
  getSortParam(): string {
    return this.sortOption;
  }
  
  updateQueryParams(): void {
    // Only include parameters that are actually set (non-default values)
    const queryParams: any = {};
    
    // Only add page if not on first page
    if (this.currentPage > 0) {
      queryParams.page = this.currentPage;
    }
    
    // Only add sort if not default
    if (this.sortOption !== 'id,asc') {
      queryParams.sort = this.sortOption;
    }
    
    // Only add price filters if they differ from min/max
    if (this.minPriceFilter > this.minPrice) {
      queryParams.minPrice = this.minPriceFilter;
    }
    
    if (this.maxPriceFilter < this.maxPrice) {
      queryParams.maxPrice = this.maxPriceFilter;
    }
    
    // Only add category if selected
    if (this.selectedCategoryId) {
      queryParams.category = this.selectedCategoryId;
    }
    
    // Only add rating if selected
    if (this.selectedRating !== null) {
      queryParams.rating = this.selectedRating;
    }
    
    // Only add search if not empty
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      queryParams.search = this.searchQuery.trim();
    }
    
    // Use replaceUrl to avoid browser history stacking
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      // Don't merge with existing params, replace them entirely
      queryParamsHandling: null,
      replaceUrl: true
    }).then(() => {
      this.loadProducts();
    });
  }
  
  addToCart(product: Product): void {
    // Don't need to call cartService.addToCart here since the product-card already does it
    // This is just a handler for the event
    console.log(`Product ${product.name} added to cart`);
  }

  // Handle sort selection change
  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortOption = select.value;
    this.currentPage = 0;
    this.updateQueryParams();
  }

  initializeFilters() {
    console.log('Initializing filters with default values');
    // Default min and max price values (will be replaced when products load)
    this.minPrice = 0;
    this.maxPrice = 50;
    this.maxPriceFilter = this.maxPrice;
    
    this.productService.getAllProducts().subscribe({
      next: (response: any) => {
        const products = response.content || [];
        if (products.length > 0) {
          // Calculate actual min and max prices from products
          const prices = products.map((p: any) => p.price);
          
          // Always round to nearest whole numbers for better UX
          const newMin = 0; // For a single slider, we always start at 0
          const newMax = Math.ceil(Math.max(...prices));
          
          console.log(`Price range detected: ${newMin} - ${newMax}`);
          
          // Only update if we got valid values
          if (newMin < newMax) {
            this.minPrice = newMin;
            this.maxPrice = newMax;
            
            // Only reset max filter value if it's outside the new range
            if (this.maxPriceFilter > newMax) {
              this.maxPriceFilter = newMax;
            }
            
            console.log(`Filter set to max: ${this.maxPriceFilter}`);
            
            // Set the slider UI elements
            setTimeout(() => {
              this.updateSliderBackground();
            }, 100);
          }
        }
        
        // Always load products at the end
        this.loadProducts();
      },
      error: (err: any) => {
        console.error('Error fetching products for price range', err);
        // Still load products even if price range calculation fails
        this.loadProducts();
      }
    });
  }
  
  // A method to update the slider UI
  updateSliderUI(): void {
    // Calculate the percentage positions for the minimum and maximum price handles
    const minPercentage = ((this.minPriceFilter - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
    const maxPercentage = ((this.maxPriceFilter - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
    
    // Update the min handle position
    const minHandle = document.querySelector('.min-handle') as HTMLElement;
    if (minHandle) {
      minHandle.style.left = `${minPercentage}%`;
    }
    
    // Update the max handle position
    const maxHandle = document.querySelector('.max-handle') as HTMLElement;
    if (maxHandle) {
      maxHandle.style.left = `${maxPercentage}%`;
    }
    
    // Update the range track (the colored part between the two handles)
    const sliderRange = document.querySelector('.slider-range') as HTMLElement;
    if (sliderRange) {
      sliderRange.style.left = `${minPercentage}%`;
      sliderRange.style.width = `${maxPercentage - minPercentage}%`;
    }
    
    console.log(`Slider UI updated: min=${minPercentage}%, max=${maxPercentage}%`);
  }

  // Method to update the slider background (track and range)
  updateSliderBackground(): void {
    console.log('Updating slider background elements');
    
    // For dual handle slider, we use updateSliderUI to maintain consistency
    this.updateSliderUI();
    
    // If needed, also update the tooltips or labels
    const minPriceLabel = document.querySelector('.min-price-label') as HTMLElement;
    if (minPriceLabel) {
      minPriceLabel.textContent = `$${this.minPriceFilter}`;
    }
    
    const maxPriceLabel = document.querySelector('.max-price-label') as HTMLElement;
    if (maxPriceLabel) {
      maxPriceLabel.textContent = `$${this.maxPriceFilter}`;
    }
  }

  // Start dragging the slider handles
  startDragging(event: MouseEvent | TouchEvent, handle: 'min' | 'max'): void {
    // Prevent default browser behavior
    event.preventDefault();
    
    // Set dragging flag to true
    this.isDragging = true;
    
    // Get the slider track element
    const sliderTrack = document.querySelector('.slider-track') as HTMLElement;
    if (!sliderTrack) return;
    
    // Get the handle element
    const handleElement = handle === 'min' 
      ? document.querySelector('.min-handle') as HTMLElement
      : document.querySelector('.max-handle') as HTMLElement;
      
    // Add dragging class
    handleElement?.classList.add('dragging');
    
    // Get the slider track bounds
    const trackRect = sliderTrack.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackLeft = trackRect.left;
    
    // Define event handlers
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      
      // Get the client X coordinate from mouse or touch event
      let clientX: number;
      if ((moveEvent as TouchEvent).touches) {
        clientX = (moveEvent as TouchEvent).touches[0].clientX;
      } else {
        clientX = (moveEvent as MouseEvent).clientX;
      }
      
      // Calculate the position ratio relative to the track
      let positionRatio = (clientX - trackLeft) / trackWidth;
      
      // Clamp the position ratio between 0 and 1
      positionRatio = Math.max(0, Math.min(1, positionRatio));
      
      // Calculate the new price value based on the position ratio
      const priceRange = this.maxPrice - this.minPrice;
      const newPrice = Math.round(this.minPrice + positionRatio * priceRange);
      
      // Update min or max price based on which handle is being dragged
      if (handle === 'min') {
        // Ensure minPrice doesn't exceed maxPrice - 1
        this.minPriceFilter = Math.min(newPrice, this.maxPriceFilter - 1);
      } else {
        // Ensure maxPrice doesn't go below minPrice + 1
        this.maxPriceFilter = Math.max(newPrice, this.minPriceFilter + 1);
      }
      
      // Update the UI
      this.updateSliderBackground();
    };
    
    const handleEnd = () => {
      this.isDragging = false;
      
      // Remove dragging class
      handleElement?.classList.remove('dragging');
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      
      // Apply filters and update query params
      this.applyFilters();
      this.updateQueryParams();
    };
    
    // Add event listeners for move and end events
    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  }

  // Handle min price input change
  onMinPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = Number(input.value);
    
    // Ensure minPrice doesn't exceed maxPrice
    this.minPriceFilter = Math.min(newValue, this.maxPriceFilter - 1);
    
    // Update the UI
    this.updateSliderBackground();
    
    // Apply filters and update query params
    this.applyFilters();
    this.updateQueryParams();
  }

  // Handle max price input change
  onMaxPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = Number(input.value);
    
    // Ensure maxPrice doesn't go below minPrice
    this.maxPriceFilter = Math.max(newValue, this.minPriceFilter + 1);
    
    // Update the UI
    this.updateSliderBackground();
    
    // Apply filters and update query params
    this.applyFilters();
    this.updateQueryParams();
  }
  
  // Debounce filter application for slider
  debounceFilters(): void {
    if (this.debouncePriceTimer) {
      clearTimeout(this.debouncePriceTimer);
    }
    
    // Only update the slider UI, don't trigger filter application during dragging
    this.updateSliderBackground();
    
    this.debouncePriceTimer = setTimeout(() => {
      // Only apply filters when user stops dragging or after sufficient pause
      this.applyFilters();
    }, this.sliderDebounceTime); // Increased time to prevent frequent updates
  }
  
  stopDragging(): void {
    this.isDragging = false;
  }

  // Check if any filters are currently applied
  isFiltersApplied(): boolean {
    return this.selectedCategoryId !== null || 
           this.minPriceFilter > this.minPrice ||
           this.maxPriceFilter < this.maxPrice ||
           this.selectedRating !== null ||
           (this.searchQuery !== undefined && this.searchQuery !== '');
  }

  // Method to check if a price range overlaps with current filter
  isPriceInRange(min: number, max: number): boolean {
    return min <= this.maxPriceFilter && max >= this.minPriceFilter;
  }

  // Get count of products in each category
  getCategoryCount(categoryId: number): number {
    // Check first if the category has a productCount property
    const category = this.categories.find(c => c.id === categoryId);
    if (category && category.productCount !== undefined) {
      return category.productCount;
    }
    
    // Count manually from available products if needed
    if (this.products && this.products.length > 0) {
      const count = this.products.filter(product => {
        // Handle different ways the category could be stored
        let prodCategoryId;
        
        if (typeof product.category === 'object' && product.category !== null) {
          prodCategoryId = Number(product.category.id);
        } else if ('categoryId' in product) {
          // Handle API response format where categoryId is a direct property
          prodCategoryId = Number((product as any).categoryId);
        } else {
          prodCategoryId = Number(product.category);
        }
        
        return prodCategoryId === Number(categoryId);
      }).length;
      
      return count;
    }
    
    // Return 0 if no products found in this category
    return 0;
  }

  // Get count of products with specific rating or higher
  getRatingCount(rating: number): number {
    // Check if we have product rating counts cached
    if (this.ratingCounts && this.ratingCounts[rating] !== undefined) {
      return this.ratingCounts[rating];
    }
    
    // Fallback to counting from the local products array
    if (!this.products || this.products.length === 0) return 0;
    return this.products.filter(product => (product.rating || 0) >= rating).length;
  }

  // Set rating filter
  setRating(rating: number): void {
    this.selectedRating = this.selectedRating === rating ? null : rating;
    this.currentPage = 0;
    this.updateQueryParams();
  }

  // Apply all filters to current products 
  applyFilters(): void {
    if (this.products.length > 0) {
      console.log('Starting to apply filters to', this.products.length, 'products');
      console.log('Current filters:', {
        category: this.selectedCategoryId ? `${this.selectedCategoryId} (${typeof this.selectedCategoryId})` : 'none',
        minPrice: this.minPriceFilter,
        maxPrice: this.maxPriceFilter,
        rating: this.selectedRating,
        search: this.searchQuery
      });
      
      // Create a deep copy to avoid reference issues
      let newFilteredProducts = [...this.products];
      
      // Apply category filter if selected
      if (this.selectedCategoryId !== null) {
        console.log(`Applying category filter: ${this.selectedCategoryId}`);
        const categoryIdNum = Number(this.selectedCategoryId);
        
        newFilteredProducts = newFilteredProducts.filter(product => {
          let productCategoryId;
          
          // Handle different ways the category could be stored
          if (typeof product.category === 'object' && product.category !== null) {
            productCategoryId = Number(product.category.id);
            console.log(`Product ${product.id} has object category with ID ${productCategoryId}`);
          } else if ('categoryId' in product) {
            // Handle API response format where categoryId is a direct property
            productCategoryId = Number((product as any).categoryId);
            console.log(`Product ${product.id} has direct categoryId property: ${productCategoryId}`);
          } else {
            productCategoryId = Number(product.category);
            console.log(`Product ${product.id} has direct category ID ${productCategoryId}`);
          }
          
          // Log product details for debugging
          console.log(`Product ${product.id}: name=${product.name}, category=${productCategoryId} (${typeof productCategoryId})`);
          
          const match = productCategoryId === categoryIdNum;
          console.log(`Product ${product.id}: comparing category ${productCategoryId} with ${categoryIdNum}, match=${match}`);
          return match;
        });
        
        console.log(`After category filter: ${newFilteredProducts.length} products left`);
      }
      
      // Apply price range filter - now with dual handle slider
      const beforePriceFilter = newFilteredProducts.length;
      newFilteredProducts = newFilteredProducts.filter(product => {
        const inRange = product.price >= this.minPriceFilter && product.price <= this.maxPriceFilter;
        console.log(`Product ${product.id}: price=${product.price}, in range ${this.minPriceFilter}-${this.maxPriceFilter}? ${inRange}`);
        return inRange;
      });
      console.log(`After price filter: ${newFilteredProducts.length} products left (removed ${beforePriceFilter - newFilteredProducts.length})`);
      
      // Apply rating filter if selected
      if (this.selectedRating !== null) {
        const beforeRatingFilter = newFilteredProducts.length;
        newFilteredProducts = newFilteredProducts.filter(product => {
          const ratingMatch = Math.round(product.rating || 0) === this.selectedRating;
          console.log(`Product ${product.id}: rating=${product.rating}, matches ${this.selectedRating}? ${ratingMatch}`);
          return ratingMatch;
        });
        console.log(`After rating filter: ${newFilteredProducts.length} products left (removed ${beforeRatingFilter - newFilteredProducts.length})`);
      }
      
      // Apply search query if provided
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const search = this.searchQuery.toLowerCase();
        const beforeSearchFilter = newFilteredProducts.length;
        newFilteredProducts = newFilteredProducts.filter(product => {
          const nameMatch = product.name.toLowerCase().includes(search);
          const descMatch = product.description && product.description.toLowerCase().includes(search);
          console.log(`Product ${product.id}: search "${search}" in name="${product.name}"? ${nameMatch}, in desc? ${descMatch}`);
          return nameMatch || descMatch;
        });
        console.log(`After search filter: ${newFilteredProducts.length} products left (removed ${beforeSearchFilter - newFilteredProducts.length})`);
      }
      
      // Apply current sort
      newFilteredProducts = this.sortProducts(newFilteredProducts);
      
      // Only update the display after all filtering is done
      // This prevents intermediate states from being displayed
      this.filteredProducts = newFilteredProducts;
      
      console.log(`Final filtered products: ${this.filteredProducts.length} products (from ${this.products.length} total)`);
    } else {
      console.log('No products to filter');
      this.filteredProducts = [];
    }
  }

  // Generate price distribution data for visualization
  generatePriceDistribution(): void {
    this.productService.getAllProducts().pipe(
      take(1)
    ).subscribe({
      next: (response: any) => {
        const products = response.content || [];
        if (products.length === 0) return;
        
        // Create 10 price segments
        const min = Math.floor(Math.min(...products.map((p: any) => p.price)));
        const max = Math.ceil(Math.max(...products.map((p: any) => p.price)));
        const range = max - min;
        const segmentSize = range / 10;
        
        this.priceDistribution = [];
        for (let i = 0; i < 10; i++) {
          const segmentMin = min + (i * segmentSize);
          const segmentMax = min + ((i + 1) * segmentSize);
          
          // Count products in this segment
          const count = products.filter((p: any) => 
            p.price >= segmentMin && p.price <= segmentMax
          ).length;
          
          this.priceDistribution.push({
            minPrice: segmentMin,
            maxPrice: segmentMax,
            count,
            height: 0 // Will be calculated next
          });
        }
        
        // Calculate height percentage for visualization
        const maxCount = Math.max(...this.priceDistribution.map(d => d.count));
        this.priceDistribution.forEach(d => {
          d.height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
        });
      },
      error: (err) => console.error('Error generating price distribution', err)
    });
  }

  // Add the setupResponsiveObservation method
  setupResponsiveObservation(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        // Handle layout shifts here
        this.updateSliderBackground();
      });
      
      // Observe the filter container
      setTimeout(() => {
        const filterContainer = document.querySelector('.filters-container');
        if (filterContainer) {
          this.resizeObserver?.observe(filterContainer);
        }
        
        // Setup custom slider interaction
        this.setupSliderInteraction();
      }, 500);
    }
  }
  
  // Set up interactive slider features
  setupSliderInteraction(): void {
    const sliderContainer = document.querySelector('.single-slider-container');
    const sliderHandle = document.querySelector('.single-slider-container .slider-handle');
    
    if (!sliderContainer || !sliderHandle) return;
    
    // Mouse/touch interaction for custom slider
    const onMouseDown = (e: Event) => {
      const event = e as MouseEvent | TouchEvent;
      event.preventDefault();
      
      // Add dragging class for proper styling
      sliderHandle.classList.add('dragging');
      
      const containerRect = sliderContainer.getBoundingClientRect();
      
      const handleMouseMove = (moveEvent: Event) => {
        const event = moveEvent as MouseEvent | TouchEvent;
        event.preventDefault();
        
        let clientX: number;
        
        if ('touches' in event) {
          clientX = event.touches[0].clientX;
        } else {
          clientX = (event as MouseEvent).clientX;
        }
        
        // Calculate new position
        let newPosition = (clientX - containerRect.left) / containerRect.width;
        
        // Constrain to slider bounds
        newPosition = Math.max(0, Math.min(1, newPosition));
        
        // Update price value
        this.maxPriceFilter = Math.round(this.minPrice + newPosition * (this.maxPrice - this.minPrice));
        
        // Update UI
        this.updateSliderBackground();
      };
      
      const handleMouseUp = () => {
        // Remove dragging class when finished
        sliderHandle.classList.remove('dragging');
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
        
        // Apply filters
        this.applyFilters();
        this.updateQueryParams();
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    };
    
    // Setup direct interactions with the slider handle
    sliderHandle.addEventListener('mousedown', onMouseDown);
    sliderHandle.addEventListener('touchstart', onMouseDown, { passive: false });
    
    // Allow clicking anywhere on the track
    sliderContainer.addEventListener('click', (e: Event) => {
      const event = e as MouseEvent;
      // Ignore clicks on the handle itself
      if (event.target === sliderHandle) return;
      
      const containerRect = sliderContainer.getBoundingClientRect();
      const newPosition = (event.clientX - containerRect.left) / containerRect.width;
      
      // Constrain and update
      const constrainedPosition = Math.max(0, Math.min(1, newPosition));
      this.maxPriceFilter = Math.round(this.minPrice + constrainedPosition * (this.maxPrice - this.minPrice));
      
      this.updateSliderBackground();
      this.applyFilters();
      this.updateQueryParams();
    });
  }

  // Add this method to intelligently preload images
  preloadNextPageImages(): void {
    // Only preload if we have next page
    if (this.currentPage < this.totalPages - 1) {
      // For demonstration, we'll manually preload a few images from the next page
      // In real implementation, this would fetch the actual next page data
      
      // Calculate first offset of next page
      const nextPageOffset = (this.currentPage + 1) * this.pageSize;
      
      // This would normally use a service call to get next page URLs, 
      // but for now we'll just simulate by using current product images
      if (this.products.length > 0) {
        // Preload a few images
        const samplesToPreload = Math.min(3, this.products.length);
        
        for (let i = 0; i < samplesToPreload; i++) {
          const product = this.products[i];
          
          // Create a new image element to preload
          const img = new Image();
          img.src = product.imageUrl;
          // No need to append to DOM for preloading
        }
      }
    }
  }

  // Get the name of the currently selected category
  getSelectedCategoryName(): string {
    if (this.selectedCategoryId === null || this.categories.length === 0) {
      return 'Category';
    }
    
    const selectedCategory = this.categories.find(c => Number(c.id) === Number(this.selectedCategoryId));
    return selectedCategory ? selectedCategory.name : 'Category';
  }
}
