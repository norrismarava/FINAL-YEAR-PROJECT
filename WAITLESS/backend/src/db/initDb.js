import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { query, getPool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  console.log("Initializing database...");
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        // Ignore errors for tables that already exist
        if (!error.message.includes("already exists")) {
          console.error("Error executing statement:", statement);
          throw error;
        }
      }
    }
    
    console.log("Database schema initialized successfully.");
    
    // Seed departments if they don't exist
    const departments = [
      "OPD",
      "Pharmacy",
      "Laboratory",
      "Radiology",
      "OI Clinic",
      "Casualty",
    ];
    
    for (const dept of departments) {
      try {
        await query("INSERT IGNORE INTO departments (name) VALUES (?)", [dept]);
      } catch (error) {
        console.error(`Error inserting department ${dept}:`, error.message);
      }
    }
    
    console.log("Departments seeded successfully.");
    
    // Seed system counters if they don't exist
    const counters = [
      { name: "ticket_sequence", value: 0 },
      { name: "notification_sequence", value: 0 },
    ];
    
    for (const counter of counters) {
      try {
        await query(
          "INSERT IGNORE INTO system_counters (name, value) VALUES (?, ?)",
          [counter.name, counter.value]
        );
      } catch (error) {
        console.error(`Error inserting counter ${counter.name}:`, error.message);
      }
    }
    
    console.log("System counters seeded successfully.");
    
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  } finally {
    await getPool().end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log("Database initialization complete.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database initialization failed:", error);
      process.exit(1);
    });
}

export { initializeDatabase };
