const express = require("express");
const router = express.Router();

// These come from environment variables (set on Render), never typed into the code,
// because this repository is public.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function supabaseHeaders(extra = {}) {
    const headers = {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        ...extra
    };
    // Older "anon" keys are JWTs (start with eyJ) and also go in Authorization
    if (SUPABASE_KEY && SUPABASE_KEY.startsWith("eyJ")) {
        headers.Authorization = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
}

function isConfigured(res) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        res.status(500).json({
            error: "Server is missing SUPABASE_URL or SUPABASE_KEY environment variables."
        });
        return false;
    }
    return true;
}

// Reads a response body safely (it may be empty or not JSON)
async function readBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

// GET /customers  ->  list all customers from Supabase
router.get("/", async (req, res) => {
    if (!isConfigured(res)) return;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/customer?select=*&order=customerid.asc`,
            { headers: supabaseHeaders() }
        );
        const data = await readBody(response);
        res.status(response.status).json(data);
    } catch (err) {
        res.status(502).json({ error: "Could not reach Supabase", details: err.message });
    }
});

// POST /customers  ->  insert one customer into Supabase
router.post("/", async (req, res) => {
    if (!isConfigured(res)) return;

    const { customerid, lastname, firstname, mobileno, address } = req.body || {};

    // Validate the input before sending it to the database
    if (customerid === undefined || customerid === null || customerid === "") {
        return res.status(400).json({ error: "customerid is required" });
    }
    if (!Number.isInteger(Number(customerid))) {
        return res.status(400).json({ error: "customerid must be a whole number" });
    }
    if (!lastname || !firstname) {
        return res.status(400).json({ error: "lastname and firstname are required" });
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/customer`, {
            method: "POST",
            headers: supabaseHeaders({ Prefer: "return=representation" }),
            body: JSON.stringify({
                customerid: Number(customerid),
                lastname,
                firstname,
                mobileno,
                address
            })
        });

        const data = await readBody(response);

        if (!response.ok) {
            // Passes Supabase's error (for example duplicate id, code 23505) back to the app
            return res.status(response.status).json(data);
        }

        res.status(201).json(Array.isArray(data) ? data[0] : data);
    } catch (err) {
        res.status(502).json({ error: "Could not reach Supabase", details: err.message });
    }
});

module.exports = router;
