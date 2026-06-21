// ==================== 1. إعدادات Firebase الخاصة بمشروعك ====================
const firebaseConfig = {
    apiKey: "AIzaSyA5AbMppaL0IxyQc-62YLrfRcFwDY9zyyO",
    authDomain: "://firebaseapp.com",
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
                    
                    <button class="admin-delete-btn" onclick="deleteOnlineProduct('${prodId}')" style="display: ${adminPanel.style.display === 'block' ? 'block' : 'none'}; position:absolute; top:10px; right:10px; background:#ff4d4d; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer;">Delete</button>
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

document.addEventListener("DOMContentLoaded", listenToOnlineProducts);

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

// ==================== 6. نظام السلة (Cart System) ====================
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

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = total;
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}