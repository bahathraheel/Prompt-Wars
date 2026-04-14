/**
 * validate.js — EXO Health Check Validator
 *
 * Uses the Antigravity Browser subagent to visit the API documentation page
 * to confirm the service is officially 'operational' when a local check fails.
 *
 * Usage:  node validate.js
 *
 * This script:
 * 1. Hits the local /api/health endpoint
 * 2. If the check fails, launches a browser subagent to visit
 *    https://www.google.com/search?q=docs.github.com
 *    and scrapes the page to confirm the external service is operational
 * 3. Logs the result and appends to checks.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const CHECKS_FILE = path.join(__dirname, 'checks.json');
const DOCS_URL = 'https://www.google.com/search?q=docs.github.com';

// ─── Utility: Read / Write checks.json ───────────────────────────────

function readChecks() {
  try {
    return JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeCheck(entry) {
  const checks = readChecks();
  checks.unshift(entry);
  fs.writeFileSync(CHECKS_FILE, JSON.stringify(checks.slice(0, 10), null, 2));
}

// ─── Step 1: Local Health Check ──────────────────────────────────────

function localHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response from /api/health'));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timed out'));
    });
  });
}

// ─── Step 2: Browser Subagent Validation ─────────────────────────────
//
// In a real Antigravity environment, this function would invoke the
// browser subagent to visit the documentation URL and confirm
// the service is operational. Here we define the agentic task:

function browserSubagentValidation() {
  /*
   * ANTIGRAVITY BROWSER SUBAGENT TASK:
   *
   * Task: "Navigate to https://www.google.com/search?q=docs.github.com
   *        and check if the search results contain a link to
   *        'docs.github.com'. If the link is present and accessible,
   *        report the service as 'operational'. If the page fails to load
   *        or the link is missing, report 'degraded'."
   *
   * Expected Return:
   *   { status: 'operational' | 'degraded', url: string, timestamp: string }
   *
   * This would be called via the Antigravity browser_subagent tool:
   *
   *   browser_subagent({
   *     TaskName: "Validate External Service",
   *     Task: "Navigate to https://www.google.com/search?q=docs.github.com. "
   *         + "Check if 'docs.github.com' appears in the search results. "
   *         + "Return whether the service is 'operational' or 'degraded'.",
   *     RecordingName: "exo_validation",
   *   });
   */

  // Simulate the subagent response for standalone execution
  console.log(`\n  🌐 Browser subagent would visit: ${DOCS_URL}`);
  console.log('  📋 Checking if docs.github.com appears in search results...');

  return new Promise((resolve) => {
    // Use built-in https to do a lightweight check
    const https = require('https');
    const url = new URL(DOCS_URL);

    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        const isOperational = body.toLowerCase().includes('docs.github.com');
        resolve({
          status: isOperational ? 'operational' : 'degraded',
          url: DOCS_URL,
          timestamp: new Date().toISOString(),
          evidence: isOperational
            ? 'docs.github.com found in search results'
            : 'docs.github.com NOT found in search results',
        });
      });
    });

    req.on('error', () => {
      resolve({
        status: 'degraded',
        url: DOCS_URL,
        timestamp: new Date().toISOString(),
        evidence: 'Failed to reach search page',
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 'degraded',
        url: DOCS_URL,
        timestamp: new Date().toISOString(),
        evidence: 'Request timed out',
      });
    });
  });
}

// ─── Main Execution ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   EXO Validate — Health Check Runner     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  let localResult = null;
  let needsBrowserCheck = false;

  // Step 1: Local health check
  console.log('  ⏳ Running local health check...');
  try {
    localResult = await localHealthCheck();
    console.log(`  ✅ Local check PASSED — Status: ${localResult.status}`);
    console.log(`     Uptime: ${Math.floor(localResult.uptime)}s`);
  } catch (err) {
    console.log(`  ❌ Local check FAILED — ${err.message}`);
    needsBrowserCheck = true;
    localResult = {
      status: 'down',
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 2: If local check failed, invoke browser subagent
  if (needsBrowserCheck) {
    console.log('\n  🔄 Local check failed. Invoking browser subagent...');
    const browserResult = await browserSubagentValidation();
    console.log(`  🌐 External service: ${browserResult.status}`);
    console.log(`     Evidence: ${browserResult.evidence}`);

    const check = {
      type: 'validation',
      localStatus: 'down',
      externalStatus: browserResult.status,
      evidence: browserResult.evidence,
      url: browserResult.url,
      timestamp: new Date().toISOString(),
    };

    writeCheck(check);
    console.log('\n  📝 Check recorded to checks.json');
  } else {
    const check = {
      type: 'validation',
      localStatus: 'operational',
      externalStatus: 'skipped',
      timestamp: new Date().toISOString(),
    };
    writeCheck(check);
    console.log('\n  📝 Check recorded to checks.json');
  }

  console.log('\n  Done. ✨\n');
}

main().catch(console.error);
