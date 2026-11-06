
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ajay@2006",
    database: "gym_management"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }
    console.log("MySQL connected successfully!");
});

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all members
app.get("/api/members", (req, res) => {
    db.query(
        "SELECT * FROM members ORDER BY member_id DESC",
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Add a member
app.post("/api/members", (req, res) => {
    const { name, email, phone, join_date, status } = req.body;

    if (!name || !email || !join_date) {
        return res.status(400).json({
            error: "Name, email, and join date are required."
        });
    }

    const sql = `
        INSERT INTO members
        (name, email, phone, join_date, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, email, phone || null, join_date, status || "Active"],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: "Member added successfully!",
                member_id: result.insertId
            });
        }
    );
});

// Update a member
app.put("/api/members/:id", (req, res) => {
    const { name, email, phone, join_date, status } = req.body;
    const id = Number(req.params.id);

    const sql = `
        UPDATE members
        SET name = ?, email = ?, phone = ?, join_date = ?, status = ?
        WHERE member_id = ?
    `;

    db.query(
        sql,
        [name, email, phone || null, join_date, status, id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Member not found." });
            }

            res.json({ message: "Member updated successfully!" });
        }
    );
});

// Delete a member
app.delete("/api/members/:id", (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM members WHERE member_id = ?",
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Member not found." });
            }

            res.json({ message: "Member deleted successfully!" });
        }
    );
});

// Get membership plans
app.get("/api/plans", (req, res) => {
    db.query(
        "SELECT * FROM membership_plans ORDER BY plan_id",
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Add a membership plan
app.post("/api/plans", (req, res) => {
    const { plan_name, duration_months, fee, description } = req.body;

    const sql = `
        INSERT INTO membership_plans
        (plan_name, duration_months, fee, description)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [plan_name, duration_months, fee, description || null],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: "Plan added successfully!",
                plan_id: result.insertId
            });
        }
    );
});

// Get subscriptions
app.get("/api/subscriptions", (req, res) => {
    const sql = `
        SELECT s.subscription_id,
               m.name AS member_name,
               p.plan_name,
               s.start_date,
               s.end_date,
               s.payment_status
        FROM subscriptions s
        JOIN members m ON s.member_id = m.member_id
        JOIN membership_plans p ON s.plan_id = p.plan_id
        ORDER BY s.subscription_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Create a subscription
app.post("/api/subscriptions", (req, res) => {
    const {
        member_id,
        plan_id,
        start_date,
        end_date,
        payment_status
    } = req.body;

    if (!member_id || !plan_id || !start_date || !end_date) {
        return res.status(400).json({
            error: "Member, plan, start date, and end date are required."
        });
    }

    const sql = `
        INSERT INTO subscriptions
        (member_id, plan_id, start_date, end_date, payment_status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            member_id,
            plan_id,
            start_date,
            end_date,
            payment_status || "Pending"
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: "Subscription created successfully!",
                subscription_id: result.insertId
            });
        }
    );
});

// Dashboard statistics
app.get("/api/dashboard", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM members) AS totalMembers,
            (SELECT COUNT(*) FROM trainers) AS totalTrainers,
            (SELECT COUNT(*) FROM membership_plans) AS totalPlans,
            (SELECT COUNT(*) FROM subscriptions) AS totalSubscriptions
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(
        `Gym Management System running at http://localhost:${PORT}`
    );
});
