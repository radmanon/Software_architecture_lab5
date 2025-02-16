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
    res.writeHead(200, { 'Content-Type': 'application/json' });

    if (req.method === 'POST') {
        let body = "";
        req.on('data', function (chunk) {
            if (chunk != null) {
                body += chunk;
            }
        });

        req.on('end', () => {
            const data = JSON.parse(body);
            if (data.type === 'insert') {
                const query = 'INSERT INTO patient (name, dateOfBirth) VALUES (?, ?)';
                con.query(query, [data.name, data.dateOfBirth], (err, result) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(`Error inserting data: ${err.message}`);
                        return;
                    }
                    // Send the response after query execution
                    res.end(`${data.name} and ${data.dateOfBirth} successfully added to table patient`);
                });
            }
        });
    } else if (req.method === 'GET') {
        const query = 'SELECT * FROM patient';
        con.query(query, (err, result) => {
            if (err) {
                res.writeHead(500);
                res.end(`Error fetching data: ${err.message}`);
                return;
            }
            // Convert the result to JSON and send only once
            res.end(JSON.stringify(result));  // Convert the result to JSON and send the response
        });
    } else {
        res.writeHead(405);
        res.end('Method not allowed!');
    }
});

// Use the PORT environment variable for correct port binding
const PORT = process.env.PORT || 8080;  // Fallback to 8080 if PORT is not set
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
