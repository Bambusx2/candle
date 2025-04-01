export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: Category | number;  // Can be either a Category object or a category ID
  categoryId?: number;           // For API responses that include categoryId directly
  categoryName?: string;         // For API responses that include categoryName directly
  scent?: string;
  burnTime?: string;
  size?: string;
  weight?: string | number;
  inStock?: boolean;
  stockStatus?: string;          // For API responses that use stockStatus enum
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  salesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  slug?: string;
  productCount?: number;
}

export enum CandleCategory {
  SCENTED = 'Scented',
  UNSCENTED = 'Unscented',
  SOY = 'Soy',
  BEESWAX = 'Beeswax',
  FLOATING = 'Floating',
  PILLAR = 'Pillar',
  CONTAINER = 'Container',
  TEALIGHT = 'Tea Light',
  VOTIVE = 'Votive'
}
