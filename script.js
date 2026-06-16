// --- Initial Data ---
let defaultProducts = [
    {
        name: "Apple Watch Series 9",
        desc: "Advanced health features, powerful S9 chip, and a super-bright display.",
        price: 399.00,
        img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Samsung Galaxy Watch 6",
        desc: "Personalized HR zones, advanced sleep coaching, and sleek aluminum design.",
        price: 299.00,
        img: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Huawei Watch GT 4",
        desc: "Stunning geometric design, up to 14 days of battery life, and pro-level tracking.",
        price: 249.00,
        img: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500&auto=format&fit=crop&q=60"
    }
];

let productsData = JSON.parse(localStorage.getItem("productsData")) || defaultProducts;

// --- DOM Selection ---
const productsSection = document.getElementById('our-pro');
const addProductForm = document.getElementById('add-product-form');
const secretTrigger = document.querySelector('h1 span');
const adminPanel = document.querySelector('.admin-panel');
const authModal = document.getElementById('admin-auth-modal');
const passwordInput = document.getElementById('admin-secret-pass');
const cancelAuthBtn = document.getElementById('cancel-auth-btn');
const confirmAuthBtn = document.getElementById('confirm-auth-btn');
const toast = document.getElementById('custom-toast');

const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountBadge = document.getElementById('cart-count');
const checkoutButtons = document.querySelectorAll('.checkout-btn');

// نظام أمان وحماية السلة وتخزينها
let cart = [];
try {
    cart = JSON.parse(localStorage.getItem("cartData")) || [];
    if (!Array.isArray(cart)) cart = [];
} catch (e) {
    cart = [];
}

let clickCount = 0; 
let resetClickTimeout;

// --- Toast System ---
function showToast(message, isSuccess = true) {
    if (!toast) return;
    toast.innerText = message;
    toast.style.borderColor = isSuccess ? 'var(--neon-orange)' : '#ff3b30';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    renderStoreProducts();
    initCartSystem();
    updateCartUI();
});

// --- Render Store Products ---
function renderStoreProducts() {
    if (!productsSection) return;
    productsSection.innerHTML = '';
    
    productsData.forEach((product) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = "content-pro";
        cardDiv.innerHTML = `
            <button class="delete-product-btn" onclick="deleteStoreProduct('${product.name}')">
                <i class="fas fa-trash-alt"></i>
            </button>
            <h3>${product.name}</h3>
            <img src="${product.img}" alt="${product.name}">
            <p>${product.desc}</p>
            <h4>Price : ${product.price}$</h4>
            <button class="buy-btn" onclick="handleBuyClick('${product.name}')">Buy Now</button>
        `;
        productsSection.append(cardDiv);
    });
    
    if (adminPanel && adminPanel.style.display === 'block') {
        showDeleteButtons();
    }
}

// --- Admin Delete Management ---
function showDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-product-btn');
    deleteButtons.forEach(btn => btn.style.display = 'flex');
}

function deleteStoreProduct(productName) {
    productsData = productsData.filter(product => product.name !== productName);
    localStorage.setItem("productsData", JSON.stringify(productsData));
    renderStoreProducts();
    showToast(`تم حذف منتج (${productName}) من المتجر بنجاح 🗑️`, false);
}

// --- Admin Add Product ---
if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProduct = {
            name: document.getElementById('admin-pro-name').value,
            desc: document.getElementById('admin-pro-desc').value,
            price: parseFloat(document.getElementById('admin-pro-price').value),
            img: document.getElementById('admin-pro-img').value
        };
        
        productsData.push(newProduct);
        localStorage.setItem("productsData", JSON.stringify(productsData));
        
        renderStoreProducts();
        addProductForm.reset();
        showToast("تم حفظ المنتج الجديد ونشره بنجاح في المتجر! 🚀", true);
    });
}

// --- Cart System Logic ---
function initCartSystem() {
    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); cartModal.style.display = 'flex'; });
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartModal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
    });

    checkoutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast("السلة فارغة! أضف بعض المنتجات أولاً 🛒", false);
                return;
            }
            
            const myPhoneNumber = "201234567890"; 
            let message = "مرحباً، أود شراء المنتجات التالية من متجرك:\n\n";
            
            cart.forEach((item, index) => {
                message += `${index + 1}. ${item.name} - السعر: ${item.price}$ (الكمية: ${item.quantity})\n`;
            });
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            message += `\nTotal: ${total}$\n\nشكراً لك!`;
            
            const whatsappURL = `https://api.whatsapp.com/send?phone=${myPhoneNumber}&text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        });
    });
}

function handleBuyClick(productName) {
    const selectedProduct = productsData.find(p => p.name === productName);
    if (selectedProduct) {
        addToCart(selectedProduct);
    }
}

function addToCart(product) {
    const existingItem = cart.find(item => item.name === product.name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem("cartData", JSON.stringify(cart));
    updateCartUI();
    showToast(`تم إضافة ${product.name} إلى السلة 🛒`, true);
}

function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem("cartData", JSON.stringify(cart));
    updateCartUI();
    showToast("تم إزالة المنتج من السلة", false);
}

function updateCartUI() {
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    let totalItems = 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-text">Your cart is empty!</p>';
        if (cartCountBadge) cartCountBadge.innerText = '0';
        return;
    }
    
    cart.forEach((item) => {
        totalItems += item.quantity;
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item'; 
        itemRow.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-qty">x${item.quantity}</span>
            <span class="cart-item-price">${item.price * item.quantity}$</span>
            <button class="remove-item-btn" onclick="removeFromCart('${item.name}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        cartItemsContainer.append(itemRow);
    });
    
    if (cartCountBadge) cartCountBadge.innerText = totalItems;
}

// --- Admin Auth Modal ---
if (secretTrigger && authModal) {
    secretTrigger.addEventListener('click', () => {
        clickCount++;
        clearTimeout(resetClickTimeout);
        
        if (clickCount === 3) {
            clickCount = 0;
            passwordInput.value = ''; 
            authModal.style.display = 'flex'; 
            passwordInput.focus(); 
        }
        
        resetClickTimeout = setTimeout(() => { clickCount = 0; }, 2000);
    });
}

if (cancelAuthBtn) {
    cancelAuthBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
}

function verifyAdminPassword() {
    if (passwordInput.value === "123456") { 
        showToast("أهلاً بك يا أدمن! تم فتح اللوحة بنجاح 🔓", true);
        authModal.style.display = 'none';
        if (adminPanel) {
            adminPanel.style.display = 'block';
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        }
        showDeleteButtons(); 
    } else {
        showToast("عذراً، الرقم السري خطأ! لا يمكنك الدخول ❌", false);
        passwordInput.value = '';
        passwordInput.focus();
    }
}

if (confirmAuthBtn) {
    confirmAuthBtn.addEventListener('click', verifyAdminPassword);
}

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyAdminPassword();
    }
});

window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});