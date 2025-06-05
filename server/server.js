const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const User = require("./models/User");
const Product = require("./models/Product");
const Transaction = require("./models/Transaction");
const app = express();
const port = 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const mongoURI = "mongodb://localhost:27017/gellies-store";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Welcome to Gellie's Store backend!");
});

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "Registration successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({ message: "Login successful", user: { email } });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Add product endpoint with file upload
app.post("/api/products", upload.single("photo"), async (req, res) => {
  try {
    const { name, category, size, barcode, price } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const product = new Product({
      name,
      category,
      size,
      barcode,
      price,
      photo: photoUrl,
    });
    await product.save();
    res.json({ message: "Product added!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add product", error: error.message });
  }
});

// Update product
app.put("/api/products/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, category, size, barcode, price } = req.body;
    const updateData = { name, category, size, barcode, price };
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }
    await Product.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: "Product updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
});

// Save a new transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const { items } = req.body;
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in transaction." });
    }
    // Map items to { product, quantity }
    const transactionItems = items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));
    const transaction = new Transaction({ items: transactionItems });
    await transaction.save();
    res.json({ message: "Transaction saved!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save transaction", error: error.message });
  }
});

// Get all transactions (for your Transactions page)
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch transactions", error: error.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete transaction", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Gellie\'s Store server running on port ${port}`);
});
