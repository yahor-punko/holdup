#!/usr/bin/env node

/**
 * mavp-operator-agent.js
 *
 * Compact JSON summary for the Main Agent to read at session start.
 * Outputs a single JSON object with current stage, active slice, status, and blockers.
 * Computes next_action dynamically from active tasks + dependency graph.
 * Runs parliamentary validator silently and appends WARNING if artifacts are drifting.
 *
 * Usage: ./scripts/mavp-operator --agent
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { generateProcessStateMd } = require('./mavp-operator-lib');

const ROOT = path.resolve(__dirname, '..');
const PROCESS_STATE_JSON = path.join(ROOT, 'PROCESS_STATE.json');
const PROCESS_STATE_MD = path.join(ROOT, 'PROCESS_STATE.md');
const TASK_STATUS_MD = path.join(ROOT, 'TASK_STATUS.md');
const BACKLOG_MD = path.join(ROOT, 'BACKLOG.md');
const VALIDATOR = path.join(
  process.env.MAVERICKS_SCRIPTS || path.join(require('node:os').homedir(), 'Documents', 'mavericks', 'scripts'),
  'parliamentary-validator-parser-v1.js'
);
const MAVERICKS_VERSION_FILE = path.join(__dirname, 'mavp-version.js');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function normalizeWhitespace(value) {
  return value ? value.replace(/\s+/g, ' ').trim() : '';
}

function readProcessStateJson() {
  try {
    if (!fs.existsSync(PROCESS_STATE_JSON)) return null;
    return JSON.parse(readUtf8(PROCESS_STATE_JSON));
  } catch {
    return null;
  }
}

function parseProcessStateMd(markdown) {
  const lines = markdown.split(/\r?\n/);

  function getSection(heading) {
    const start = lines.findIndex((l) => l.trim() === heading.trim());
    if (start === -1) return '';
    let end = lines.length;
    const level = (heading.match(/^#+/) || [''])[0].length;
    for (let i = start + 1; i < lines.length; i += 1) {
      const m = lines[i].match(/^(#+)\s+/);
      if (m && m[1].length <= level) { end = i; break; }
    }
    return lines.slice(start + 1, end).join('\n').trim();
  }

  function listItems(section) {
    return section.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^[-*]/.test(l)).map((l) => normalizeWhitespace(l.replace(/^[-*]\s+/, '')));
  }

  return {
    initiative: normalizeWhitespace(getSection('## Current initiative')),
    stage: normalizeWhitespace(getSection('## Current loop stage')),
    blockers: listItems(getSection('## Current blockers')),
    nextHandoff: listItems(getSection('## Next expected handoff')),
    lastUpdate: normalizeWhitespace(getSection('## Last update')),
  };
}

function parseActiveTaskStatus(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Active tasks/.test(l));
  if (start === -1) return [];

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) { end = i; break; }
  }

  const section = lines.slice(start + 1, end).join('\n');
  const blocks = section.split(/\n(?=###\s+T-)/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const headingMatch = block.match(/^###\s+(T-\d+)\s+—\s+(.+)$/m);
    const statusMatch = block.match(/^- \*\*Status:\*\*\s+(.+)$/m);
    const ownerMatch = block.match(/^- \*\*Owner[^:]*:\*\*\s+(.+)$/m);
    return {
      id: headingMatch ? headingMatch[1] : 'unknown',
      title: headingMatch ? normalizeWhitespace(headingMatch[2]) : 'unknown',
      status: statusMatch ? normalizeWhitespace(statusMatch[1]) : 'unknown',
      owner: ownerMatch ? normalizeWhitespace(ownerMatch[1]) : 'unknown',
    };
  });
}

/**
 * Compute next_action dynamically from active tasks + dependency graph in BACKLOG.
 * Returns the first planned/in_progress task with all dependencies merged.
 * Falls back to staticFallback if no unblocked task found.
 */
