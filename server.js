const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "8767485861",  // 🔹 change if your MySQL password is different
  database: "dsycafe_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ================== DISHES ==================

// Get all dishes
app.get("/api/dishes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM dishes");
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// Search dishes by name or description
app.get("/api/dishes/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });
  try {
    const [rows] = await pool.query(
      "SELECT * FROM dishes WHERE name LIKE ? OR description LIKE ?",
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error searching dishes" });
  }
});

// Get dishes by price range
app.get("/api/dishes/price", async (req, res) => {
  const min = parseFloat(req.query.min) || 0;
  const max = parseFloat(req.query.max) || 10000;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM dishes WHERE price BETWEEN ? AND ?",
      [min, max]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching dishes by price" });
  }
});

// Get single dish by ID
app.get("/api/dishes/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM dishes WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Dish not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add new dish
app.post("/api/dishes", async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO dishes (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, category, image_url]
    );
    res.json({ message: "✅ Dish added!", dishId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding dish" });
  }
});

// Update dish
app.put("/api/dishes/:id", async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  try {
    await pool.query(
      "UPDATE dishes SET name=?, description=?, price=?, category=?, image_url=? WHERE id=?",
      [name, description, price, category, image_url, req.params.id]
    );
    res.json({ message: "✅ Dish updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating dish" });
  }
});

// Delete dish
app.delete("/api/dishes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM dishes WHERE id = ?", [req.params.id]);
    res.json({ message: "🗑️ Dish deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting dish" });
  }
});



// Bulk update dish prices
app.put("/api/dishes/bulk-price", async (req, res) => {
  const { ids, price } = req.body; // ids: [1,2,3]
  if (!Array.isArray(ids) || !price) return res.status(400).json({ error: "Invalid request" });
  try {
    await pool.query("UPDATE dishes SET price=? WHERE id IN (?)", [price, ids]);
    res.json({ message: "✅ Prices updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating prices" });
  }
});

// ================== ORDERS ==================

// Place an order
app.post("/api/orders", async (req, res) => {
  const { customer, items, total, paymentMethod } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO orders (customer_name, email, phone, address, notes, items, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.notes || "",
        JSON.stringify(items),
        total,
        paymentMethod,
        "Pending"
      ]
    );
    res.json({ message: "✅ Order placed!", orderId: result.insertId });
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database error while placing order" });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching orders" });
  }
});

// Get total sales / revenue
app.get("/api/orders/total-sales", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT SUM(total) as totalRevenue, COUNT(*) as totalOrders FROM orders"
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching total sales" });
  }
});

// Get most popular dishes
app.get("/api/orders/popular-dishes", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dishId, SUM(quantity) as totalSold
      FROM orders, JSON_TABLE(items, '$[*]' COLUMNS (
        dishId INT PATH '$.dishId', 
        quantity INT PATH '$.quantity'
      )) as jt
      GROUP BY dishId
      ORDER BY totalSold DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching popular dishes" });
  }
});

// Get single order by ID
app.get("/api/orders/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching order" });
  }
});

// Get orders by customer email
app.get("/api/orders/customer/:email", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE email = ?", [req.params.email]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching customer orders" });
  }
});

// Get orders by status
app.get("/api/orders/status/:status", async (req, res) => {
  const { status } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE status = ?", [status]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching orders by status" });
  }
});



// Update order status
app.put("/api/orders/:id/status", async (req, res) => {
  const { status } = req.body; // e.g., Pending, Preparing, Delivered
  try {
    await pool.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ message: `✅ Order status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating order status" });
  }
});

// Delete order
app.delete("/api/orders/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ message: "🗑️ Order deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting order" });
  }
});
  
// ================== STATS ==================
app.get("/api/stats", async (req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query(
      "SELECT COUNT(*) AS totalOrders FROM orders WHERE status IN ('Pending', 'Preparing')"
    );

    // 10 mins for current customer + 10 mins for each other active order
    const estimatedTime = 10 + (totalOrders - 1) * 10;

    res.json({
      activeOrders: totalOrders,
      estimatedTime: estimatedTime > 0 ? estimatedTime : 10 // minimum 10 mins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching stats" });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`✅ DSY Cafe backend running on http://localhost:${PORT}`);
});

app.use(express.json());


app.listen(3000, () => console.log("Server running on port 3000"));