#!/usr/bin/env node

/**
 * mavp-operator-close-session.js
 *
 * End-of-session ritual:
 * 1. Reads active tasks from TASK_STATUS.md
 * 2. Prompts operator to mark tasks as merged / needs_fix / keep
 * 3. Updates TASK_STATUS.md and PROCESS_STATE.md
 * 4. Runs parliamentary validator and reports health
 * 5. If all tasks merged (wave complete), prompts git push
 *
 * Usage:
 *   ./scripts/mavp-operator --close-session
 *   ./scripts/mavp-operator --close-session --non-interactive [--summary "text"] [--mark-merged T-001,T-002]
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { execSync } = require('node:child_process');
const { generateProcessStateMd, archiveActiveWaveInBacklog } = require('./mavp-operator-lib');

const ROOT = process.env.MAVERICKS_PROJECT_ROOT || path.resolve(__dirname, '..');
const TASK_STATUS_MD = path.join(ROOT, 'TASK_STATUS.md');
const PROCESS_STATE_MD = path.join(ROOT, 'PROCESS_STATE.md');
const PROCESS_STATE_JSON = path.join(ROOT, 'PROCESS_STATE.json');
const BACKLOG_MD = path.join(ROOT, 'BACKLOG.md');
const VALIDATOR = path.join(
  process.env.MAVERICKS_SCRIPTS || path.join(require('node:os').homedir(), 'Documents', 'mavericks', 'scripts'),
  'parliamentary-validator-parser-v1.js'
);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function readUtf8(p) { return fs.readFileSync(p, 'utf8'); }
function writeUtf8(p, content) { fs.writeFileSync(p, content, 'utf8'); }

function parseActiveTasks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(l => /^##\s+Active tasks/.test(l));
  if (start === -1) return [];

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { end = i; break; }
  }

  const section = lines.slice(start + 1, end).join('\n');
  const blocks = section.split(/\n(?=###\s+T-)/).map(b => b.trim()).filter(Boolean);

  return blocks.map(block => {
    const headingMatch = block.match(/^###\s+(T-\d+)\s+—\s+(.+)$/m);
    const statusMatch = block.match(/^- \*\*Status:\*\*\s+(.+)$/m);
    return {
      id: headingMatch?.[1] || 'unknown',
      title: headingMatch?.[2]?.trim() || 'unknown',
      status: statusMatch?.[1]?.trim() || 'unknown',
    };
  });
}

function updateTaskStatusField(markdown, taskId, field, value) {
  const lines = markdown.split(/\r?\n/);
  let inTask = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^###\s+/.test(lines[i])) {
      inTask = lines[i].includes(taskId + ' ') || lines[i].includes(taskId + ' —');
    }
    if (inTask && new RegExp(`^- \\*\\*${field}:\\*\\*`).test(lines[i])) {
      lines[i] = `- **${field}:** ${value}`;
    }
  }

  return lines.join('\n');
}

function moveTaskToCompleted(markdown, taskId) {
  const lines = markdown.split(/\r?\n/);

  let taskStart = -1;
  let taskEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/^###\s+/.test(lines[i]) && (lines[i].includes(taskId + ' ') || lines[i].includes(taskId + ' —'))) {
      taskStart = i;
    } else if (taskStart !== -1 && (/^###\s+/.test(lines[i]) || /^##\s+/.test(lines[i]))) {
      taskEnd = i;
      break;
    }
  }

  if (taskStart === -1) return markdown;

  const taskBlock = lines.slice(taskStart, taskEnd);
  const remaining = [...lines.slice(0, taskStart), ...lines.slice(taskEnd)];

  const completedIdx = remaining.findIndex(l => /^##\s+Recently completed tasks/.test(l));
  if (completedIdx === -1) return markdown;

  return [
    ...remaining.slice(0, completedIdx + 1),
    '',
    ...taskBlock,
    ...remaining.slice(completedIdx + 1)
  ].join('\n');
}

function updateProcessState(markdown, nextAction) {
  const today = new Date().toISOString().slice(0, 10);
  let updated = markdown;

  updated = updated.replace(
    /^## Last update\n[\s\S]*?(?=\n##|$)/m,
    `## Last update\n${today}\n`
  );

  if (nextAction) {
    updated = updated.replace(
      /^## Next expected handoff\n[\s\S]*?(?=\n##)/m,
      `## Next expected handoff\n- ${nextAction}\n`
    );
  }

  const movementMatch = updated.match(/^## Last meaningful movement\n([\s\S]*?)(?=\n##)/m);
  if (movementMatch) {
    const existing = movementMatch[1].trimEnd();
    updated = updated.replace(
      movementMatch[0],
      `## Last meaningful movement\n${existing}\n- ${today}: Session closed.\n`
    );
  }

  return updated;
}

function runValidator() {
  try {
    const result = execSync(`node "${VALIDATOR}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, output: result };
  } catch (err) {
    return { ok: false, output: err.stdout || err.message, code: err.status };
  }
}

function updateProcessStateJson(nextAction, waveComplete) {
  const today = new Date().toISOString().slice(0, 10);
  let current = {};
  try {
    if (fs.existsSync(PROCESS_STATE_JSON)) {
      current = JSON.parse(readUtf8(PROCESS_STATE_JSON));
    }
  } catch { /* start fresh */ }

  const currentWave = Number(current.wave) || 1;
  const updated = {
    ...current,
    next_action: nextAction || current.next_action || null,
    last_updated: today,
    wave: waveComplete ? currentWave + 1 : currentWave,
    stage: waveComplete ? 'planning' : (current.stage || 'execution'),
  };
  writeUtf8(PROCESS_STATE_JSON, JSON.stringify(updated, null, 2) + '\n');
  return updated.wave;
}

