const mysql = require("mysql2/promise");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hola_app",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL database connected successfully");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
}

// Initialize connection test
testConnection();

/**
 * Execute a SELECT query and return the first row or null
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Object|null>} First row or null
 */
async function dbGet(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Database GET error:", error.message);
    throw error;
  }
}

/**
 * Execute INSERT, UPDATE, DELETE queries
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Object>} Result with insertId, affectedRows, etc.
 */
async function dbRun(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      warningCount: result.warningCount,
    };
  } catch (error) {
    console.error("Database RUN error:", error.message);
    throw error;
  }
}

/**
 * Execute a SELECT query and return all rows
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Array>} Array of rows
 */
async function dbAll(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database ALL error:", error.message);
    throw error;
  }
}

/**
 * Execute a COUNT query and return the count number
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<number>} Count result
 */
async function dbCount(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    const result = rows[0];
    return result ? Object.values(result)[0] || 0 : 0;
  } catch (error) {
    console.error("Database COUNT error:", error.message);
    throw error;
  }
}

/**
 * Execute an EXISTS query and return boolean
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
async function dbExists(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows.length > 0;
  } catch (error) {
    console.error("Database EXISTS error:", error.message);
    throw error;
  }
}

/**
 * Execute an INSERT and return the inserted row
 * @param {string} table - Table name
 * @param {Object} data - Data to insert {column: value}
 * @returns {Promise<Object>} The inserted row
 */
async function dbInsert(table, data) {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);

    // Return the inserted row
    const insertedRow = await dbGet(`SELECT * FROM ${table} WHERE id = ?`, [
      result.insertId,
    ]);
    return insertedRow;
  } catch (error) {
    console.error("Database INSERT error:", error.message);
    throw error;
  }
}

/**
 * Execute an UPDATE and return the updated row
 * @param {string} table - Table name
 * @param {Object} data - Data to update {column: value}
 * @param {string} whereClause - WHERE clause (e.g., "id = ?")
 * @param {Array} whereParams - Parameters for WHERE clause
 * @returns {Promise<Object|null>} The updated row or null if not found
 */
async function dbUpdate(table, data, whereClause, whereParams = []) {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    await pool.execute(sql, [...values, ...whereParams]);

    // Return the updated row
    const updatedRow = await dbGet(
      `SELECT * FROM ${table} WHERE ${whereClause}`,
      whereParams
    );
    return updatedRow;
  } catch (error) {
    console.error("Database UPDATE error:", error.message);
    throw error;
  }
}

/**
 * Execute a DELETE query
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (e.g., "id = ?")
 * @param {Array} whereParams - Parameters for WHERE clause
 * @returns {Promise<Object>} Result with affectedRows
 */
async function dbDelete(table, whereClause, whereParams = []) {
  try {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const [result] = await pool.execute(sql, whereParams);
    return {
      affectedRows: result.affectedRows,
      success: result.affectedRows > 0,
    };
  } catch (error) {
    console.error("Database DELETE error:", error.message);
    throw error;
  }
}

/**
 * Execute a paginated SELECT query
 * @param {string} sql - Base SQL query without LIMIT
 * @param {Array} params - Parameters for the query
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<Object>} Object with data, pagination info
 */
async function dbPaginate(sql, params = [], page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countSql = sql.replace(
      /SELECT .+ FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const totalResult = await dbCount(countSql, params);

    // Get paginated data
    const paginatedSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
    const data = await dbAll(paginatedSql, params);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: totalResult,
        totalPages: Math.ceil(totalResult / pageSize),
        hasNext: page * pageSize < totalResult,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Database PAGINATE error:", error.message);
    throw error;
  }
}

/**
 * Execute a query within a transaction
 * @param {Function} callback - Function that receives connection and executes queries
 * @returns {Promise<any>} Result of the callback
 */
async function dbTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close the database connection pool
 */
async function closeConnection() {
  try {
    await pool.end();
    console.log("MySQL connection pool closed");
  } catch (error) {
    console.error("Error closing MySQL connection:", error.message);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Closing MySQL connection...");
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Closing MySQL connection...");
  await closeConnection();
  process.exit(0);
});

module.exports = {
  pool,
  dbGet,
  dbRun,
  dbAll,
  dbCount,
  dbExists,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbPaginate,
  dbTransaction,
  closeConnection,
};
