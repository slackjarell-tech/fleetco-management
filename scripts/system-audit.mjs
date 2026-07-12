/**
 * Full system audit — syntax, production API, entities, functions
 * Usage: node scripts/system-audit.mjs [--production]
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const production = process.argv.includes('--production');

console.log('=== FleetCo System Audit ===\n');

const syntax = spawnSync('node', [path.join(__dirname, 'check-server-syntax.mjs')], {
  cwd: root,
  encoding: 'utf8',
});
console.log('--- Server syntax ---');
console.log(syntax.stdout || syntax.stderr || '(no output)');
if (syntax.status !== 0) {
  console.error('Syntax check FAILED');
  process.exit(1);
}

const fnTest = spawnSync(
  'node',
  [path.join(__dirname, 'full-functions-test.mjs'), ...(production ? ['--production'] : [])],
  { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
);

console.log('\n--- API / functions / entities ---');
if (fnTest.stdout) {
  try {
    const report = JSON.parse(fnTest.stdout);
    const s = report.summary || {};
    console.log(`Base: ${report.base}`);
    console.log(`Logins OK: ${s.loginsOk}/${report.logins?.length || 0}`);
    console.log(`Entities OK: ${s.entitiesOk}/${s.entitiesTotal || 0}`);
    console.log(`Functions registered: ${s.functionsRegistered}/${s.functionsTotal || 0}`);
    console.log(`Workflows OK: ${s.workflowsOk}/${report.workflows?.length || 0}`);
    const failedLogins = (report.logins || []).filter((l) => !l.ok);
    if (failedLogins.length) {
      console.log('\nFailed logins:');
      failedLogins.forEach((l) => console.log(`  - ${l.email}: ${l.error}`));
    }
    const failedEntities = (report.entities || []).filter((e) => !e.ok);
    if (failedEntities.length) {
      console.log('\nFailed entities:');
      failedEntities.forEach((e) => console.log(`  - ${e.entity}: ${e.error}`));
    }
  } catch {
    console.log(fnTest.stdout.slice(0, 4000));
  }
}
if (fnTest.stderr) console.error(fnTest.stderr);

process.exit(fnTest.status ?? 1);
