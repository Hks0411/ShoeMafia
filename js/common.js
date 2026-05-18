const CART_KEY = "sm_cart";
const WISH_KEY = "sm_wish";
const RECENT_KEY = "sm_recent";
const CUST_KEY = "sm_customer";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
}
function setCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); }
function updateCartBadge() {
  const n = getCart().reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = n;
    el.style.display = n ? "grid" : "none";
  });
}
function addToCart(productId, size, qty) {
  const store = ShoeMafiaStore.loadStore();
  const p = store.products.find((x) => x.id === productId);
  if (!p || !ShoeMafiaStore.inStock(p)) return { ok: false, error: "Out of stock" };
  if (ShoeMafiaStore.sizeStock(p, size) < qty) return { ok: false, error: "Size unavailable" };
  const cart = getCart();
  const ex = cart.find((c) => c.productId === productId && c.size === size);
  if (ex) ex.quantity += qty;
  else cart.push({ productId, size, quantity: qty });
  setCart(cart);
  addRecent(productId);
  return { ok: true };
}
function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISH_KEY) || "[]"); } catch (e) { return []; }
}
function toggleWish(productId) {
  const w = getWishlist();
  const i = w.indexOf(productId);
  if (i >= 0) w.splice(i, 1); else w.push(productId);
  localStorage.setItem(WISH_KEY, JSON.stringify(w));
  updateWishBadge();
}
function isWish(productId) { return getWishlist().includes(productId); }
function updateWishBadge() {
  const n = getWishlist().length;
  document.querySelectorAll("[data-wish-count]").forEach((el) => {
    el.textContent = n;
    el.style.display = n ? "grid" : "none";
  });
}
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; }
}
function addRecent(id) {
  const r = getRecent().filter((x) => x !== id);
  r.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8)));
}
function getCustomer() {
  try { return JSON.parse(localStorage.getItem(CUST_KEY) || "null"); } catch (e) { return null; }
}
function setCustomer(c) { localStorage.setItem(CUST_KEY, JSON.stringify(c)); }

function renderNav(active) {
  const links = ["index.html:Home", "shop.html:Shop", "about.html:About", "contact.html:Contact"];
  const navLinks = links.map((l) => {
    const [href, label] = l.split(":");
    const style = active === href ? ' style="color:var(--neon);opacity:1"' : "";
    return `<li><a href="${href}"${style}>${label}</a></li>`;
  }).join("");
  const html = `<header class="nav" id="mainNav"><div class="container nav-inner">
    <a href="index.html" class="logo">SHOE <span>MAFIA</span></a>
    <ul class="nav-links">${navLinks}</ul>
    <div class="nav-actions">
      <a href="wishlist.html" class="icon-btn" title="Wishlist">&#10084;<span class="badge-count" data-wish-count style="display:none">0</span></a>
      <a href="track.html" class="icon-btn" title="Track Order">&#128230;</a>
      <a href="login.html" class="icon-btn" title="Account">&#128100;</a>
      <a href="cart.html" class="icon-btn" title="Cart">&#128722;<span class="badge-count" data-cart-count style="display:none">0</span></a>
      <button class="icon-btn menu-toggle" id="menuBtn" aria-label="Menu">&#9776;</button>
    </div></div></header>
    <div class="mobile-menu" id="mobileMenu">
      <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="wishlist.html">Wishlist</a>
      <a href="about.html">About</a><a href="contact.html">Contact</a><a href="cart.html">Cart</a>
      <button class="btn btn-outline" id="closeMenu">Close</button>
    </div>`;
  const el = document.getElementById("site-nav");
  if (el) el.innerHTML = html.replace(/<\/?motion[^>]*>/g, "");
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  const close = document.getElementById("closeMenu");
  if (btn && menu) btn.onclick = () => menu.classList.add("open");
  if (close && menu) close.onclick = () => menu.classList.remove("open");
  window.addEventListener("scroll", () => {
    const nav = document.getElementById("mainNav");
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  });
  updateCartBadge();
  updateWishBadge();
}

