// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const app = express();
const port = process.env.PORT || 5700;

// Resolve paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ===== MYSQL CONNECTION =====
let db;
async function initDB() {
  try {
    db = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "Virmatics@123",
      database: "virmatics",
      waitForConnections: true,
      connectionLimit: 10,
    });
    console.log("✅ Connected to MySQL database");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
}
initDB();

// Allowed sections → table mapping
const sections = {
  removals: "removals",
  interventions: "interventions",
  installations: "installations",
  remarks: "remarks",
};

// ========== DASHBOARD ROUTES ==========

// Get all sections (full dashboard)
app.get("/api/dashboard", async (req, res) => {
  try {
    const data = {};
    for (const [section, table] of Object.entries(sections)) {
      const [rows] = await db.query(`SELECT * FROM ${table}`);
      data[section] = rows;
    }
    res.json(data);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Get one section
app.get("/api/:section", async (req, res) => {
  const { section } = req.params;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    const [rows] = await db.query(`SELECT * FROM ${table}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch section data" });
  }
});

// Create new row
app.post("/api/:section", async (req, res) => {
  const { section } = req.params;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    let query, values;
    if (section === "remarks") {
      query = `INSERT INTO remarks (company, reg, date, type, severity, status) VALUES (?, ?, ?, ?, ?, ?)`;
      values = [req.body.company, req.body.reg, req.body.date, req.body.type, req.body.severity, req.body.status];
    } else {
      query = `INSERT INTO ${table} (company, reg, date, location, status) VALUES (?, ?, ?, ?, ?)`;
      values = [req.body.company, req.body.reg, req.body.date, req.body.location, req.body.status];
    }

    const [result] = await db.query(query, values);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ error: "Failed to insert row" });
  }
});

// Create new ticket
app.post("/api/tickets", async (req, res) => {
  try {
    // Generate ticket ID
    const [countResult] = await db.query("SELECT COUNT(*) as count FROM tickets");
    const ticketNumber = (countResult[0].count + 1).toString().padStart(4, '0');
    const ticketId = `TKT-${ticketNumber}`;
    
    // Map form values to database values
    const statusMap = {
      'open': 'Open',
      'in_progress': 'In Progress', 
      'pending': 'Pending',
      'completed': 'Completed',
      'overdue': 'Overdue',
      'closed': 'Closed'
    };
    
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    
    // Map assignee codes to full names
    const assigneeMap = {
      'anushree': 'Anushree Soondrum',
      'ashia': 'Ashia Choony',
      'avotra': 'Avotra Andriatsilavina',
      'eshan': 'Eshan Chitamun',
      'samuel': 'Samuel Timothy',
      'lovikesh': 'Lovikesh Seewoogolam',
      'mansoor': 'Mansoor Ahmad Bhugeloo'
    };
    
    const mappedStatus = statusMap[req.body.status] || req.body.status || 'Open';
    const mappedPriority = priorityMap[req.body.priority] || req.body.priority || 'Low';
    const mappedAssignee = assigneeMap[req.body.assignedTo] || req.body.assignedTo || null;
    const mappedCreatedBy = assigneeMap[req.body.requester] || req.body.createdBy || 'System';
    
    const query = `INSERT INTO tickets (id, title, description, status, priority, assignedTo, createdBy, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      ticketId,
      req.body.title,
      req.body.description,
      mappedStatus,
      mappedPriority,
      mappedAssignee,
      mappedCreatedBy,
      req.body.dueDate || null
    ];

    console.log('Creating ticket with values:', values);
    const [result] = await db.query(query, values);
    
    // Return the ticket with mapped values
    const newTicket = {
      id: ticketId,
      title: req.body.title,
      description: req.body.description,
      status: mappedStatus,
      priority: mappedPriority,
      assignedTo: mappedAssignee,
      createdBy: mappedCreatedBy,
      dueDate: req.body.dueDate || null,
      createdAt: new Date().toISOString()
    };
    
    console.log('Ticket created successfully:', newTicket);
    res.status(201).json({ success: true, data: newTicket });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// Update row by index (for inline editing)
app.patch("/api/:section", async (req, res) => {
  const { section } = req.params;
  const { index, row } = req.body;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    // Get all rows to find the one at the specified index
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY date DESC`);
    if (index >= rows.length) return res.status(404).json({ error: "Row not found" });
    
    const targetRow = rows[index];
    let query, values;
    
    if (section === "remarks") {
      query = `UPDATE remarks SET company=?, reg=?, date=?, type=?, severity=?, status=? WHERE id=?`;
      values = [row.company, row.reg, row.date, row.type, row.severity, row.status, targetRow.id];
    } else {
      query = `UPDATE ${table} SET company=?, reg=?, date=?, location=?, status=? WHERE id=?`;
      values = [row.company, row.reg, row.date, row.location, row.status, targetRow.id];
    }

    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Row not found" });

    res.json({ success: true, data: row });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: "Failed to update row" });
  }
});

// Delete row by index
app.delete("/api/:section", async (req, res) => {
  const { section } = req.params;
  const { index } = req.body;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    // Get all rows to find the one at the specified index
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY date DESC`);
    if (index >= rows.length) return res.status(404).json({ error: "Row not found" });
    
    const targetRow = rows[index];
    const [result] = await db.query(`DELETE FROM ${table} WHERE id=?`, [targetRow.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Row not found" });

    res.json({ success: true, id: targetRow.id });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete row" });
  }
});
// Update row
app.put("/api/:section/:id", async (req, res) => {
  const { section, id } = req.params;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    let query, values;
    if (section === "remarks") {
      query = `UPDATE remarks SET company=?, reg=?, date=?, type=?, severity=?, status=? WHERE id=?`;
      values = [req.body.company, req.body.reg, req.body.date, req.body.type, req.body.severity, req.body.status, id];
    } else {
      query = `UPDATE ${table} SET company=?, reg=?, date=?, location=?, status=? WHERE id=?`;
      values = [req.body.company, req.body.reg, req.body.date, req.body.location, req.body.status, id];
    }

    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Row not found" });

    res.json({ id, ...req.body });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: "Failed to update row" });
  }
});

// Delete row
app.delete("/api/:section/:id", async (req, res) => {
  const { section, id } = req.params;
  const table = sections[section];
  if (!table) return res.status(404).json({ error: "Invalid section" });

  try {
    const [result] = await db.query(`DELETE FROM ${table} WHERE id=?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Row not found" });

    res.json({ success: true, id });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete row" });
  }
});

// ========== TICKETS ROUTES ==========

// Get all tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM tickets ORDER BY createdAt DESC`);
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Update ticket
app.put("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `UPDATE tickets SET title=?, description=?, status=?, priority=?, assignedTo=?, createdBy=?, dueDate=? WHERE id=?`;
    const values = [req.body.title, req.body.description, req.body.status, req.body.priority, req.body.assignedTo, req.body.createdBy, req.body.dueDate, id];

    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Ticket not found" });

    res.json({ success: true, data: { id, ...req.body } });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// Delete ticket
app.delete("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(`DELETE FROM tickets WHERE id=?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Ticket not found" });

    res.json({ success: true, id });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});
// ========== HOMEPAGE ==========
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
