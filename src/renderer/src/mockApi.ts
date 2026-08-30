// Browser fallback Mock API for testing inside regular web browsers
const MOCK_CASHIERS = [
  { id: 'cashier-admin', name: 'Admin (Mock)', pin: '1234', role: 'admin' },
  { id: 'cashier-staff', name: 'Staff (Mock)', pin: '5555', role: 'cashier' }
];

const DEFAULT_PRODUCTS = [
  // Mocktails
  { id: 'm1', name: 'Kiwi Breeze', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'm2', name: 'Swimming pool', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'm3', name: 'Chapman', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'm4', name: 'Virgin Mojito', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'm5', name: 'Safe sex on the beach', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'm6', name: 'Virgin Colada', price: 100, category: 'Mocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },

  // Cocktails
  { id: 'c1', name: 'Sex on the beach', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'c2', name: 'Cosmopolitan', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'c3', name: 'Long island', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'c4', name: 'Adiós moderfucka', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'c5', name: 'Blue Lagoon', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'c6', name: 'Tequila sunrise', price: 100, category: 'Cocktails', image: 'drink.png', stock: 50, createdAt: Date.now() },

  // Smoothies
  { id: 's1', name: 'Sunburst', price: 100, category: 'Smoothies', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 's2', name: 'Nutty Banana', price: 100, category: 'Smoothies', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 's3', name: 'Heart beet', price: 100, category: 'Smoothies', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 's4', name: 'Strawberry cloud', price: 100, category: 'Smoothies', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 's5', name: 'Mixed fruit', price: 100, category: 'Smoothies', image: 'drink.png', stock: 50, createdAt: Date.now() },

  // Milkshakes
  { id: 'mk1', name: 'Oreos shake', price: 100, category: 'Milkshakes', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'mk2', name: 'Strawberry shake', price: 100, category: 'Milkshakes', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'mk3', name: 'Vanilla shake', price: 100, category: 'Milkshakes', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'mk4', name: 'Chocolate shake', price: 100, category: 'Milkshakes', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'mk5', name: 'Banana  shake', price: 100, category: 'Milkshakes', image: 'drink.png', stock: 50, createdAt: Date.now() },

  // Juices
  { id: 'j1', name: 'Citrus glow', price: 100, category: 'Juices', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'j2', name: 'Fresh pineapple juice', price: 100, category: 'Juices', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'j3', name: 'Tropical sunrise(pineapple, orange, watermelon)', price: 100, category: 'Juices', image: 'drink.png', stock: 50, createdAt: Date.now() },
  { id: 'j4', name: 'Ginger Zing', price: 100, category: 'Juices', image: 'drink.png', stock: 50, createdAt: Date.now() }
];

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'John Doe', phone: '08012345678', loyalty_points: 12 },
  { id: 'c2', name: 'Jane Smith', phone: '09087654321', loyalty_points: 25 }
];

const DEFAULT_SETTINGS = {
  id: 1,
  businessName: 'YOLO BITES',
  taxRate: 10.0,
  receiptAddress: 'SHOP G9, A.M STORE ALIYU MAKAMA ROAD,\nBARNAWA, KADUNA , KADUNA STATE,\nNIGERIA',
  phones: '07013974928, 07044030444'
};

