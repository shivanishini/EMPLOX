const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

// Always load the environment file from the server folder
dotenv.config({
    path: path.join(__dirname, ".env")
});

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "emplox_project_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;