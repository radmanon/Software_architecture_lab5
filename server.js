const http = require('http');
const mysql = require('mysql2');
const fs = require('fs');  // For reading SSL certificates, didnt used but for later
require('dotenv').config();

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

const createPatientTable = () => {
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
};

createPatientTable();


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

                createPatientTable();

                if (query.toLowerCase().startsWith("insert")) {
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
            const sqlQuery = decodeURIComponent(url.slice(17)).trim();
            console.log(`Received SQL query: ${sqlQuery}`);


            createPatientTable();

            if (!sqlQuery.toLowerCase().startsWith('select')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Only SELECT queries are allowed' }));
                return;
            }

            con.query(sqlQuery, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Error fetching data: ${err.message}` }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
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

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



//**
// this code developed by getting assistance from ChatGPT (https://chat.openai.com/).
// the guide were on setup env file and query detection in GET and POST, it gave us idea how to detect the
// specific query type and handle it in each POST and GET. it also helped for setup the MySQL database in digitalOcean. 
// and the last thing it helped was the case that database doesnt exist and it gave us idea to use function and recall it.
//  */