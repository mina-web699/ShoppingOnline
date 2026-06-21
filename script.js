// ==================== 1. إعدادات Firebase الخاصة بمشروعك (تم تصحيح الرابط) ====================
const firebaseConfig = {
    apiKey: "AIzaSyA5AbMppaL0IxyQc-62YLrfRcFwDY9zyyO",
    authDomain: "shopping-online-7dcfd.firebaseapp.com",
    projectId: "shopping-online-7dcfd",
    storageBucket: "shopping-online-7dcfd.firebasestorage.app",
    messagingSenderId: "607216310901",
    appId: "1:607216310901:web:32983e797fee695394f63c",
    measurementId: "G-ML69JF8GCH"
};

// تشغيل الفايربيس برمجياً
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// كلمة السر الافتراضية لفتح لوحة التحكم المخفية
const SECRET_PASSWORD = "1234"; 

// --- DOM Selection ---
const productsSection = document.getElementById('our-pro');
const addProductForm = document.getElementById('add-product-form');
const secretTrigger = document.querySelector('header h1 span');
const adminPanel = document.querySelector('.admin-panel');
const authModal = document.getElementById('admin-auth-modal');
const passwordInput = document.getElementById('admin-secret-pass');
const cancelAuthBtn = document.getElementById('cancel-auth-btn');
const confirmAuthBtn = document.getElementById('confirm-auth-btn');

// عناصر السلة (Cart Elements)
const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const checkoutButtons = document.querySelectorAll('.checkout-btn');

// مصفوفة السلة المحلية
let cart = JSON.parse(localStorage.getItem("store_cart")) || [];

// ==================== 2. جلب وعرض المنتجات أونلاين (Realtime) ====================
function listenToOnlineProducts() {
    if (!productsSection) return;

    db.collection("store_products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        if (snapshot.empty) {
            productsSection.innerHTML = `<p class="empty-cart-text" style="grid-column: 1/-1; text-align:center;">No products available online right now!</p>`;
            return;
        }

        let html = "";
        snapshot.forEach((doc) => {
            const prod = doc.data();
            const prodId = doc.id;
            
            html += `
                <div class="product-card" style="position:relative;">
                    <img src="${prod.image}" alt="${prod.name}">
                    <h3>${prod.name}</h3>
                    <p>${prod.desc}</p>
                    <div class="price">$${parseFloat(prod.price).toFixed(2)}</div>
                    <button class="buy-btn" onclick="addToCart('${prodId}', '${prod.name}', ${prod.price})">Add To Cart</button>
                    
                    <button class="admin-delete-btn" onclick="deleteOnlineProduct('${prodId}')" style="display: ${adminPanel.style.display === 'block' ? 'block' : 'none'}; position:absolute; top:10px; right:10px; background:#ff4d4d; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer; z-index:10;">Delete</button>
                </div>
            `;
        });
        productsSection.innerHTML = html;
        updateCartBadge();
    }, (error) => {
        console.error("Firebase Error: ", error);
        productsSection.innerHTML = `<p style="color:red; text-align:center; grid-column: 1/-1;">Failed to load products from cloud storage.</p>`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    listenToOnlineProducts();
    renderCartItems();
});

// ==================== 3. إضافة منتج جديد إلى السحابة ====================
if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('admin-pro-name').value.trim();
        const desc = document.getElementById('admin-pro-desc').value.trim();
        const price = parseFloat(document.getElementById('admin-pro-price').value.trim());
        const img = document.getElementById('admin-pro-img').value.trim();

        db.collection("store_products").add({
            name: name,
            desc: desc,
            price: price,
            image: img,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            showToast("🔥 Product Published Online successfully!");
            addProductForm.reset();
        })
        .catch((err) => {
            showToast("❌ Upload Error: " + err.message);
        });
    });
}