function getStored<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  // Auto-migration check: If old burger data is in storage, clear it to reload actual drink categories!
  if (key === 'yolo_products') {
    try {
      const list = JSON.parse(stored) as any[];
      if (list.length > 0 && list.some(item => item.name === 'Yolo Classic Burger' || item.category === 'Burgers')) {
        localStorage.removeItem('yolo_products');
        localStorage.removeItem('yolo_orders');
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
    } catch {
      // ignore
    }
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generate client side UUIDs for the browser mock
function generateUUID(): string {
  return 'mock-uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

export const mockApi = {
  loginPin: async (pin: string) => {
    const cashiers = getStored('yolo_cashiers', MOCK_CASHIERS);
    const cashier = cashiers.find(c => c.pin === pin);
    return cashier || null;
  },

  getCashiers: async () => {
    return getStored('yolo_cashiers', MOCK_CASHIERS);
  },

  updateCashierPin: async (id: string, pin: string) => {
    const cashiers = getStored('yolo_cashiers', MOCK_CASHIERS);
    const index = cashiers.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Cashier not found' };
    cashiers[index].pin = pin;
    setStored('yolo_cashiers', cashiers);
    return { success: true };
  },

  addCashier: async (data: { name: string; pin: string; role: string }) => {
    const cashiers = getStored('yolo_cashiers', MOCK_CASHIERS);
    const id = generateUUID();
    cashiers.push({ id, ...data });
    setStored('yolo_cashiers', cashiers);
    return { success: true, id };
  },

  getProducts: async () => {
    return getStored('yolo_products', DEFAULT_PRODUCTS);
  },

  addProduct: async (data: { name: string; price: number; category: string; image: string; stock: number }) => {
    const products = getStored('yolo_products', DEFAULT_PRODUCTS);
    const id = generateUUID();
    const newProduct = {
      id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image || 'drink.png',
      stock: Number(data.stock),
      createdAt: Date.now()
    };
    products.push(newProduct);
    setStored('yolo_products', products);

    // Also add to inventory logs mock
    const logs = getStored<any[]>('yolo_inventory_logs', []);
    logs.push({
      id: generateUUID(),
      productId: id,
      change: newProduct.stock,
      reason: 'initial',
      createdAt: Date.now()
    });
    setStored('yolo_inventory_logs', logs);

    return { success: true, id };
  },

  updateProduct: async (id: string, data: { name: string; price: number; category: string; image: string }) => {
    const products = getStored('yolo_products', DEFAULT_PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Product not found' };

    products[index] = {
      ...products[index],
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image
    };
    setStored('yolo_products', products);
    return { success: true };
  },

  updateProductStock: async (data: { productId: string; change: number; reason: string }) => {
    const products = getStored('yolo_products', DEFAULT_PRODUCTS);
    const index = products.findIndex(p => p.id === data.productId);
    if (index === -1) return { success: false, error: 'Product not found' };

    products[index].stock = Math.max(0, products[index].stock + Number(data.change));
    setStored('yolo_products', products);

    const logs = getStored<any[]>('yolo_inventory_logs', []);
    logs.push({
      id: generateUUID(),
      productId: data.productId,
      change: Number(data.change),
      reason: data.reason,
      createdAt: Date.now()
    });
    setStored('yolo_inventory_logs', logs);

    return { success: true };
  },

  createOrder: async (payload: {
    cashierId: string;
    customerId?: string;
    items: { productId: string; quantity: number; price: number }[];
    total: number;
    discount: number;
    tax: number;
  }) => {
    const products = getStored('yolo_products', DEFAULT_PRODUCTS);
    
    // Deduct stock
    for (const item of payload.items) {
      const idx = products.findIndex(p => p.id === item.productId);
      if (idx !== -1) {
        products[idx].stock = Math.max(0, products[idx].stock - item.quantity);
      }
    }
    setStored('yolo_products', products);

    // Save order
    const orders = getStored<any[]>('yolo_orders', []);
    const orderId = generateUUID();
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const newOrder = {
      id: orderId,
      orderNumber,
      total: payload.total,
      discount: payload.discount,
      tax: payload.tax,
      cashierId: payload.cashierId,
      customerId: payload.customerId,
      createdAt: Date.now(),
      items: payload.items
    };
    orders.push(newOrder);
    setStored('yolo_orders', orders);

    // Update customer loyalty points
    if (payload.customerId) {
      const customers = getStored('yolo_customers', DEFAULT_CUSTOMERS);
      const cIdx = customers.findIndex(c => c.id === payload.customerId);
      if (cIdx !== -1) {
        const pointsEarned = Math.floor(payload.total / 100);
        customers[cIdx].loyalty_points += pointsEarned;
        setStored('yolo_customers', customers);
      }
    }

    return { success: true, orderId, orderNumber };
  },

  getOrders: async () => {
    const orders = getStored<any[]>('yolo_orders', []);
    const products = getStored<any[]>('yolo_products', DEFAULT_PRODUCTS);
    const cashiers = getStored<any[]>('yolo_cashiers', MOCK_CASHIERS);
    const customers = getStored<any[]>('yolo_customers', DEFAULT_CUSTOMERS);

    const fullOrders = orders.map(order => {
      // Cashier Name
      const cashier = cashiers.find(c => c.id === order.cashierId);
      const cashierName = cashier ? cashier.name : 'Unknown';

      // Customer Name
      const customer = customers.find(c => c.id === order.customerId);
      const customerName = customer ? customer.name : '';

      // Items detailed
      const detailedItems = (order.items || []).map((item: any) => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: prod ? prod.name : 'Unknown Product',
          category: prod ? prod.category : 'Unknown',
          quantity: item.quantity,
          price: item.price
        };
      });

      return {
        ...order,
        cashierName,
        customerName,
        items: detailedItems
      };
    });

    return fullOrders.sort((a, b) => b.createdAt - a.createdAt);
  },

  getCustomers: async () => {
    return getStored('yolo_customers', DEFAULT_CUSTOMERS);
  },

  addCustomer: async (data: { name: string; phone: string }) => {
    const customers = getStored('yolo_customers', DEFAULT_CUSTOMERS);
    const existing = customers.find(c => c.phone === data.phone);
    if (existing) {
      return { success: false, error: 'Customer phone number already exists' };
    }
    const id = generateUUID();
    const newCustomer = {
      id,
      name: data.name,
      phone: data.phone,
      loyalty_points: 0
    };
    customers.push(newCustomer);
    setStored('yolo_customers', customers);
    return { success: true, id };
  },

  getDashboardMetrics: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const orders = getStored<any[]>('yolo_orders', []);
    const todayOrdersList = orders.filter(o => o.createdAt >= startOfDay);
    const todayRevenue = todayOrdersList.reduce((acc, curr) => acc + curr.total, 0);
    const todayOrders = todayOrdersList.length;

    const products = getStored<any[]>('yolo_products', DEFAULT_PRODUCTS);
    const lowStockAlerts = products.filter(p => p.stock <= 5).length;

    return { todayRevenue, todayOrders, lowStockAlerts };
  },

  printReceipt: async () => {
    window.print();
    return { success: true };
  },

  downloadReceiptPDF: async () => {
    window.print();
    return { success: true, filePath: 'receipt.pdf' };
  },

  getSettings: async () => {
    return getStored('yolo_settings', DEFAULT_SETTINGS);
  },

  saveSettings: async (data: { businessName: string; taxRate: number; receiptAddress: string; phones: string }) => {
    const settings = {
      id: 1,
      businessName: data.businessName,
      taxRate: Number(data.taxRate),
      receiptAddress: data.receiptAddress,
      phones: data.phones
    };
    setStored('yolo_settings', settings);
    return { success: true };
  }
};
