const http = require('http')
const mysql = require("mysql");


const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "lab5"
});

con.connect(function(err){
    if (err) throw err;
    console.log("Connected!");
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
    res.writeHead('Content-Type', 'application/json');
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

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})