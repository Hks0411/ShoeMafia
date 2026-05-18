const STORE_KEY = "shoe_mafia_store_v1";
const ADMIN_USER = "SHoEmafia";
const ADMIN_PASS = "ShOeMaFia@#1";
const GST_RATE = 0.18;
const LOW_STOCK = 3;

const DEFAULT_STORE = {
  products: [],
  orders: [],
  customers: [],
  offlineSales: [],
  banners: [{
    id: "b1",
    title: "Street Royalty",
    subtitle: "Bilaspur premium sneaker destination",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80",
    link: "shop.html",
    active: true
  }],
  coupons: [],
  reviews: [
    { id: "r1", name: "Rahul S.", rating: 5, text: "Best sneaker collection in Bilaspur!", date: "2025-12-10" },
    { id: "r2", name: "Priya M.", rating: 4, text: "Authentic pairs and great service.", date: "2026-01-22" }
  ],
  categories: ["Sneakers", "Streetwear", "Casual", "Limited Edition", "Running"],
  brands: ["Nike", "Jordan", "Adidas", "Yeezy", "New Balance", "Puma"]
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_STORE));
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
    return Object.assign({}, DEFAULT_STORE, JSON.parse(raw));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("inventory-sync"));
}

function uid() {
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function productStock(p) {
  if (p.sizes && p.sizes.length) return p.sizes.reduce((s, x) => s + x.quantity, 0);
  return p.quantity || 0;
}

function sizeStock(p, size) {
  const e = (p.sizes || []).find((s) => s.size === size);
  return e ? e.quantity : (p.quantity || 0);
}

function inStock(p) { return productStock(p) > 0; }

function deductStock(productId, size, qty) {
  const store = loadStore();
  const p = store.products.find((x) => x.id === productId);
  if (!p) return { ok: false, error: "Product not found" };
  if (p.sizes && p.sizes.length) {
    const s = p.sizes.find((x) => x.size === size);
    if (!s || s.quantity < qty) return { ok: false, error: "Insufficient stock" };
    s.quantity -= qty;
    p.quantity = productStock(p);
  } else {
    if ((p.quantity || 0) < qty) return { ok: false, error: "Insufficient stock" };
    p.quantity -= qty;
  }
  p.updatedAt = new Date().toISOString();
  saveStore(store);
  return { ok: true };
}

function restoreStock(productId, size, qty) {
  const store = loadStore();
  const p = store.products.find((x) => x.id === productId);
  if (!p) return;
  if (p.sizes && p.sizes.length) {
    const s = p.sizes.find((x) => x.size === size);
    if (s) s.quantity += qty;
    p.quantity = productStock(p);
  } else p.quantity = (p.quantity || 0) + qty;
  saveStore(store);
}

function addProduct(data) {
  const store = loadStore();
  const now = new Date().toISOString();
  const product = {
    id: data.id || uid(),
    name: data.name,
    images: data.images || [],
    price: Number(data.price),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
    quantity: Number(data.quantity) || 0,
    sizes: data.sizes || [],
    description: data.description || "",
    category: data.category || "Sneakers",
    brand: data.brand || "",
    isLimitedEdition: !!data.isLimitedEdition,
    isNewArrival: !!data.isNewArrival,
    isTrending: !!data.isTrending,
    discountPercent: data.discountPercent ? Number(data.discountPercent) : undefined,
    createdAt: now,
    updatedAt: now
  };
  if (product.sizes.length) product.quantity = productStock(product);
  const idx = store.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    product.createdAt = store.products[idx].createdAt;
    store.products[idx] = product;
  } else store.products.unshift(product);
  saveStore(store);
  return product;
}

function deleteProduct(id) {
  const store = loadStore();
  store.products = store.products.filter((p) => p.id !== id);
  saveStore(store);
}

function createOrder(orderData) {
  for (const item of orderData.items) {
    const r = deductStock(item.productId, item.size, item.quantity);
    if (!r.ok) throw new Error(r.error);
  }
  const store = loadStore();
  const now = new Date().toISOString();
  const order = Object.assign({}, orderData, {
    id: "SM-" + Date.now().toString(36).toUpperCase(),
    trackingNotes: [{ status: orderData.status || "pending", at: now, note: "Order placed" }],
    createdAt: now,
    updatedAt: now
  });
  store.orders.unshift(order);
  saveStore(store);
  return order;
}

function updateOrderStatus(id, status, note) {
  const store = loadStore();
  const o = store.orders.find((x) => x.id === id);
  if (!o) return null;
  if (status === "rejected" && o.status !== "rejected") {
    o.items.forEach((i) => restoreStock(i.productId, i.size, i.quantity));
  }
  const now = new Date().toISOString();
  o.status = status;
  o.updatedAt = now;
  o.trackingNotes.push({ status, at: now, note });
  saveStore(store);
  return o;
}

function createOfflineSale(sale) {
  for (const it of sale.items) {
    const dr = deductStock(it.productId, it.size, it.quantity);
    if (!dr.ok) throw new Error(dr.error);
  }
  const st = loadStore();
  const record = Object.assign({}, sale, {
    id: uid(),
    invoiceNumber: "INV-" + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString()
  });
  st.offlineSales.unshift(record);
  saveStore(st);
  return record;
}

function effectivePrice(p) {
  if (p.discountPercent) return p.price * (1 - p.discountPercent / 100);
  return p.price;
}

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function verifyAdmin(u, p) { return u === ADMIN_USER && p === ADMIN_PASS; }

function hashPass(p) { return btoa(p + ":shoe-mafia-salt"); }

window.ShoeMafiaStore = {
  loadStore, saveStore, addProduct, deleteProduct, productStock, sizeStock, inStock,
  createOrder, updateOrderStatus, createOfflineSale, effectivePrice, formatINR,
  verifyAdmin, hashPass, uid, GST_RATE, LOW_STOCK
};
