#!/usr/bin/env node
// backend/scripts/verifyEnv.js
/**
 * Environment Variable Verification Script
 *
 * This script verifies that all environment variables are:
 * 1. Defined in .env file
 * 2. Accessible in the application
 * 3. Have valid values according to their type
 *
 * Usage: node scripts/verifyEnv.js
 *
 * Requirements: Task 5 - Configuration - Server Startup and Environment
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env");

if (!existsSync(envPath)) {
  console.error("❌ .env file not found at:", envPath);
  process.exit(1);
}

dotenv.config({ path: envPath });

// Import validation after dotenv is loaded
const { validateEnvironment, getEnvDefinitions } = await import(
  "../utils/validateEnv.js"
);

console.log("=".repeat(60));
console.log("Environment Variable Verification Script");
console.log("=".repeat(60));
console.log();

// Get all environment definitions
const definitions = getEnvDefinitions();

// Categorize variables
const required = [];
const optional = [];

for (const [key, def] of Object.entries(definitions)) {
  if (def.required) {
    required.push({ key, ...def });
  } else {
    optional.push({ key, ...def });
  }
}

console.log("📋 REQUIRED Environment Variables:");
console.log("-".repeat(60));

let allRequiredPresent = true;
for (const { key, description, type } of required) {
  const value = process.env[key];
  const isSet = value !== undefined && value !== "";
  const status = isSet ? "✅" : "❌";

  if (!isSet) {
    allRequiredPresent = false;
  }

  // Mask sensitive values
  let displayValue = value;
  if (
    isSet &&
    (key.includes("SECRET") ||
      key.includes("PASS") ||
      key.includes("PASSWORD") ||
      key.includes("TOKEN"))
  ) {
    displayValue =
      value.substring(0, 4) + "****" + value.substring(value.length - 4);
  } else if (isSet && key === "MONGODB_URI") {
    // Mask MongoDB URI credentials
    displayValue = value.replace(/:([^:@]+)@/, ":****@");
  }

  console.log(`${status} ${key}`);
  console.log(`   Type: ${type}`);
  console.log(`   Description: ${description}`);
  console.log(`   Value: ${isSet ? displayValue : "(not set)"}`);
  console.log();
}

console.log();
console.log("📋 OPTIONAL Environment Variables:");
console.log("-".repeat(60));

for (const { key, description, type, default: defaultValue } of optional) {
  const value = process.env[key];
  const isSet = value !== undefined && value !== "";
  const status = isSet ? "✅" : "⚪";

  // Mask sensitive values
  let displayValue = value;
  if (
    isSet &&
    (key.includes("SECRET") ||
      key.includes("PASS") ||
      key.includes("PASSWORD") ||
      key.includes("TOKEN"))
  ) {
    displayValue =
      value.substring(0, 4) + "****" + value.substring(value.length - 4);
  }

  console.log(`${status} ${key}`);
  console.log(`   Type: ${type}`);
  console.log(`   Description: ${description}`);
  if (defaultValue !== undefined) {
    console.log(`   Default: ${defaultValue}`);
  }
  console.log(`   Value: ${isSet ? displayValue : "(using default)"}`);
  console.log();
}

console.log();
console.log("=".repeat(60));
console.log("Validation Results:");
console.log("=".repeat(60));
console.log();

// Run full validation
const results = validateEnvironment({ exitOnError: false, logResults: false });

if (results.valid) {
  console.log("✅ All environment variables are valid!");
} else {
  console.log("❌ Validation failed with the following errors:");
  results.errors.forEach((error) => {
    console.log(`   - ${error}`);
  });
}

if (results.warnings.length > 0) {
  console.log();
  console.log("⚠️  Warnings:");
  results.warnings.forEach((warning) => {
    console.log(`   - ${warning}`);
  });
}

console.log();
console.log("=".repeat(60));
console.log("Summary:");
console.log("=".repeat(60));
console.log(`Total Required: ${required.length}`);
console.log(`Total Optional: ${optional.length}`);
console.log(`Validation: ${results.valid ? "PASSED" : "FAILED"}`);
console.log(`Errors: ${results.errors.length}`);
console.log(`Warnings: ${results.warnings.length}`);
console.log();

// Exit with appropriate code
process.exit(results.valid ? 0 : 1);
