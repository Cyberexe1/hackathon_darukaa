// lint-staged config for the Darukaa.Earth monorepo (frontend/ + backend/).
// Runs the appropriate formatter/linter on staged files only, keeping the
// pre-commit hook fast. lint-staged passes each matched glob's files as
// absolute paths, which every tool below accepts directly — no path
// rewriting needed. Each tool is pointed at its subproject's local
// toolchain/config explicitly so it works regardless of which directory
// git runs the hook from.

const isWindows = process.platform === 'win32';
const ruffBin = isWindows ? 'backend/.venv/Scripts/ruff.exe' : 'backend/.venv/bin/ruff';

export default {
  'frontend/**/*.{ts,tsx,js,jsx}': (files) => {
    const quoted = files.map((f) => JSON.stringify(f)).join(' ');
    return [
      `npm --prefix frontend exec -- eslint --fix ${quoted}`,
      `npm --prefix frontend exec -- prettier --write ${quoted}`,
    ];
  },
  'frontend/**/*.css': (files) => {
    const quoted = files.map((f) => JSON.stringify(f)).join(' ');
    return [`npm --prefix frontend exec -- prettier --write ${quoted}`];
  },
  'backend/**/*.py': (files) => {
    const quoted = files.map((f) => JSON.stringify(f)).join(' ');
    return [
      `${ruffBin} check --fix --config backend/pyproject.toml ${quoted}`,
      `${ruffBin} format --config backend/pyproject.toml ${quoted}`,
    ];
  },
};