function tryGitPush() {
  try {
    execSync('git push', { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

async function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function parseArgs(argv) {
  const args = {
    nonInteractive: false,
    summary: null,
    markMerged: [],
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--non-interactive') {
      args.nonInteractive = true;
    } else if (argv[i] === '--summary' && argv[i + 1]) {
      args.summary = argv[++i];
    } else if (argv[i] === '--mark-merged' && argv[i + 1]) {
      args.markMerged = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return args;
}

async function runNonInteractive(args) {
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n${BOLD}MavP Close Session${RESET} ${DIM}${today}${RESET} ${DIM}[non-interactive]${RESET}\n`);

  const taskStatusContent = readUtf8(TASK_STATUS_MD);
  const activeTasks = parseActiveTasks(taskStatusContent);

  if (activeTasks.length) {
    console.log(`${BOLD}Active tasks:${RESET}`);
    activeTasks.forEach(t => console.log(`  ${t.id} — ${t.title} ${DIM}[${t.status}]${RESET}`));
    console.log('');
  }

  let updatedContent = taskStatusContent;

  // Apply --mark-merged
  for (const taskId of args.markMerged) {
    const task = activeTasks.find(t => t.id === taskId);
    if (!task) {
      console.log(`${YELLOW}⚠ ${taskId} not found in active tasks — skipping${RESET}`);
      continue;
    }
    updatedContent = updateTaskStatusField(updatedContent, taskId, 'Status', 'merged');
    updatedContent = updateTaskStatusField(updatedContent, taskId, 'Notes', `Completed ${today}.`);
    updatedContent = moveTaskToCompleted(updatedContent, taskId);
    console.log(`  ${GREEN}✓ ${taskId} → merged${RESET}`);
  }

  // Write TASK_STATUS.md
  writeUtf8(TASK_STATUS_MD, updatedContent);
  console.log(`${GREEN}✓ TASK_STATUS.md updated${RESET}`);

  // Update PROCESS_STATE.md if it exists
  const remainingTasks = parseActiveTasks(updatedContent);
  let nextAction = null;
  if (remainingTasks.length > 0) {
    const first = remainingTasks[0];
    nextAction = `${first.id} → developer → ${first.title}`;
  }

  if (fs.existsSync(PROCESS_STATE_MD)) {
    const processContent = readUtf8(PROCESS_STATE_MD);
    writeUtf8(PROCESS_STATE_MD, updateProcessState(processContent, nextAction));
    console.log(`${GREEN}✓ PROCESS_STATE.md updated${RESET}`);
  }

  // Update PROCESS_STATE.json — also write wave_summary if --summary provided
  const allMerged = args.markMerged.length > 0 && remainingTasks.length === 0;
  const newWave = updateProcessStateJsonNonInteractive(nextAction, allMerged, args.summary);
  console.log(`${GREEN}✓ PROCESS_STATE.json updated${allMerged ? ` — wave → ${newWave}` : ''}${RESET}`);

  // Archive Active Wave heading in BACKLOG.md when wave is complete
  if (allMerged) {
    const closedWaveNumber = newWave - 1;
    const archiveResult = archiveActiveWaveInBacklog(BACKLOG_MD, closedWaveNumber);
    if (!archiveResult.ok) {
      console.log(`${YELLOW}⚠ BACKLOG.md wave archive warning:${RESET}\n${archiveResult.warning}`);
    } else if (archiveResult.archived) {
      console.log(`${GREEN}✓ BACKLOG.md — Wave ${closedWaveNumber} heading archived${RESET}`);
    } else if (archiveResult.warning) {
      console.log(`${YELLOW}⚠ ${archiveResult.warning}${RESET}`);
    }
  }

  // Regenerate PROCESS_STATE.md from JSON
  generateProcessStateMd(PROCESS_STATE_JSON, PROCESS_STATE_MD);
  console.log(`${GREEN}✓ PROCESS_STATE.md regenerated from JSON${RESET}`);

  if (args.summary) {
    console.log(`  ${DIM}wave_summary written${RESET}`);
  }

  // Run validator
  console.log(`\n${BOLD}Running validator...${RESET}`);
  const validatorResult = runValidator();
  if (validatorResult.ok) {
    console.log(`${GREEN}✓ Validator passed — artifacts in sync${RESET}`);
  } else {
    console.log(`${RED}✗ Validator issues (exit ${validatorResult.code}):${RESET}`);
    console.log(validatorResult.output);
  }

  console.log(`\n${BOLD}Session closed.${RESET}\n`);
}

function updateProcessStateJsonNonInteractive(nextAction, waveComplete, summary) {
  const today = new Date().toISOString().slice(0, 10);
  let current = {};
  try {
    if (fs.existsSync(PROCESS_STATE_JSON)) {
      current = JSON.parse(readUtf8(PROCESS_STATE_JSON));
    }
  } catch { /* start fresh */ }

  const currentWave = Number(current.wave) || 1;
  const updated = {
    ...current,
    next_action: nextAction || current.next_action || null,
    last_updated: today,
    wave: waveComplete ? currentWave + 1 : currentWave,
    stage: waveComplete ? 'planning' : (current.stage || 'execution'),
  };

  if (summary !== null) {
    updated.wave_summary = summary;
  }

  writeUtf8(PROCESS_STATE_JSON, JSON.stringify(updated, null, 2) + '\n');
  return updated.wave;
}

async function runInteractive() {
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n${BOLD}MavP Close Session${RESET} ${DIM}${today}${RESET}\n`);

  const taskStatusContent = readUtf8(TASK_STATUS_MD);
  const activeTasks = parseActiveTasks(taskStatusContent);

  if (!activeTasks.length) {
    console.log(`${GREEN}No active tasks. Nothing to close.${RESET}\n`);
  } else {
    console.log(`${BOLD}Active tasks:${RESET}`);
    activeTasks.forEach(t => console.log(`  ${t.id} — ${t.title} ${DIM}[${t.status}]${RESET}`));
    console.log('');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let updatedContent = taskStatusContent;
  let allMerged = activeTasks.length > 0;

  for (const task of activeTasks) {
    const answer = await prompt(rl, `${BOLD}${task.id}${RESET} — ${task.title}\n  [m]erged / [n]eeds_fix / [k]eep / [enter] skip: `);
    const choice = answer.trim().toLowerCase();

    if (choice === 'm' || choice === 'merged') {
      const notesAnswer = await prompt(rl, `  Notes (optional, enter to skip): `);
      const notes = notesAnswer.trim() || `Completed ${today}.`;
      updatedContent = updateTaskStatusField(updatedContent, task.id, 'Status', 'merged');
      updatedContent = updateTaskStatusField(updatedContent, task.id, 'Notes', notes);
      updatedContent = moveTaskToCompleted(updatedContent, task.id);
      console.log(`  ${GREEN}✓ ${task.id} → merged${RESET}\n`);
    } else if (choice === 'n' || choice === 'needs_fix') {
      updatedContent = updateTaskStatusField(updatedContent, task.id, 'Status', 'needs_fix');
      console.log(`  ${YELLOW}⚠ ${task.id} → needs_fix${RESET}\n`);
      allMerged = false;
    } else {
      console.log(`  ${DIM}skipped${RESET}\n`);
      allMerged = false;
    }
  }

  // Compute next action from remaining active tasks
  const remainingTasks = parseActiveTasks(updatedContent);
  let nextAction = null;
  if (remainingTasks.length > 0) {
    const first = remainingTasks[0];
    nextAction = `${first.id} → developer → ${first.title}`;
  }

  const nextAnswer = await prompt(rl, `Next action [${nextAction || 'wave complete'}]: `);
  if (nextAnswer.trim()) nextAction = nextAnswer.trim();

  rl.close();

  // Write artifacts
  writeUtf8(TASK_STATUS_MD, updatedContent);
  console.log(`${GREEN}✓ TASK_STATUS.md updated${RESET}`);

  const waveComplete = allMerged && remainingTasks.length === 0;
  const newWave = updateProcessStateJson(nextAction, waveComplete);
  console.log(`${GREEN}✓ PROCESS_STATE.json updated${waveComplete ? ` — wave → ${newWave}` : ''}${RESET}`);

  // Archive Active Wave heading in BACKLOG.md when wave is complete
  if (waveComplete) {
    const closedWaveNumber = newWave - 1;
    const archiveResult = archiveActiveWaveInBacklog(BACKLOG_MD, closedWaveNumber);
    if (!archiveResult.ok) {
      console.log(`${YELLOW}⚠ BACKLOG.md wave archive warning:${RESET}\n${archiveResult.warning}`);
    } else if (archiveResult.archived) {
      console.log(`${GREEN}✓ BACKLOG.md — Wave ${closedWaveNumber} heading archived${RESET}`);
    } else if (archiveResult.warning) {
      console.log(`${YELLOW}⚠ ${archiveResult.warning}${RESET}`);
    }
  }

  // Regenerate PROCESS_STATE.md from JSON
  generateProcessStateMd(PROCESS_STATE_JSON, PROCESS_STATE_MD);
  console.log(`${GREEN}✓ PROCESS_STATE.md regenerated from JSON${RESET}`);

  // Run validator
  console.log(`\n${BOLD}Running validator...${RESET}`);
  const validatorResult = runValidator();
  if (validatorResult.ok) {
    console.log(`${GREEN}✓ Validator passed — artifacts in sync${RESET}`);
  } else {
    console.log(`${RED}✗ Validator issues (exit ${validatorResult.code}):${RESET}`);
    console.log(validatorResult.output);
  }

  // Wave complete → prompt git push
  if (waveComplete) {
    console.log(`\n${CYAN}${BOLD}Wave complete.${RESET} All tasks merged.`);
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const pushAnswer = await new Promise(resolve => rl2.question(`Run git push? [Y/n]: `, resolve));
    rl2.close();

    if (pushAnswer.trim().toLowerCase() !== 'n') {
      console.log('');
      const pushed = tryGitPush();
      if (pushed) {
        console.log(`${GREEN}✓ Pushed${RESET}`);
      } else {
        console.log(`${YELLOW}⚠ Push failed or skipped — push manually if needed${RESET}`);
      }
    } else {
      console.log(`${DIM}Push skipped — remember to push before closing the wave${RESET}`);
    }
  }

  console.log(`\n${BOLD}Session closed.${RESET}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.nonInteractive) {
    await runNonInteractive(args);
  } else {
    await runInteractive();
  }
}

main().catch(err => {
  console.error(`${RED}close-session failed: ${err.message}${RESET}`);
  process.exitCode = 1;
});
