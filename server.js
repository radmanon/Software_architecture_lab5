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
    // Set default content-type for all responses
    
    res.setHeader("Access-Control-Allow-Origin", "*"); // allow any origin to access API
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // GET and POST and OPTIONS
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200, { 'Content-Type': 'application/json' });
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
            if (!data.name || !data.dateOfBirth) {
                res.writeHead(400);
                res.end('Error: Missing required fields (name, dateOfBirth)');
                return;
            }
            const query = 'INSERT INTO patient (name, dateOfBirth) VALUES (?, ?)';
            con.query(query, [data.name, data.dateOfBirth], (err, result) => {
                if (err) {
                    res.writeHead(500);
                    res.end(`Error inserting data: ${err.message}`);
                    return;
                }
                res.end(`${data.name} and ${data.dateOfBirth} successfully added to table patient`);
            });
        });
    } else if (req.method === 'GET') {
        if (url.startsWith('/lab5/api/v1/sql/')) {
            const sqlQuery = decodeURIComponent(url.slice(18));  // Extract the SQL query from the URL

            // Validate if the SQL query is a SELECT query
            if (!sqlQuery.toLowerCase().startsWith('select')) {
                res.writeHead(400);
                res.end("Error: Only SELECT queries are allowed");
                return;  // Return after sending the response to prevent further execution
            }

            // Execute the query
            con.query(sqlQuery, (err, result) => {
                if (err) {
                    res.writeHead(500);
                    res.end(`Error fetching data: ${err.message}`);
                    return; // Ensure no further response is sent after this
                }
                res.end(JSON.stringify(result));  // Convert the result to JSON and send the response
            });
        } else {
            res.writeHead(404);
            res.end("Error: Endpoint not found!");
        }
    } else {
        res.writeHead(405);
        res.end('Method not allowed!');
    }
});

// Use the PORT environment variable for correct port binding
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