function computeNextAction(activeTasks, staticFallback) {
  const ACTIVE_STATUSES = new Set(['planned', 'in_progress', 'needs_fix']);
  const mergedIds = new Set(
    activeTasks.filter(t => t.status === 'merged').map(t => t.id)
  );

  let backlogDeps = {};
  try {
    const backlog = readUtf8(BACKLOG_MD);
    const blocks = backlog.split(/\n(?=###\s+T-)/).filter(Boolean);
    for (const block of blocks) {
      const idMatch = block.match(/^###\s+(T-\d+)/m);
      const depMatch = block.match(/^- \*\*Depends on:\*\*\s+(.+)$/m);
      if (idMatch && depMatch) {
        const raw = depMatch[1].trim();
        const deps = raw === '—' ? [] : raw.split(/[,\s]+/).filter(d => /^T-\d+$/.test(d));
        backlogDeps[idMatch[1]] = deps;
      }
    }
  } catch { /* backlog optional */ }

  for (const task of activeTasks) {
    if (!ACTIVE_STATUSES.has(task.status)) continue;
    const deps = backlogDeps[task.id] || [];
    const depsOk = deps.every(dep => mergedIds.has(dep));
    if (depsOk) {
      return `${task.id} → ${task.owner} → ${task.title}`;
    }
  }

  return staticFallback || null;
}

const PARLIAMENTARY_STAGES = new Set([
  'signal_intake', 'research', 'head_interpretation', 'packet_ready',
  'main_agent_decision', 'slice_conversion', 'qa_review',
  'merged_complete', 'deferred', 'rejected', 'abandoned',
]);

function detectGovernance(stage) {
  if (PARLIAMENTARY_STAGES.has(stage)) return true;
  const govDir = path.join(ROOT, 'docs', 'governance');
  try {
    if (!fs.existsSync(govDir)) return false;
    const files = fs.readdirSync(govDir);
    return files.some(f => f.startsWith('PARLIAMENTARY_DECISION_PACKET') && !f.endsWith('TEMPLATE.md'));
  } catch { return false; }
}

/**
 * Compare stored mavericks_version in PROCESS_STATE.json against current framework version.
 * Returns update notice string or null if up to date.
 */
function checkFrameworkVersion(json) {
  try {
    const { MAVERICKS_VERSION } = require(MAVERICKS_VERSION_FILE);
    const stored = json?.mavericks_version;
    if (!stored) return null;
    if (stored !== MAVERICKS_VERSION) {
      return `Framework updated: project uses v${stored}, current is v${MAVERICKS_VERSION}. Run: ./scripts/mavp-operator --install --update .`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Run validator silently. Returns warning string or null if healthy.
 */
function runValidatorCheck() {
  try {
    execSync(`node "${VALIDATOR}"`, { stdio: 'pipe' });
    return null;
  } catch (err) {
    const code = err.status;
    if (code === 1) return 'DRIFTING — BACKLOG and TASK_STATUS are out of sync. Run --close-session.';
    if (code === 2) return 'REPAIR REQUIRED — critical artifact mismatch. Run --close-session immediately.';
    return `Validator error (exit ${code}): ${err.message}`;
  }
}

function main() {
  generateProcessStateMd(PROCESS_STATE_JSON, PROCESS_STATE_MD);

  const json = readProcessStateJson();
  const md = parseProcessStateMd(readUtf8(PROCESS_STATE_MD));
  const activeTasks = parseActiveTaskStatus(readUtf8(TASK_STATUS_MD));

  const stage = json?.stage || md.stage || 'unknown';
  const initiative = json?.initiative || md.initiative || 'unknown';
  const blocker = json?.blocker || (md.blockers.length > 0 ? md.blockers[0] : null);
  const staticNextAction = json?.next_action || (md.nextHandoff.length > 0 ? md.nextHandoff[0] : null);
  const lastUpdated = json?.last_updated || md.lastUpdate || 'unknown';
  const stageOwner = json?.stage_owner || 'main_agent';

  const next_action = computeNextAction(activeTasks, staticNextAction);
  const validatorWarning = runValidatorCheck();
  const updateNotice = checkFrameworkVersion(json);
  const wave = json?.wave || null;
  const governance = detectGovernance(stage);

  const output = {
    initiative,
    stage,
    stage_owner: stageOwner,
    ...(wave ? { wave } : {}),
    ...(governance ? { governance: true } : {}),
    active_slices: activeTasks,
    blocker,
    next_action,
    last_updated: lastUpdated,
    ...(validatorWarning ? { WARNING: validatorWarning } : {}),
    ...(updateNotice ? { UPDATE_AVAILABLE: updateNotice } : {}),
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`agent summary failed: ${error.message}\n`);
  process.exitCode = 1;
}
