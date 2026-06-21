// ==================== نظام التحميل الذاتي لـ Firebase ====================
function loadFirebaseSDK(url) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

async function initStoreSystem() {
    // تحميل مكتبات Firebase سحابياً
    await loadFirebaseSDK("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
    await loadFirebaseSDK("https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js");

    // إعدادات Firebase الخاصة بمشروعك
    const firebaseConfig = {
        apiKey: "AIzaSyA5AbMppaL0IxyQc-62YLrfRcFwDY9zyyO",
        authDomain: "shopping-online-7dcfd.firebaseapp.com",
        projectId: "shopping-online-7dcfd",
        storageBucket: "shopping-online-7dcfd.firebasestorage.app",
        messagingSenderId: "607216310901",
        appId: "1:607216310901:web:32983e797fee695394f63c",
        measurementId: "G-ML69JF8GCH"
    };

    // تشغيل الفايربيس
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // العناصر البرمجية (DOM Elements)
    const productsSection = document.getElementById('our-pro');
    const addProductForm = document.getElementById('add-product-form');
    const secretTrigger = document.getElementById('secret-admin-trigger');
    const adminPanel = document.querySelector('.admin-panel');
    const authModal = document.getElementById('admin-auth-modal');
    const passwordInput = document.getElementById('admin-secret-pass');
    const cancelAuthBtn = document.getElementById('cancel-auth-btn');
    const confirmAuthBtn = document.getElementById('confirm-auth-btn');
    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const checkoutButtons = document.querySelectorAll('.checkout-btn');

    // نظام حماية السلة المتكامل لمنع أخطاء الكونسول (try...catch)
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem("store_cart")) || [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        cart = [];
    }
    
    let productToDeleteId = null; 

    // بناء نافذة الحذف المخصصة التلقائية
    createConfirmModalHTML();

    // جلب المنتجات السحابية فورياً ومراقبة التحديثات
    db.collection("store_products").onSnapshot((snapshot) => {
        if (!productsSection) return;
        if (snapshot.empty) {
            productsSection.innerHTML = `<p class="empty-cart-text" style="grid-column: 1/-1;">No products available right now!</p>`;
            return;
        }
        let html = "";
        snapshot.forEach((doc) => {
            const prod = doc.data();
            const prodId = doc.id;
            html += `
                <div class="product-card">
                    <img src="${prod.image}" alt="${prod.name}">
                    <h3>${prod.name}</h3>
                    <p>${prod.desc}</p>
                    <div class="price">$${parseFloat(prod.price).toFixed(2)}</div>
                    <button class="buy-btn" onclick="addToCart('${prodId}', '${prod.name}', ${prod.price})">Add To Cart</button>
                    <button class="admin-delete-btn" onclick="showCustomConfirm('${prodId}')" style="display: ${adminPanel && adminPanel.style.display === 'block' ? 'block' : 'none'}; position:absolute; top:15px; right:15px; background:#ff3b30; color:white; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; z-index:10; font-weight:bold;">Delete</button>
                </div>
            `;
        });
        productsSection.innerHTML = html;
        updateCartBadge();
    });

    // إضافة منتج جديد من لوحة الإدمن
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-pro-name').value.trim();
            const desc = document.getElementById('admin-pro-desc').value.trim();
            const price = parseFloat(document.getElementById('admin-pro-price').value.trim());
            const img = document.getElementById('admin-pro-img').value.trim();

            db.collection("store_products").add({
                name: name, desc: desc, price: price, image: img,
                createdAt: new Date()
            }).then(() => {
                showToast("🔥 Product Published Online!");
                addProductForm.reset();
            });
        });
    }

    // بناء نافذة تأكيد الحذف
    function createConfirmModalHTML() {
        if (document.getElementById('custom-confirm-modal')) return;
        const confirmModal = document.createElement('div');
        confirmModal.id = 'custom-confirm-modal';
        confirmModal.className = 'auth-modal';
        confirmModal.style.display = 'none';
        confirmModal.innerHTML = `
            <div class="auth-modal-content" style="border-color: #ff3b30;">
                <h3>Confirm Delete <i class="fas fa-trash-alt" style="color: #ff3b30;"></i></h3>
                <p>Are you sure you want to delete this product online?</p>
                <div class="auth-modal-btns">
                    <button id="cancel-delete-btn" style="background:#efefef;">Cancel</button>
                    <button id="confirm-delete-btn" style="background:#ff3b30; color:white;">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            if (productToDeleteId) {
                db.collection("store_products").doc(productToDeleteId).delete().then(() => {
                    showToast("🗑️ Product deleted successfully.");
                    confirmModal.style.display = 'none';
                });
            }
        });
    }

    window.showCustomConfirm = function(id) {
        productToDeleteId = id;
        document.getElementById('custom-confirm-modal').style.display = 'flex';
    };

    // التحكم بنظام الحماية السري للأدمن
    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => { authModal.style.display = 'flex'; passwordInput.focus(); });
    }
    if (cancelAuthBtn) {
        cancelAuthBtn.addEventListener('click', () => { authModal.style.display = 'none'; passwordInput.value = ''; });
    }
    if (confirmAuthBtn) confirmAuthBtn.addEventListener('click', handleAuth);

    // ==================== نظام التحقق الجديد المتوافق مع تعديل الفايربيس ====================
    async function handleAuth() {
        const enteredPassword = passwordInput.value.trim();
        if (!enteredPassword) return;

        showToast("⏳ Verifying...");
        try {
            // نطلب المستند اللي اسمه مطابق تماماً للباسورد المدخل
            const adminRef = db.collection("admin_settings").doc(enteredPassword);
            const doc = await adminRef.get();

            // إذا المستند موجود، إذن الباسورد صحيح 100%
            if (doc.exists) {
                if (adminPanel) adminPanel.style.display = 'block';
                authModal.style.display = 'none';
                passwordInput.value = '';
                showToast("🔓 Unlocked Admin Panel!");
                document.querySelectorAll('.admin-delete-btn').forEach(b => b.style.display = 'block');
            } else {
                showToast("❌ Invalid Password!");
            }
        } catch (error) {
            showToast("❌ Invalid Password!");
        }
    }

    // نظام سلة المشتريات والطلبات المحلية
    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); if (cartModal) cartModal.style.display = 'flex'; renderCartItems(); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartModal) cartModal.style.display = 'none'; });

    window.addToCart = function(id, name, price) {
        const existing = cart.find(item => item.id === id);
        if (existing) existing.qty++; else cart.push({ id, name, price, qty: 1 });
        localStorage.setItem("store_cart", JSON.stringify(cart));
        updateCartBadge();
        showToast(`🛒 Added ${name}!`);
    };

    function updateCartBadge() {
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;
        if (cart.length === 0) { cartItemsContainer.innerHTML = `<p class="empty-cart-text">Your cart is empty!</p>`; return; }
        let cartHtml = "";
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price * item.qty;
            cartHtml += `
                <div class="cart-item">
                    <div>
                        <span class="cart-item-name">${item.name}</span><br>
                        <small>$${item.price} x ${item.qty}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="cart-item-qty">${item.qty}</span>
                        <button class="remove-item-btn" onclick="removeFromCart(${index})">&times;</button>
                    </div>
                </div>`;
        });
        cartHtml += `<div style="display:flex; justify-content:space-between; margin-top:15px; font-weight:bold;"><span>Total:</span><span>$${total.toFixed(2)}</span></div>`;
        cartItemsContainer.innerHTML = cartHtml;
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        localStorage.setItem("store_cart", JSON.stringify(cart));
        updateCartBadge();
        renderCartItems();
    };

    // إرسال الطلب عبر الواتساب
    checkoutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (cart.length === 0) { showToast("⚠️ Cart is empty!"); return; }
            let text = "🛒 *New Store Order* \n\n";
            let total = 0;
            cart.forEach((item, i) => {
                total += item.price * item.qty;
                text += `${i+1}. *${item.name}* (x${item.qty}) - $${item.price * item.qty}\n`;
            });
            text += `\n💰 *Total Price: $${total.toFixed(2)}*`;
            window.open(`https://wa.me/201148705202?text=${encodeURIComponent(text)}`, '_blank');
            cart = [];
            localStorage.removeItem("store_cart");
            updateCartBadge();
            cartModal.style.display = 'none';
        });
    });
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener("DOMContentLoaded", initStoreSystem);