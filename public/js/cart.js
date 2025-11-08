const cartContainer = document.getElementById("cart-container");
const totalBillEl = document.getElementById("total-bill");
const buyAllBtn = document.getElementById("buy-all-btn");
const cartBtn = document.getElementById("back");

const loggedInUser = localStorage.getItem("user");
document.getElementById("welcome-msg").textContent = `Welcome, ${loggedInUser}!`;

cartBtn.addEventListener("click", () => {
  window.location.href = "/user";
});

let cart = [];
let totalBill = 0;

// ======== Fetch Cart ========
function fetchCart() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/cart/${loggedInUser}`, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      cart = JSON.parse(xhr.responseText);
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
      renderCart();
    } else {
      alert("Error loading cart.");
    }
  };

  xhr.onerror = function () {
    alert("Network error.");
  };

  xhr.send();
}

// ======== Update Quantity ========
function updateQuantity(itemName, delta) {
  const item = cart.find(i => i.name === itemName);
  if (!item) return;

  const newQty = item.quantity + delta;

  // ✅ Admin-defined stock limit condition
  if (delta > 0 && newQty > item.stock) {
    alert(`Only ${item.stock} in stock`);
    return;
  }

  if (newQty <= 0) {
    removeFromCart(item.name);
  } else {
    item.quantity = newQty;

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/cart/${loggedInUser}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));
        fetchCart();
      } else {
        alert("Error updating quantity");
      }
    };

    xhr.onerror = function () {
      alert("Network error");
    };

    xhr.send(JSON.stringify(cart));
  }
}

// ======== Controls ========
function getControls(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "controls";
  wrapper.innerHTML = `
    <button class="dec">-</button>
    <span class="qty">${item.quantity}</span>
    <button class="inc">+</button>
  `;

  wrapper.querySelector(".dec").addEventListener("click", () => updateQuantity(item.name, -1));
  wrapper.querySelector(".inc").addEventListener("click", () => updateQuantity(item.name, 1));

  return wrapper;
}

// ======== Render Cart ========
function renderCart() {
  cartContainer.innerHTML = "";
  totalBill = 0;

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p style='text-align:center;'>Your cart is empty.</p>";
    totalBillEl.textContent = 0;
    return;
  }

  cart.forEach(item => {
    totalBill += item.price * item.quantity;

    const card = document.createElement("div");
    card.className = "cart-card";
    card.innerHTML = `
      <p><strong>Name:</strong> ${item.name}</p>
      <p><strong>Price:</strong> ₹${item.price}</p>
      <p><strong>Total:</strong> ₹${item.price * item.quantity}</p>
    `;

    const controls = getControls(item);
    card.appendChild(controls);

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.className = "remove-btn";
    btn.addEventListener("click", () => removeFromCart(item.name));
    card.appendChild(btn);

    cartContainer.appendChild(card);
  });

  totalBillEl.textContent = totalBill;
}

// ======== Remove ========
function removeFromCart(itemName) {
  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", `/cart/${loggedInUser}/${itemName}`, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      alert("Item removed");
      fetchCart();
    } else {
      alert("Error removing item");
    }
  };

  xhr.onerror = function () {
    alert("Network error");
  };

  xhr.send();
}

// ======== Buy All ========
buyAllBtn.addEventListener("click", function () {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  alert(`🎉 Order placed!\nTotal: ₹${totalBill}`);

  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `/cart/${loggedInUser}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
      fetchCart();
    } else {
      alert("Error clearing cart.");
    }
  };

  xhr.onerror = function () {
    alert("Network error.");
  };

  xhr.send(JSON.stringify([]));
});

// ======== Init ========
fetchCart();
