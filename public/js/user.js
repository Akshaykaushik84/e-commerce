const container = document.getElementById("cards-container");
const loggedInUser = localStorage.getItem("user");
const logout = document.querySelector('#logout');
const cartBtn = document.getElementById("cart");

cartBtn.addEventListener("click", () => {
  window.location.href = "/cart";
});

logout.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = "/";
});

document.getElementById("welcome-msg").textContent = `Welcome, ${loggedInUser}!`;

let currentPage = 1;
const itemsPerPage = 5;
let items = [];
let cart = [];

// ===== Fetch items from /items API =====
function fetchItems() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/items", true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      items = JSON.parse(xhr.responseText);
      fetchCart(); // Fetch cart after items load
    } else {
      console.error("Failed to load items:", xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error("Network error while loading items.");
  };

  xhr.send();
}

// ===== Fetch user's cart from backend =====
function fetchCart() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/cart/${loggedInUser}`, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      cart = JSON.parse(xhr.responseText);
      loadCards(); // render UI
    } else {
      console.error("Failed to load cart:", xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error("Network error while loading cart.");
  };

  xhr.send();
}

// ===== Load items cards with pagination =====
function loadCards() {
  container.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = items.slice(start, end);

  pageItems.forEach(item => {
    const cartItem = cart.find(c => c.name.toLowerCase() === item.name.toLowerCase());
    const inCartQty = cartItem ? cartItem.quantity : 0;

    const card = document.createElement("div");
    card.className = "card";

    const getControls = () => `
      <div class="controls">
        <button class="minus-btn">-</button>
        <span class="qty">${inCartQty}</span>
        <button class="plus-btn">+</button>
      </div>
    `;

    card.innerHTML = `
      <div class="display">
        <p><strong>Name:</strong> ${item.name}</p>
        <p><strong>Price:</strong> ₹${item.price}</p>
        <p><strong>Description:</strong> ${item.description}</p>
        <div class="btn-container">
          ${
            item.quantity === 0
              ? `<p style="color:red;font-weight:bold;">Out of Stock</p>`
              : inCartQty > 0
                ? getControls()
                : `<button class="add-btn">Add to Cart</button>`
          }
        </div>
      </div>
    `;

    // ===== Add to Cart button functionality =====
    const addBtn = card.querySelector(".add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addBtn.disabled = true; // disable button during API call
        addToCart(item, addBtn);
      });
    }

    // ===== Plus and Minus button functionality =====
    const plusBtn = card.querySelector(".plus-btn");
    const minusBtn = card.querySelector(".minus-btn");

    if (plusBtn && minusBtn) {
      plusBtn.addEventListener("click", () => {
        updateCartQuantity(item, 1);
      });

      minusBtn.addEventListener("click", () => {
        updateCartQuantity(item, -1);
      });
    }

    container.appendChild(card);
  });

  renderPagination(items);
}

// ===== Function to add item to cart via API =====
function addToCart(item, addBtn) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/cart/${loggedInUser}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    addBtn.disabled = false; // re-enable button

    if (xhr.status === 201) {
      const existing = cart.find(c => c.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          name: item.name,
          price: item.price,
          quantity: 1
        });
      }

      loadCards(); // re-render cards immediately
    } else {
      alert("Failed to add item to cart.");
    }
  };

  xhr.onerror = function () {
    addBtn.disabled = false;
    alert("Network error while adding to cart.");
  };

  xhr.send(JSON.stringify({
    name: item.name,
    price: item.price,
    quantity: 1
  }));
}

// ===== Function to update cart quantity (plus/minus) =====
function updateCartQuantity(item, change) {
  const cartItem = cart.find(c => c.name.toLowerCase() === item.name.toLowerCase());
  let newQty = cartItem ? cartItem.quantity + change : change;

  // ✅ STOCK LIMIT CONDITION (same as cart.js)
  if (change > 0 && newQty > item.quantity) {
    alert(`Only ${item.quantity} in stock`);
    return;
  }

  if (newQty < 1) {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", `/cart/${loggedInUser}/${item.name}`, true);

    xhr.onload = function () {
      if (xhr.status === 200) {
        cart = cart.filter(c => c.name.toLowerCase() !== item.name.toLowerCase());
        loadCards(); // refresh UI
      } else {
        alert("Failed to remove item from cart.");
      }
    };

    xhr.send();
  } else {
    const updatedCart = cart.map(ci =>
      ci.name.toLowerCase() === item.name.toLowerCase()
        ? { ...ci, quantity: newQty }
        : ci
    );

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/cart/${loggedInUser}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
        cart = updatedCart; // update local cart
        loadCards();
      } else {
        alert("Failed to update cart.");
      }
    };

    xhr.send(JSON.stringify(updatedCart));
  }
}

// ===== Pagination rendering =====
function renderPagination(items) {
  let pagination = document.getElementById("pagination");

  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    container.after(pagination);
  }

  pagination.innerHTML = "";

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "⟨ Prev";
  prevBtn.style.marginRight = "10px";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = function () {
    if (currentPage > 1) {
      currentPage--;
      loadCards();
    }
  };
  pagination.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next ⟩";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = function () {
    if (currentPage < totalPages) {
      currentPage++;
      loadCards();
    }
  };
  pagination.appendChild(nextBtn);

  pagination.style.textAlign = "center";
  pagination.style.marginTop = "20px";
}

// ===== Initialize =====
fetchItems();
