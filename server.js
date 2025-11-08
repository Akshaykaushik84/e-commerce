const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const app = express();
require('dotenv').config();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== File paths =====
const signupFile = path.join(__dirname, 'signup.json');
const itemsFile = path.join(__dirname, 'items.json');
const cartFile = path.join(__dirname, 'cart.json');

// ===== Initialize JSON files if not exist =====
const files = [signupFile, itemsFile, cartFile];
files.forEach(file => {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf-8').trim() === "") {
    fs.writeFileSync(file, file === cartFile ? JSON.stringify({}) : JSON.stringify([]));
  }
});

// ===== Utility to read JSON safely =====
function readJsonFileSafe(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf-8').trim();
    return data ? JSON.parse(data) : (filepath === cartFile ? {} : []);
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
    return filepath === cartFile ? {} : [];
  }
}

// ===== OTP Store (temporary in memory) =====
let otpStore = {};

// ===== Setup Nodemailer transporter =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,    // your gmail from .env
    pass: process.env.PASSWORD  // your app password from .env
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ===== Serve HTML pages =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html/index.html')));
app.get('/todo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html/todo.html')));
app.get('/user', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html/user.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html/cart.html')));

// ===== Send OTP =====
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
  otpStore[email] = {
    otp: otp,
    expires: Date.now() + 10 * 60 * 1000 // expires in 10 min
  };

  const mailOptions = {
    from: 'yourgmail@gmail.com',
    to: email,
    subject: 'Your OTP for Registration',
    text: `Your OTP is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to send OTP' });
    } else {
      console.log('OTP email sent: ' + info.response);
      res.status(200).json({ message: 'OTP sent to your email' });
    }
  });
});

// ===== Signup with OTP verification =====
app.post('/signup', (req, res) => {
  const { name, password, email, loginvalue, otp } = req.body;

  if (!name || !password || !email || !otp) {
    return res.status(400).json({ message: "All fields including OTP are required." });
  }

  const stored = otpStore[email];
  if (!stored || stored.otp != otp || Date.now() > stored.expires) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  const users = readJsonFileSafe(signupFile);
  if (users.find(u => u.name === name && u.loginvalue === loginvalue)) {
    return res.status(400).json({ message: "User already exists." });
  }

  users.push({ name, password, email, loginvalue });
  fs.writeFileSync(signupFile, JSON.stringify(users, null, 2));

  delete otpStore[email];

  res.status(200).json({ message: "Signup successful with OTP verification." });
});

// ===== Login =====
app.post('/login', (req, res) => {
  const { name, pass, loginValue } = req.body;
  if (!name || !pass || !loginValue) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const users = readJsonFileSafe(signupFile);
  const user = users.find(u => u.name === name && u.password === pass && u.loginvalue === loginValue);

  if (user) {
    const redirect = loginValue === "Admin" ? "/todo" : "/user";
    res.status(200).json({ message: `${loginValue} login successful.`, redirect });
  } else {
    res.status(400).json({ message: "Invalid credentials or user not found." });
  }
});

// ===== Items APIs =====
app.get('/items', (req, res) => res.json(readJsonFileSafe(itemsFile)));

app.post('/items', (req, res) => {
  const { name, price, quantity, description } = req.body;
  if (!name || !price || !quantity || quantity <= 0)
    return res.status(400).json({ message: "All fields are required with valid quantity." });

  const items = readJsonFileSafe(itemsFile);
  if (items.find(item => item.name.toLowerCase() === name.toLowerCase()))
    return res.status(400).json({ message: "Item already exists. Use update instead." });

  items.push({ name, price, quantity, description });
  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
  res.status(201).json({ message: "Item added successfully." });
});

app.put('/items/:name', (req, res) => {
  const { name } = req.params;
  const { price, quantity, description } = req.body;

  const items = readJsonFileSafe(itemsFile);
  const index = items.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  if (index === -1) return res.status(404).json({ message: "Item not found." });

  items[index] = { ...items[index], name, price, quantity, description };
  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
  res.json({ message: "Item updated successfully." });
});

app.delete('/items/:name', (req, res) => {
  const { name } = req.params;
  let items = readJsonFileSafe(itemsFile);
  const initialLength = items.length;
  items = items.filter(item => item.name.toLowerCase() !== name.toLowerCase());
  if (items.length === initialLength) return res.status(404).json({ message: "Item not found." });

  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
  res.json({ message: "Item deleted successfully." });
});

// ===== Cart APIs =====
app.get("/cart/:username", (req, res) => {
  const username = req.params.username;

  const userCart = JSON.parse(fs.readFileSync(cartFile, "utf8"));
  const items = JSON.parse(fs.readFileSync(itemsFile, "utf8"));

  const userItems = userCart[username] || [];

  // Merge stock info from items.json
  const mergedCart = userItems.map(cartItem => {
    const matchingItem = items.find(i => i.name === cartItem.name);
    return {
      ...cartItem,
      stock: matchingItem ? matchingItem.quantity : cartItem.quantity
    };
  });

  res.json(mergedCart);
});


app.post('/cart/:username', (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name || !price || !quantity)
    return res.status(400).json({ message: "All fields are required." });

  const carts = readJsonFileSafe(cartFile);
  const username = req.params.username;
  if (!carts[username]) carts[username] = [];

  const existing = carts[username].find(item => item.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.quantity += quantity;
  else carts[username].push({ name, price, quantity });

  fs.writeFileSync(cartFile, JSON.stringify(carts, null, 2));
  res.status(201).json({ message: "Item added to cart successfully." });
});

app.put('/cart/:username', (req, res) => {
  const carts = readJsonFileSafe(cartFile);
  carts[req.params.username] = req.body;
  fs.writeFileSync(cartFile, JSON.stringify(carts, null, 2));
  res.json({ message: "Cart updated successfully." });
});

app.delete('/cart/:username/:itemName', (req, res) => {
  const carts = readJsonFileSafe(cartFile);
  const { username, itemName } = req.params;

  if (!carts[username])
    return res.status(404).json({ message: "Cart not found for user." });

  carts[username] = carts[username].filter(item => item.name.toLowerCase() !== itemName.toLowerCase());
  fs.writeFileSync(cartFile, JSON.stringify(carts, null, 2));
  res.json({ message: "Item removed from cart successfully." });
});

// ===== Start Server =====
app.listen(PORT, () => console.log("✅ Server started at Port:", PORT));
