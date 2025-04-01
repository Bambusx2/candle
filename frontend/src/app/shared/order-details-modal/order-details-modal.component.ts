import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Order } from '../../models/order';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OrderDetailsModalComponent implements OnInit {
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  
  activeTab: 'items' | 'details' | 'shipping' = 'items';
  isVisible = false;
  
  constructor(private elementRef: ElementRef) {}
  
  ngOnInit(): void {
    setTimeout(() => {
      this.isVisible = true;
    }, 10);
    
    // Add event listener to close on background click
    document.addEventListener('mousedown', this.onClickOutside.bind(this));
    // Prevent scrolling of background content
    document.body.style.overflow = 'hidden';
  }
  
  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.onClickOutside.bind(this));
    document.body.style.overflow = '';
  }
  
  onClickOutside(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.querySelector('.modal-content').contains(event.target);
    if (!clickedInside && this.isVisible) {
      this.closeModal();
    }
  }
  
  setActiveTab(tab: 'items' | 'details' | 'shipping'): void {
    this.activeTab = tab;
  }
  
  closeModal(): void {
    this.isVisible = false;
    setTimeout(() => {
      this.close.emit();
    }, 300); // Wait for animation to complete
  }
  
  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
  
  getOrderStatusClass(): string {
    if (!this.order) return '';
    return this.order.status.toLowerCase();
  }
  
  // Format the shipping address
  formatAddress(): string {
    if (!this.order || !this.order.shippingAddress) return '';
    
    const addr = this.order.shippingAddress;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
  }
  
  // Calculate the delivery estimate based on order date
  getDeliveryEstimate(): string {
    if (!this.order) return '';
    
    const orderDate = new Date(this.order.orderDate);
    const deliveryEstimate = new Date(orderDate);
    
    // Add 3-5 business days for processing and shipping
    deliveryEstimate.setDate(orderDate.getDate() + (this.order.status === 'Shipped' ? 3 : 5));
    
    return deliveryEstimate.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  }
  
  // Get tracking status based on order status
  getTrackingStatus(): { 
    status: 'ordered' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    percent: number 
  } {
    if (!this.order) return { status: 'ordered', percent: 0 };
    
    switch(this.order.status) {
      case 'Pending':
        return { status: 'ordered', percent: 25 };
      case 'Processing':
        return { status: 'processing', percent: 50 };
      case 'Shipped':
        return { status: 'shipped', percent: 75 };
      case 'Delivered':
        return { status: 'delivered', percent: 100 };
      case 'Cancelled':
        return { status: 'cancelled', percent: 0 };
      default:
        return { status: 'ordered', percent: 25 };
    }
  }
} 