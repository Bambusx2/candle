import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Mock categories for development and fallback
  private mockCategories: Category[] = [
    { id: 1, name: 'Scented', description: 'Aromatic candles with various scents', productCount: 3 },
    { id: 2, name: 'Unscented', description: 'Pure candles without added fragrance', productCount: 1 },
    { id: 3, name: 'Soy', description: 'Eco-friendly candles made from soy wax', productCount: 1 },
    { id: 4, name: 'Beeswax', description: 'Natural candles made from pure beeswax', productCount: 1 },
    { id: 5, name: 'Pillar', description: 'Freestanding cylindrical candles', productCount: 1 },
    { id: 6, name: 'Container', description: 'Candles contained in decorative vessels', productCount: 1 },
    { id: 7, name: 'Tea Light', description: 'Small candles in metal cups', productCount: 1 },
    { id: 8, name: 'Votive', description: 'Small cylindrical candles designed for holders', productCount: 1 },
    { id: 9, name: 'Seasonal', description: 'Limited edition holiday and seasonal scents', productCount: 2 }
  ];

  constructor(private apiService: ApiService) {}

  getAllCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>('categories')
      .pipe(
        catchError(error => {
          console.error('Error fetching categories:', error);
          console.log('Returning mock categories as fallback');
          return of(this.mockCategories);
        })
      );
  }

  getCategoryById(id: number): Observable<Category> {
    return this.apiService.get<Category>(`categories/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching category ${id}:`, error);
          const mockCategory = this.mockCategories.find(c => c.id === id);
          return of(mockCategory || {} as Category);
        })
      );
  }

  // Admin operations
  createCategory(category: any): Observable<any> {
    return this.apiService.post<any>('categories', category, true)
      .pipe(
        catchError(this.handleError<any>('createCategory'))
      );
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.apiService.put<any>(`categories/${id}`, category, true)
      .pipe(
        catchError(this.handleError<any>('updateCategory'))
      );
  }

  deleteCategory(id: number): Observable<any> {
    return this.apiService.delete<any>(`categories/${id}`, true)
      .pipe(
        catchError(this.handleError<any>('deleteCategory'))
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      console.error('Error details:', error);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
} 