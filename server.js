const http = require('http');
const mysql = require('mysql2');
const fs = require('fs');  // For reading SSL certificates
require('dotenv').config();

// Replace these with your actual values
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to database!");
});

con.query(
    `
    CREATE TABLE IF NOT EXISTS patient (
    patientid INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    dateOfBirth DATETIME NOT NULL
    ) ENGINE=InnoDB`, (err) => {
    if (err) {
        console.error("Error creating table:", err);
        return;
    }
    console.log("Patient table is created successfully and ready");
});

const server = http.createServer(function (req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*"); // allow any origin to access API
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // GET and POST and OPTIONS
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === 'OPTIONS') {
        // Respond immediately to OPTIONS requests
        res.writeHead(204); // No content needed
        res.end();
        return;
    }
    
    const url = req.url;

    if (req.method === 'POST') {
        let body = "";
        req.on('data', function (chunk) {
            if (chunk != null) {
                body += chunk;
            }
        });

        req.on('end', () => {
            const data = JSON.parse(body);
            if (data.query) {
                const query = data.query.trim();
                if (query.toLowerCase().startsWith("insert")) {
                    // Handle INSERT query
                    con.query(query, (err, result) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: `Error executing INSERT query: ${err.message}` }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: `Data successfully inserted into the patient table.` }));
                    });
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Only INSERT queries are allowed in POST' }));
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No query provided in the POST request' }));
            }
        });
    } else if (req.method === 'GET') {
        if (url.startsWith('/lab5/api/v1/sql/')) {
            const sqlQuery = decodeURIComponent(url.slice(17)).trim();  // Extract and trim the SQL query
            console.log(`Received SQL query: ${sqlQuery}`);  // Log the query for debugging

            // Validate if the SQL query is a SELECT query (case-insensitive)
            if (!sqlQuery.toLowerCase().startsWith('select')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Only SELECT queries are allowed' }));
                return;  // Return after sending the response to prevent further execution
            }

            // Execute the query
            con.query(sqlQuery, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Error fetching data: ${err.message}` }));
                    return; // Ensure no further response is sent after this
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));  // Convert the result to JSON and send the response
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found!' }));
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed!' }));
    }
});

// Use the PORT environment variable for correct port binding
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
