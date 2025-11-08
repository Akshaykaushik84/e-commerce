const submit = document.getElementById("submit");
const form = document.getElementById("form");
const cardsContainer = document.getElementById("cards-container");
const logout = document.querySelector('#logout');

logout.addEventListener('click', () => {
  if (!confirm("Are you sure you want to logout?")) return;
  localStorage.removeItem('loggedInUser');
  window.location.href = "/";
});

let items = [];
let formVisible = false;

// Fetch items on load
function fetchItems() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/items");
  xhr.onload = function () {
    if (xhr.status === 200) {
      items = JSON.parse(xhr.responseText);
      loadCards();
    } else {
      alert("Failed to load items");
    }
  };
  xhr.send();
}

submit.addEventListener("click", function () {
  if (!formVisible) {
    form.style.display = "flex";
    formVisible = true;
    return;
  }

  // Submit form
  let name = document.getElementById("name").value.trim();
  let price = document.getElementById("price").value;
  let quantity = parseInt(document.getElementById("quantity").value);
  let description = document.getElementById("des").value.trim();

  if (!name || !price || !quantity || quantity <= 0) {
    alert("Please fill all fields correctly.");
    return;
  }

  let found = items.find(item => item.name.toLowerCase() === name.toLowerCase());

  if (found) {
    // Update quantity via PUT
    found.quantity += quantity;

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/items/${encodeURIComponent(found.name)}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (xhr.status !== 200) alert("Failed to update item");
      fetchItems();
    };
    xhr.send(JSON.stringify(found));
  } else {
    // Add new item via POST
    const newItem = { name, price, quantity, description };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/items");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (xhr.status !== 201) {
        alert("Failed to add item.");
        return;
      }
      fetchItems();
    };
    xhr.send(JSON.stringify(newItem));
  }

  // Reset form
  form.reset();
  form.style.display = "none";
  formVisible = false;
});

function loadCards() {
  cardsContainer.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="display">
        <p><strong>Name:</strong> ${item.name}</p>
        <p><strong>Price:</strong> ₹${item.price}</p>
        <p><strong>Quantity:</strong> ${item.quantity}</p>
        <p><strong>Description:</strong> ${item.description}</p>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    const displayDiv = card.querySelector(".display");

    // Edit functionality
    card.querySelector(".edit-btn").addEventListener("click", function () {
      form.style.display = "none";
      submit.style.display = "none";

      displayDiv.innerHTML = `
        <input type="text" id="edit-name" value="${item.name}" />
        <input type="number" id="edit-price" value="${item.price}" />
        <input type="number" id="edit-quantity" value="${item.quantity}" />
        <input type="text" id="edit-des" value="${item.description}" />
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      `;

      // Save edited data
      displayDiv.querySelector(".save-btn").addEventListener("click", function () {
        let newName = displayDiv.querySelector("#edit-name").value.trim();
        let newPrice = displayDiv.querySelector("#edit-price").value;
        let newQuantity = parseInt(displayDiv.querySelector("#edit-quantity").value);
        let newDes = displayDiv.querySelector("#edit-des").value.trim();

        if (!newName || !newPrice || !newQuantity || newQuantity <= 0) {
          alert("Please enter valid details.");
          return;
        }

        const updatedItem = { name: newName, price: newPrice, quantity: newQuantity, description: newDes };

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `/items/${encodeURIComponent(item.name)}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function () {
          if (xhr.status !== 200) alert("Failed to update item.");
          submit.style.display = "block";
          fetchItems();
        };
        xhr.send(JSON.stringify(updatedItem));
      });

      // Cancel edit
      displayDiv.querySelector(".cancel-btn").addEventListener("click", function () {
        submit.style.display = "block";
        loadCards();
      });
    });

    // Delete functionality
    card.querySelector(".delete-btn").addEventListener("click", function () {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `/items/${encodeURIComponent(item.name)}`);
      xhr.onload = function () {
        if (xhr.status !== 200) alert("Failed to delete item.");
        fetchItems();
      };
      xhr.send();
    });

    cardsContainer.appendChild(card);
  });
}

fetchItems();
