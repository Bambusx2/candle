# The Candle Bar

A luxurious e-commerce platform for artisanal, handcrafted candles. This elegant application is built with Angular and showcases our premium candle collections with a focus on sophistication and quality.

## Features

- **Premium Product Catalog**: Browse our curated collections of handcrafted candles
- **Detailed Product Pages**: View comprehensive information about each artisanal candle
- **Seamless Shopping Experience**: Add items to cart, manage quantities, and checkout
- **User Account Management**: Register, login, and manage your personal profile
- **Responsive Design**: Optimized for all devices with an elegant, consistent experience

## Project Structure

The application follows a feature-based organization:

```
candle-shop/
├── src/
│   ├── app/
│   │   ├── components/         # Shared components
│   │   │   ├── header/
│   │   │   ├── footer/
│   │   │   └── product-card/
│   │   ├── models/             # Data models
│   │   │   ├── product.ts
│   │   │   ├── user.ts
│   │   │   ├── cart-item.ts
│   │   │   └── order.ts
│   │   ├── pages/              # Page components
│   │   │   ├── home/
│   │   │   ├── products/
│   │   │   ├── product-detail/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── user-profile/
│   │   ├── services/           # Services
│   │   │   ├── product.service.ts
│   │   │   ├── cart.service.ts
│   │   │   └── auth.service.ts
│   │   ├── app.component.ts    # Root component
│   │   ├── app.routes.ts       # Application routes
│   │   └── ...
│   ├── assets/                 # Static assets (images, etc.)
│   ├── styles.scss             # Global styles
│   └── ...
└── ...
```

## Technical Details

- **Angular 16**: Modern framework for building sophisticated web applications
- **TypeScript**: Type-safe JavaScript for enhanced code quality and maintainability
- **SCSS**: Advanced styling with variables, nesting, and mixins
- **Responsive Design**: Elegant layouts that adapt seamlessly to all devices
- **LocalStorage API**: Persistent cart and user preferences
- **Reactive Programming**: Efficient state management with RxJS observables

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/the-candle-bar.git
   cd the-candle-bar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Building for Production

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Future Enhancements

- Customer reviews and ratings system
- Admin dashboard for inventory management
- Advanced order tracking capabilities
- Personalized wishlist functionality
- AI-powered candle recommendations
- Seamless integration with payment gateways

## License

This project is licensed under the MIT License - see the LICENSE file for details.
