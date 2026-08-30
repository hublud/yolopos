import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1NDg1MSwiZXhwIjoyMTAzNjMwODUxfQ.FgbdmKPq2mUmO-NWlsZZLg-WJJXBE6u9-GZ1QiX1TM0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const now = Date.now();

const MENU_ITEMS = [
  // MAINS
  { id: 'main-1', name: 'Waffles and Chicken', price: 9500, category: 'Mains', image: 'drink.png', stock: 50 },
  { id: 'main-2', name: 'Breakfast Waffles', price: 12000, category: 'Mains', image: 'drink.png', stock: 50 },
  { id: 'main-3', name: 'Fries', price: 3500, category: 'Mains', image: 'drink.png', stock: 50 },
  { id: 'main-4', name: 'Chicken and Chips', price: 7500, category: 'Mains', image: 'drink.png', stock: 50 },

  // SMALL CHOPS
  { id: 'sc-1', name: 'Samosa (5 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50 },
  { id: 'sc-2', name: 'Spring Roll (5 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50 },
  { id: 'sc-3', name: 'Puff Puff (10 pcs)', price: 2000, category: 'Small Chops', image: 'drink.png', stock: 50 },

  // COMBO DEALS
  { id: 'combo-1', name: 'Burger Chicken Fries & Drink', price: 12500, category: 'Combo Deals', image: 'drink.png', stock: 50 },
  { id: 'combo-2', name: 'You Only Live Once', price: 21000, category: 'Combo Deals', image: 'drink.png', stock: 50 },
  { id: 'combo-3', name: 'Chop Chop', price: 16500, category: 'Combo Deals', image: 'drink.png', stock: 50 },

  // BURGERS
  { id: 'burger-1', name: 'Beef Burger', price: 5000, category: 'Burgers', image: 'drink.png', stock: 50 },
  { id: 'burger-2', name: 'Double Juicy Patty Burger', price: 6500, category: 'Burgers', image: 'drink.png', stock: 50 },
  { id: 'burger-3', name: 'The Stacks', price: 12500, category: 'Burgers', image: 'drink.png', stock: 50 },

  // PROTEINS
  { id: 'prot-1', name: 'Chicken Wings', price: 5000, category: 'Proteins', image: 'drink.png', stock: 50 },
  { id: 'prot-2', name: 'Turkey', price: 6500, category: 'Proteins', image: 'drink.png', stock: 50 },
  { id: 'prot-3', name: 'Gizzard', price: 6500, category: 'Proteins', image: 'drink.png', stock: 50 },

  // EXTRAS
  { id: 'extra-1', name: 'French Fries', price: 3500, category: 'Extras', image: 'drink.png', stock: 50 },
  { id: 'extra-2', name: 'Cheese', price: 1000, category: 'Extras', image: 'drink.png', stock: 50 },
  { id: 'extra-3', name: 'Hotdog', price: 500, category: 'Extras', image: 'drink.png', stock: 50 },
  { id: 'extra-4', name: 'Egg', price: 500, category: 'Extras', image: 'drink.png', stock: 50 },
  { id: 'extra-5', name: 'Sauce', price: 1000, category: 'Extras', image: 'drink.png', stock: 50 },

  // LOADED FRIES
  { id: 'lf-1', name: 'Loaded Fries', price: 8000, category: 'Loaded Fries', image: 'drink.png', stock: 50 },
  { id: 'lf-2', name: 'YOLO Fries Large', price: 12500, category: 'Loaded Fries', image: 'drink.png', stock: 50 },
  { id: 'lf-3', name: 'Pulled Chicken Sandwich', price: 8000, category: 'Loaded Fries', image: 'drink.png', stock: 50 },

  // PIZZA
  { id: 'pizza-1', name: 'Pepperoni Pizza', price: 12000, category: 'Pizza', image: 'drink.png', stock: 50 },
  { id: 'pizza-2', name: 'Margarita Pizza', price: 12000, category: 'Pizza', image: 'drink.png', stock: 50 },
  { id: 'pizza-3', name: 'Beef Pizza', price: 14000, category: 'Pizza', image: 'drink.png', stock: 50 },
  { id: 'pizza-4', name: 'Chicken Pizza', price: 14000, category: 'Pizza', image: 'drink.png', stock: 50 },
  { id: 'pizza-5', name: "Meat Lover's Dream", price: 18500, category: 'Pizza', image: 'drink.png', stock: 50 },

  // SHAWARMA
  { id: 'shaw-1', name: 'Beef Shawarma', price: 5000, category: 'Shawarma', image: 'drink.png', stock: 50 },
  { id: 'shaw-2', name: 'Chicken Shawarma', price: 5000, category: 'Shawarma', image: 'drink.png', stock: 50 },
  { id: 'shaw-3', name: 'Mixed Shawarma', price: 6500, category: 'Shawarma', image: 'drink.png', stock: 50 },
  { id: 'shaw-4', name: 'House Special Wrap', price: 10000, category: 'Shawarma', image: 'drink.png', stock: 50 },

  // MOCKTAIL
  { id: 'mock-1', name: 'Swimming Pool', price: 6000, category: 'Mocktail', image: 'drink.png', stock: 50 },
  { id: 'mock-2', name: 'Virgin Mojito', price: 6000, category: 'Mocktail', image: 'drink.png', stock: 50 },
  { id: 'mock-3', name: 'Kiwi Breeze', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50 },
  { id: 'mock-4', name: 'Chapman', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50 },
  { id: 'mock-5', name: 'Safe Sex on the Beach', price: 7000, category: 'Mocktail', image: 'drink.png', stock: 50 },

  // COCKTAIL
  { id: 'cock-1', name: 'Sex on the Beach', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50 },
  { id: 'cock-2', name: 'Cosmopolitan', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50 },
  { id: 'cock-3', name: 'Adios Modafucker', price: 10500, category: 'Cocktail', image: 'drink.png', stock: 50 },
  { id: 'cock-4', name: 'Long Island', price: 10500, category: 'Cocktail', image: 'drink.png', stock: 50 },
  { id: 'cock-5', name: 'Tequila Sunrise', price: 9000, category: 'Cocktail', image: 'drink.png', stock: 50 },

  // MILKSHAKE
  { id: 'milk-1', name: 'Oreo Shake', price: 9500, category: 'Milkshake', image: 'drink.png', stock: 50 },
  { id: 'milk-2', name: 'Banana Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50 },
  { id: 'milk-3', name: 'Vanilla Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50 },
  { id: 'milk-4', name: 'Strawberry Shake', price: 8500, category: 'Milkshake', image: 'drink.png', stock: 50 },
  { id: 'milk-5', name: 'Chocolate Shake', price: 9500, category: 'Milkshake', image: 'drink.png', stock: 50 },

  // SMOOTHIE
  { id: 'sm-1', name: 'Sunburst', price: 4000, category: 'Smoothie', image: 'drink.png', stock: 50 },
  { id: 'sm-2', name: 'Heart Beet', price: 5000, category: 'Smoothie', image: 'drink.png', stock: 50 },
  { id: 'sm-3', name: 'Nutty Banana', price: 5000, category: 'Smoothie', image: 'drink.png', stock: 50 },
  { id: 'sm-4', name: 'Mixed Fruit', price: 4000, category: 'Smoothie', image: 'drink.png', stock: 50 },

  // PARFAIT
  { id: 'parfait-1', name: 'Parfait', price: 7000, category: 'Parfait', image: 'drink.png', stock: 50 },

  // DRINKS
  { id: 'drk-1', name: 'Hollandia', price: 2500, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-2', name: 'Chivita Active', price: 2500, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-3', name: '5 Alive Berry Blast', price: 1700, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-4', name: 'Vitamilk', price: 2000, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-5', name: 'Veleta', price: 1500, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-6', name: 'Fayrouz', price: 1000, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-7', name: 'Maltina', price: 1000, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-8', name: 'Coke', price: 700, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-9', name: 'Sprite', price: 700, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-10', name: 'Fanta', price: 700, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-11', name: 'Schweppes Mojito', price: 800, category: 'Drinks', image: 'drink.png', stock: 50 },
  { id: 'drk-12', name: 'Water', price: 500, category: 'Drinks', image: 'drink.png', stock: 50 }
];

async function insertAll() {
  console.log('Inserting products into Supabase...');
  let count = 0;
  for (const item of MENU_ITEMS) {
    const { error } = await supabase.from('products').upsert({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      stock: item.stock,
      created_at: now
    });
    if (error) console.error(`Error on ${item.name}:`, error);
    else count++;
  }
  console.log(`✓ Successfully synced ${count} products to Supabase!`);
}

insertAll();
