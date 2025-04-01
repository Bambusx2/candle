-- Sample Data for Candle Shop Backend

-- Categories
INSERT INTO candle_category (id, name, description, created_at, updated_at) VALUES 
(1, 'Scented', 'Candles with various fragrances', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Unscented', 'Candles without added fragrances', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Soy', 'Candles made from soy wax', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Beeswax', 'Candles made from beeswax', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Pillar', 'Free-standing cylindrical candles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Container', 'Candles in decorative containers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Tea Light', 'Small, round candles in metal cups', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Votive', 'Small, cylindrical candles for holders', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'Seasonal', 'Candles for specific seasons or holidays', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Products
INSERT INTO products (id, name, price, description, image_url, category_id, scent, burn_time, size, weight, stock_status, rating, review_count, is_featured, is_new_arrival, is_best_seller, created_at, updated_at) VALUES 
(1, 'Vanilla Bean & Cedarwood', 24.99, 'A warm, comforting blend of rich vanilla bean and woody cedarwood notes.', 'assets/images/1.png', 1, 'Vanilla & Cedarwood', '45-50 hours', '8 oz', 12.0, 'IN_STOCK', 4.8, 124, true, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Sea Salt & Orchid', 29.99, 'Fresh sea salt combined with delicate orchid blossoms for a clean, floral scent.', 'assets/images/2.png', 1, 'Sea Salt & Orchid', '50-55 hours', '10 oz', 14.0, 'IN_STOCK', 4.7, 98, true, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Amber & Sandalwood', 34.99, 'Earthy sandalwood and warm amber create a rich, sophisticated fragrance.', 'assets/images/3.png', 1, 'Amber & Sandalwood', '60-65 hours', '12 oz', 16.0, 'IN_STOCK', 4.9, 156, true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Lavender Fields', 22.99, 'Pure lavender essence reminiscent of French lavender fields in bloom.', 'assets/images/4.png', 1, 'Lavender', '40-45 hours', '8 oz', 12.0, 'IN_STOCK', 4.6, 87, false, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Pure Beeswax Pillar', 19.99, 'Natural beeswax pillar candle with a subtle honey scent and clean burn.', 'assets/images/5.png', 4, 'Natural Honey', '35-40 hours', '6 inch', 10.0, 'IN_STOCK', 4.5, 64, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Unscented Soy Tealights', 14.99, 'Set of 12 unscented soy wax tealights for versatile use.', 'assets/images/6.png', 2, 'Unscented', '4-6 hours each', '1.5 inch', 0.5, 'IN_STOCK', 4.3, 42, false, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pumpkin Spice & Clove', 27.99, 'Seasonal blend of pumpkin, cinnamon, nutmeg, and clove.', 'assets/images/7.png', 9, 'Pumpkin Spice', '45-50 hours', '9 oz', 13.0, 'IN_STOCK', 4.8, 112, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Winter Pine', 26.99, 'Fresh pine scent reminiscent of a winter forest.', 'assets/images/8.png', 9, 'Pine & Eucalyptus', '45-50 hours', '9 oz', 13.0, 'IN_STOCK', 4.7, 89, false, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Roles
INSERT INTO roles (id, name) VALUES
(1, 'ROLE_ADMIN'),
(2, 'ROLE_USER');

-- Users (password is 'password' encrypted with BCrypt)
INSERT INTO users (id, first_name, last_name, email, password, phone_number, account_enabled, account_locked, created_at, updated_at) VALUES
(1, 'Admin', 'User', 'admin@candleshop.com', '$2a$10$yw9Ib0BDMaDDLUUP4hOQ2uNqQUSPmq2zBnSkX5jb.yPxxpZQZ.VcG', '1234567890', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'John', 'Doe', 'john@example.com', '$2a$10$yw9Ib0BDMaDDLUUP4hOQ2uNqQUSPmq2zBnSkX5jb.yPxxpZQZ.VcG', '9876543210', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(1, 2),
(2, 2);

-- Addresses
INSERT INTO addresses (id, user_id, street, city, state, postal_code, country, is_default, created_at, updated_at) VALUES
(1, 1, '123 Admin St', 'San Francisco', 'CA', '94105', 'USA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, '456 User Ave', 'New York', 'NY', '10001', 'USA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Reset sequences (specific to H2 database)
ALTER TABLE users ALTER COLUMN id RESTART WITH 3;
ALTER TABLE addresses ALTER COLUMN id RESTART WITH 3;
ALTER TABLE roles ALTER COLUMN id RESTART WITH 3;
ALTER TABLE candle_category ALTER COLUMN id RESTART WITH 10;
ALTER TABLE products ALTER COLUMN id RESTART WITH 9; 