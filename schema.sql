-- ============================================================
-- Hotel Gavkari — MySQL Database Schema
-- Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS dsycafe_db;
USE dsycafe_db;

-- Dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  category    ENUM('appetizers','main','desserts','drinks') NOT NULL,
  image_url   VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  customer_name  VARCHAR(100) NOT NULL,
  email          VARCHAR(100),
  phone          VARCHAR(20),
  address        TEXT,
  notes          TEXT,
  items          JSON         NOT NULL,
  total          DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Card','UPI','Cash on Delivery') NOT NULL,
  status         ENUM('Pending','Preparing','Delivered','Cancelled') DEFAULT 'Pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample dishes
INSERT INTO dishes (name, description, price, category, image_url) VALUES
('Veg Spring Rolls',   'Crispy rolls stuffed with mixed veggies',          120, 'appetizers', 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=400'),
('Paneer Tikka',       'Grilled cottage cheese with spices',               180, 'appetizers', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400'),
('Dal Tadka',          'Yellow lentils tempered with ghee & spices',       140, 'main',       'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),pip install mysql-connector-python textblob
('Butter Chicken',     'Creamy tomato-based chicken curry',                220, 'main',       'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400'),
('Veg Biryani',        'Fragrant basmati rice with mixed vegetables',      160, 'main',       'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'),
('Gulab Jamun',        'Soft milk dumplings in sugar syrup',               80,  'desserts',   'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'),
('Chocolate Brownie',  'Warm fudgy brownie with vanilla ice cream',        120, 'desserts',   'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400'),
('Masala Chai',        'Spiced Indian tea with milk',                      40,  'drinks',     'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400'),
('Cold Coffee',        'Chilled blended coffee with ice cream',            90,  'drinks',     'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400');