// ==================== 4. حذف منتج من السحابة ====================
window.deleteOnlineProduct = function(id) {
    if (confirm("Are you sure you want to delete this product from the online store?")) {
        db.collection("store_products").doc(id).delete()
        .then(() => showToast("Product deleted successfully."))
        .catch((err) => showToast("Error: " + err.message));
    }
};

// ==================== 5. لوحة التحكم السرية ====================
if (secretTrigger) {
    secretTrigger.addEventListener('click', () => {
        authModal.style.display = 'flex';
        passwordInput.focus();
    });
}

if (cancelAuthBtn) {
    cancelAuthBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
        passwordInput.value = '';
    });
}

if (confirmAuthBtn) {
    confirmAuthBtn.addEventListener('click', handleAuth);
}

function handleAuth() {
    if (passwordInput.value === SECRET_PASSWORD) {
        adminPanel.style.display = 'block';
        authModal.style.display = 'none';
        passwordInput.value = '';
        showToast("🔓 Admin Panel Unlocked!");
        listenToOnlineProducts(); 
    } else {
        showToast("❌ Incorrect Password!");
    }
}

// ==================== 6. نظام السلة والـ WhatsApp (Cart & Checkout) ====================

// فتح السلة
if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        if (cartModal) cartModal.style.display = 'flex';
        renderCartItems();
    });
}

// إغلاق السلة
if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        if (cartModal) cartModal.style.display = 'none';
    });
}

// إضافة منتج للسلة
window.addToCart = function(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    localStorage.setItem("store_cart", JSON.stringify(cart));
    updateCartBadge();
    showToast(`🛒 Added ${name} to cart!`);
};

// تحديث شارة عدد المنتجات
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = total;
}

// عرض عناصر السلة داخل المودال
function renderCartItems() {
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-text">Your cart is empty!</p>`;
        return;
    }

    let cartHtml = '<div style="width:100%; max-height:300px; overflow-y:auto; padding:10px 0;">';
    let totalCartPrice = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        totalCartPrice += itemTotal;
        cartHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px dashed rgba(255,255,255,0.1);">
                <div>
                    <h4 style="color:#fff;">${item.name}</h4>
                    <small style="color:var(--neon-blue); font-size:12px;">$${item.price} x ${item.qty}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:bold; color:#fff;">$${itemTotal.toFixed(2)}</span>
                    <button onclick="removeFromCart(${index})" style="background:transparent; border:none; color:#ff4d4d; font-size:18px; cursor:pointer;">&times;</button>
                </div>
            </div>
        `;
    });

    cartHtml += `</div>
        <div style="display:flex; justify-content:space-between; width:100%; margin-top:15px; font-size:1.2rem; font-weight:bold; color:#fff; border-top:1px solid rgba(255,255,255,0.2); padding-top:15px;">
            <span>Total:</span>
            <span style="color:#00F0FF;">$${totalCartPrice.toFixed(2)}</span>
        </div>`;
        
    cartItemsContainer.innerHTML = cartHtml;
}

// حذف عنصر من السلة
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem("store_cart", JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    showToast("❌ Item removed from cart.");
};

// إرسال الطلب عبر الواتساب المنسق (تم إصلاح الرابط المقطوع وعلامة السلاش)
checkoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("❌ Your cart is empty!");
            return;
        }

        const ownerPhone = "201148705202"; 
        let message = `🛒 *New Order from Premium Store* \n\n`;
        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            message += `${index + 1}. *${item.name}* \n   Qty: ${item.qty} | Price: $${item.price.toFixed(2)} \n   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
        });

        message += `💰 *Grand Total: $${total.toFixed(2)}* \n\n Please confirm my order!`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me{ownerPhone}?text=${encodedMessage}`;

        // تفريغ السلة بعد إتمام الطلب بنجاح لإبقائها نظيفة
        cart = [];
        localStorage.removeItem("store_cart");
        updateCartBadge();
        if (cartModal) cartModal.style.display = 'none';

        // فتح الواتساب في نافذة جديدة بشكل صحيح
        window.open(whatsappUrl, '_blank');
    });
});