function renderFooter() {
  const f = document.getElementById("site-footer");
  if (!f) return;
  f.innerHTML = `<footer class="footer"><div class="container"><div class="footer-grid">
    <div><h4>SHOE MAFIA</h4><p style="color:var(--muted);font-size:0.9rem">Premium sneakers & streetwear in Bilaspur. Google Rating 4.0/5</p></div>
    <div><h4>Shop</h4><ul><li><a href="shop.html">All Drops</a></li><li><a href="shop.html?filter=new">New Arrivals</a></li><li><a href="wishlist.html">Wishlist</a></li></ul></div>
    <div><h4>Support</h4><ul><li><a href="track.html">Track Order</a></li><li><a href="contact.html">Contact</a></li><li><a href="https://wa.me/917587555558" target="_blank">WhatsApp</a></li><li><a href="admin.html">Admin</a></li></ul></div>
    <div><h4>Visit Us</h4><p style="color:var(--muted);font-size:0.85rem">Bus Stand, Old Telephone Exchange Road, Telipara, Bilaspur, Chhattisgarh 495001</p>
    <p style="margin-top:0.5rem"><a href="tel:+917587555558">+91 75875 55558</a></p></div>
    </div><div class="footer-bottom"><span>&copy; 2026 SHOE MAFIA</span><span>Bilaspur, India</span></div></div></footer>
    <a href="https://wa.me/917587555558?text=Hi%20SHOE%20MAFIA!" class="wa-float" target="_blank" rel="noopener" aria-label="WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>`;
  f.innerHTML = f.innerHTML.replace(/<\/?motion[^>]*>/g, "");
}

function productCardHTML(p) {
  const S = ShoeMafiaStore;
  const stock = S.productStock(p);
  const price = S.effectivePrice(p);
  const oos = stock <= 0;
  let tags = "";
  if (oos) tags = '<span class="tag tag-oos">Out of Stock</span>';
  else if (p.isLimitedEdition) tags = '<span class="tag tag-limited">Limited</span>';
  else if (p.isNewArrival) tags = '<span class="tag tag-new anim-pulse">New Drop</span>';
  else if (p.isTrending) tags = '<span class="tag tag-trend">Trending</span>';
  const img = p.images[0] || "https://images.unsplash.com/photo-1606107557192-0a9bdac2af6f?w=600";
  return `<article class="product-card glass" data-id="${p.id}">
    <button class="wish-btn" onclick="event.stopPropagation();SMCommon.toggleWish('${p.id}');this.textContent=SMCommon.isWish('${p.id}')?'\u2665':'\u2661';">${isWish(p.id) ? "\u2665" : "\u2661"}</button>
    ${tags}
    <div class="img-wrap" onclick="location.href='product.html?id=${p.id}'"><img src="${img}" alt="${p.name}" loading="lazy"></div>
    <div class="info" onclick="location.href='product.html?id=${p.id}'"><p class="brand">${p.brand || p.category}</p><h3>${p.name}</h3>
    <p class="price">${p.compareAtPrice ? `<s>${S.formatINR(p.compareAtPrice)}</s>` : ""}${S.formatINR(price)}</p></div></article>`;
}

function renderRecentProducts(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const ids = getRecent();
  const products = ShoeMafiaStore.loadStore().products.filter((p) => ids.includes(p.id));
  products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  el.innerHTML = products.length ? products.map(productCardHTML).join("") : "<p style='color:var(--muted)'>Browse sneakers to see recently viewed.</p>";
}

document.addEventListener("DOMContentLoaded", () => {
  renderFooter();
  document.querySelectorAll(".reveal").forEach((el) => {
    new IntersectionObserver((entries, o) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); o.unobserve(e.target); } });
    }, { threshold: 0.1 }).observe(el);
  });
});

window.SMCommon = {
  getCart, setCart, addToCart, getWishlist, toggleWish, isWish, renderNav, productCardHTML,
  getCustomer, setCustomer, addRecent, getRecent, renderRecentProducts, updateWishBadge
};
