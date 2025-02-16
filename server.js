const http = require('http')
const mysql = require('mysql2')


const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 25060,
    user: process.env.DB_USER,
    port: 25060,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

con.connect(function(err){
    if (err) throw err;
    console.log("Connected to database!");
})

con.query(
    `
    CREATE TABLE IF NOT EXISTS patient (
    patientid INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    dateOfBirth DATETIME NOT NULL
    ) ENGINE=InnoDB` // this specifies thstorage engine for MySQL which supports Atomicity, Consistency, Isolation and Durability
), (err) => {
    if (err) throw err;
    console.log("Patient table is created successfully and ready");
}


const server = http.createServer(function(req, res){
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.method === 'POST'){
        let body = "";
        req.on('data', function(chunk){
            if (chunk!= null) {
                body += chunk;
            }
        })

        req.on('end', ()=>{
            const data = JSON.parse(body);
            if (data.type === 'insert') {
                const query = 'INSERT INTO patient (name, dateOfBirth) VALUES (?, ?)'
                con.query(query, [data.name, data.dateOfBirth], (err, result) => {
                    if (err) throw err;
                    res.writeHead(200);
                    res.end(`${data.name} and ${data.dateOfBirth} successfuly added to table patient`);
                });
            }
        });
    } else if (req.method === 'GET'){
            const query = 'SELECT * FROM patient';
            con.query(query, (err, result) => {
                if (err) throw err;
                res.writeHead(200);
                res.end(result);
            });
        } else {
        res.writeHead(405);
        res.end('method not found!');
    }
});

// Use the PORT environment variable for the correct port
const PORT = process.env.PORT || 3000;  // Default to 3000 if no PORT is set
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});