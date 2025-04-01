import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CandleCategory, Product } from '../models/product';
import { ApiService } from './api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  // Mock data for development and fallback purposes
  private mockProducts: Product[] = [
    {
      id: 1,
      name: 'Vanilla Bean & Cedarwood',
      price: 24.99,
      description: 'A warm and inviting scent combining sweet vanilla with woody notes of cedarwood.',
      imageUrl: 'assets/images/candles/vanilla-cedarwood.jpg',
      category: { id: 1, name: 'Scented' },
      scent: 'Vanilla & Cedarwood',
      burnTime: '45 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.5,
      reviewCount: 124,
      featured: true,
      bestSeller: true
    },
    {
      id: 2,
      name: 'Sea Salt & Orchid',
      price: 29.99,
      description: 'Fresh sea salt blended with exotic orchid creates a refreshing and elegant fragrance.',
      imageUrl: 'assets/images/candles/sea-salt-orchid.jpg',
      category: { id: 1, name: 'Scented' },
      scent: 'Sea Salt & Orchid',
      burnTime: '50 hours',
      size: 'Large',
      inStock: true,
      rating: 4.3,
      reviewCount: 98,
      featured: true,
      bestSeller: true
    },
    {
      id: 3,
      name: 'Amber & Sandalwood',
      price: 34.99,
      description: 'A luxurious blend of warm amber and rich sandalwood for a sophisticated atmosphere.',
      imageUrl: 'assets/images/candles/amber-sandalwood.jpg',
      category: { id: 1, name: 'Scented' },
      scent: 'Amber & Sandalwood',
      burnTime: '60 hours',
      size: 'Large',
      inStock: true,
      rating: 4.7,
      reviewCount: 156,
      featured: true,
      newArrival: true
    },
    {
      id: 4,
      name: 'Pure Beeswax Pillar',
      price: 19.99,
      description: 'Natural beeswax pillar candle with a subtle honey scent. Long-lasting and clean burning.',
      imageUrl: 'assets/images/candles/beeswax-pillar.jpg',
      category: { id: 4, name: 'Beeswax' },
      burnTime: '35 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.8,
      reviewCount: 89
    },
    {
      id: 5,
      name: 'Coconut Wax Unscented',
      price: 14.99,
      description: 'Clean-burning unscented coconut wax candle, perfect for sensitive environments.',
      imageUrl: 'assets/images/candles/coconut-unscented.jpg',
      category: { id: 2, name: 'Unscented' },
      burnTime: '30 hours',
      size: 'Small',
      inStock: true,
      rating: 4.2,
      reviewCount: 67
    },
    {
      id: 6,
      name: 'Lavender Soy',
      price: 22.99,
      description: 'Calming lavender infused in pure soy wax for a relaxing experience.',
      imageUrl: 'assets/images/candles/lavender-soy.jpg',
      category: { id: 3, name: 'Soy' },
      scent: 'Lavender',
      burnTime: '40 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.6,
      reviewCount: 132,
      bestSeller: true
    },
    {
      id: 7,
      name: 'Seasonal Pumpkin Spice',
      price: 26.99,
      description: 'Limited edition fall favorite with notes of pumpkin, cinnamon, and nutmeg.',
      imageUrl: 'assets/images/candles/pumpkin-spice.jpg',
      category: { id: 9, name: 'Seasonal' },
      scent: 'Pumpkin Spice',
      burnTime: '45 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.9,
      reviewCount: 78,
      featured: true
    },
    {
      id: 8,
      name: 'Clear Glass Container',
      price: 17.99,
      description: 'Elegant clear glass container candle with your choice of fragrance.',
      imageUrl: 'assets/images/candles/glass-container.jpg',
      category: { id: 6, name: 'Container' },
      scent: 'Various Options',
      burnTime: '35 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.3,
      reviewCount: 112
    },
    {
      id: 9,
      name: 'Pillar Candle Set',
      price: 31.99,
      description: 'Set of three elegant pillar candles in varying heights.',
      imageUrl: 'assets/images/candles/pillar-set.jpg',
      category: { id: 5, name: 'Pillar' },
      burnTime: '50 hours each',
      size: 'Assorted',
      inStock: true,
      rating: 4.5,
      reviewCount: 94
    },
    {
      id: 10,
      name: 'Tea Light Pack',
      price: 15.99,
      description: 'Pack of 12 long-burning tea lights perfect for any occasion.',
      imageUrl: 'assets/images/candles/tea-lights.jpg',
      category: { id: 7, name: 'Tea Light' },
      burnTime: '6 hours each',
      size: 'Small',
      inStock: true,
      rating: 4.1,
      reviewCount: 203
    },
    {
      id: 11,
      name: 'Votive Set',
      price: 18.99,
      description: 'Set of 6 scented votive candles with a variety of fragrances.',
      imageUrl: 'assets/images/candles/votive-set.jpg',
      category: { id: 8, name: 'Votive' },
      scent: 'Assorted',
      burnTime: '15 hours each',
      size: 'Small',
      inStock: true,
      rating: 4.4,
      reviewCount: 87
    },
    {
      id: 12,
      name: 'Winter Pine',
      price: 27.99,
      description: 'Seasonal evergreen scent that brings the forest into your home.',
      imageUrl: 'assets/images/candles/winter-pine.jpg',
      category: { id: 9, name: 'Seasonal' },
      scent: 'Pine & Cedar',
      burnTime: '45 hours',
      size: 'Medium',
      inStock: true,
      rating: 4.8,
      reviewCount: 65,
      newArrival: true
    }
  ];

  constructor(private apiService: ApiService) { }

  getAllProducts(page: number = 0, size: number = 10, sort: string = 'id,asc'): Observable<any> {
    const params = { page, size, sort };
    return this.apiService.getWithParams<any>('products', params)
      .pipe(
        catchError(error => {
          console.error('Error fetching products:', error);
          console.log('Returning mock products as fallback');
          
          // Return mock data as fallback
          const start = page * size;
          const end = start + size;
          const paginatedProducts = this.sortMockProducts(this.mockProducts, sort).slice(start, end);
          
          return of({
            content: paginatedProducts,
            totalElements: this.mockProducts.length,
            totalPages: Math.ceil(this.mockProducts.length / size),
            size: size,
            number: page
          });
        })
      );
  }

  getProductById(id: number): Observable<Product> {
    return this.apiService.get<Product>(`products/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching product ${id}:`, error);
          const mockProduct = this.mockProducts.find(p => p.id === id);
          return of(mockProduct || {} as Product);
        })
      );
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.apiService.get<Product[]>('products/featured')
      .pipe(
        catchError(error => {
          console.error('Error fetching featured products:', error);
          return of(this.mockProducts.filter(p => p.featured));
        })
      );
  }

  getBestSellers(): Observable<Product[]> {
    return this.apiService.get<Product[]>('products/best-sellers')
      .pipe(
        catchError(error => {
          console.error('Error fetching best sellers:', error);
          return of(this.mockProducts.filter(p => p.bestSeller));
        })
      );
  }

  getNewArrivals(): Observable<Product[]> {
    return this.apiService.get<Product[]>('products/new-arrivals')
      .pipe(
        catchError(error => {
          console.error('Error fetching new arrivals:', error);
          return of(this.mockProducts.filter(p => p.newArrival));
        })
      );
  }

  getProductsByCategory(categoryId: number, page: number = 0, size: number = 10, sort: string = 'id,asc'): Observable<any> {
    console.log(`Getting products for category ID: ${categoryId} (type: ${typeof categoryId})`);
    
    // Ensure categoryId is a number
    const categoryIdNum = Number(categoryId);
    console.log(`Converted category ID: ${categoryIdNum}`);
    
    const params = { page, size, sort };
    return this.apiService.getWithParams<any>(`products/category/${categoryIdNum}`, params)
      .pipe(
        map(response => {
          console.log('API response for category products:', response);
          // Transform API response if needed (convert categoryId to category object format for consistency)
          if (response && response.content) {
            response.content = response.content.map((product: any) => {
              // Check if product has categoryId but not category
              if (product.categoryId !== undefined && !product.category) {
                // Create a category object from categoryId and categoryName
                product.category = {
                  id: product.categoryId,
                  name: product.categoryName || `Category ${product.categoryId}`
                };
              }
              return product;
            });
          }
          return response;
        }),
        catchError(error => {
          console.error(`Error fetching products for category ${categoryIdNum}:`, error);
          
          // Debug all available mock products
          console.log(`Total mock products available: ${this.mockProducts.length}`);
          
          // Filter mock products by category - ensure consistent type comparison
          console.log(`Looking for products with category ID: ${categoryIdNum}`);
          
          const filteredProducts = this.mockProducts.filter(p => {
            let productCategoryId;
            
            if (typeof p.category === 'object' && p.category !== null) {
              productCategoryId = Number(p.category.id);
              console.log(`Product ${p.id}: category object with ID ${productCategoryId}`);
            } else if (p.categoryId !== undefined) {
              productCategoryId = Number(p.categoryId);
              console.log(`Product ${p.id}: direct categoryId ${productCategoryId}`);
            } else {
              productCategoryId = Number(p.category);
              console.log(`Product ${p.id}: direct category ${productCategoryId}`);
            }
            
            const isMatch = productCategoryId === categoryIdNum;
            console.log(`Product ${p.id}: comparing category ${productCategoryId} with ${categoryIdNum}, match=${isMatch}`);
            return isMatch;
          });
          
          console.log(`Found ${filteredProducts.length} products for category ${categoryIdNum}`);
          
          if (filteredProducts.length === 0) {
            console.error(`No products found for category ${categoryIdNum}. This may indicate a data problem.`);
          }
          
          // Sort the filtered products if any sorting parameter is provided
          const sortedProducts = this.sortMockProducts(filteredProducts, sort);
          
          // Paginate the sorted results
          const start = page * size;
          const end = start + size;
          const paginatedProducts = sortedProducts.slice(start, end);
          
          return of({
            content: paginatedProducts,
            totalElements: filteredProducts.length,
            totalPages: Math.ceil(filteredProducts.length / size),
            size: size,
            number: page,
            first: page === 0,
            last: (page + 1) * size >= filteredProducts.length
          });
        })
      );
  }

  // Helper function to sort mock products
  private sortMockProducts(products: Product[], sort: string): Product[] {
    const [field, direction] = sort.split(',');
    const sorted = [...products];
    
    switch (field) {
      case 'price':
        sorted.sort((a, b) => direction === 'asc' ? a.price - b.price : b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => direction === 'asc' ? 
          (a.rating || 0) - (b.rating || 0) : 
          (b.rating || 0) - (a.rating || 0));
        break;
      case 'featured':
        sorted.sort((a, b) => direction === 'asc' ?
          (a.featured ? 1 : 0) - (b.featured ? 1 : 0) :
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        // Default sort by id
        sorted.sort((a, b) => direction === 'asc' ? a.id - b.id : b.id - a.id);
    }
    
    return sorted;
  }

  searchProducts(term: string, page: number = 0, size: number = 10): Observable<any> {
    const params = { keyword: term, page, size };
    return this.apiService.getWithParams<any>('products/search', params)
      .pipe(
        catchError(error => {
          console.error('Error searching products:', error);
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: size,
            number: page
          });
        })
      );
  }

  createProduct(product: any): Observable<any> {
    return this.apiService.post<any>('products', product, true)
      .pipe(
        catchError(this.handleError<any>('createProduct'))
      );
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.apiService.put<any>(`products/${id}`, product, true)
      .pipe(
        catchError(this.handleError<any>('updateProduct'))
      );
  }

  deleteProduct(id: number): Observable<any> {
    return this.apiService.delete<any>(`products/${id}`, true)
      .pipe(
        catchError(this.handleError<any>('deleteProduct'))
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      console.error('Error details:', error);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
