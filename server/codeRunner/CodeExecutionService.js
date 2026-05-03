/**
 * Autograding execution: separate from plagiarism (SOLID).
 * Provides Judge0 HTTP wrapper (placeholder) + local g++ child-process fallback.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { ConnectionManager } = require('../singleton/ConnectionManager');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class CodeExecutionService {
  /**
   * @param {{ preferJudge0?: boolean }} [options]
   */
  constructor(options = {}) {
    this.preferJudge0 = options.preferJudge0 === true;
  }

  /**
   * @param {string} source
   * @param {string} stdin
   * @returns {Promise<{ stdout: string; stderr: string; exitCode: number; mode: string }>}
   */
  async compileAndRunCpp(source, stdin = '') {
    if (this.preferJudge0 && process.env.JUDGE0_API_URL) {
      return this._runViaJudge0(source, stdin);
    }
    return this._runViaLocalGcc(source, stdin);
  }

  /**
   * Placeholder Judge0-compatible call. Set JUDGE0_API_URL and JUDGE0_API_KEY.
   * @param {string} source
   * @param {string} stdin
   */
  async _runViaJudge0(source, stdin) {
    const baseUrl = process.env.JUDGE0_API_URL;
    const apiKey = process.env.JUDGE0_API_KEY || '';

    if (!baseUrl) {
      return {
        stdout: '',
        stderr: 'JUDGE0_API_URL not configured; falling back would require second call — use local mode.',
        exitCode: 1,
        mode: 'judge0-misconfigured',
      };
    }

    try {
      // Minimal placeholder: many Judge0 instances expect multipart or base64 payloads.
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-Auth-Token': apiKey } : {}),
        },
        body: JSON.stringify({
          source_code: source,
          language_id: parseInt(process.env.JUDGE0_CPP_LANGUAGE_ID || '54', 10),
          stdin,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { stdout: '', stderr: `Judge0 HTTP ${res.status}: ${text}`, exitCode: 1, mode: 'judge0' };
      }

      const data = await res.json();
      return {
        stdout: data.stdout || '',
        stderr: (data.stderr || '') + (data.compile_output ? `\n${data.compile_output}` : ''),
        exitCode: typeof data.exit_code === 'number' ? data.exit_code : data.status?.id === 3 ? 0 : 1,
        mode: 'judge0',
      };
    } catch (err) {
      return {
        stdout: '',
        stderr: `Judge0 request failed: ${err.message}`,
        exitCode: 1,
        mode: 'judge0-error',
      };
    }
  }

  /**
   * Local g++ compile + run (Windows/Linux if g++ on PATH).
   * @param {string} source
   * @param {string} stdin
   */
  async _runViaLocalGcc(source, stdin) {
    const cm = ConnectionManager.getInstance();
    const tmpDir = cm.getTempRoot();
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const srcPath = path.join(tmpDir, `${id}.cpp`);
    const exePath = path.join(tmpDir, process.platform === 'win32' ? `${id}.exe` : id);

    await writeFile(srcPath, source, 'utf8');

    const compile = await this._spawnCommand('g++', [srcPath, '-o', exePath, '-std=c++17']);
    if (compile.code !== 0) {
      await this._safeUnlink(srcPath);
      return {
        stdout: '',
        stderr: compile.stderr || compile.stdout || 'g++ compile failed',
        exitCode: compile.code,
        mode: 'local-g++',
      };
    }

    const run = await this._spawnCommand(exePath, [], stdin);
    await this._safeUnlink(srcPath);
    await this._safeUnlink(exePath);

    return {
      stdout: (run.stdout || '').trim(),
      stderr: (run.stderr || '').trim(),
      exitCode: run.code,
      mode: 'local-g++',
    };
  }

  _spawnCommand(command, args, stdin = '') {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });
      child.on('close', (code) => {
        resolve({ code: code ?? 0, stdout, stderr });
      });
      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();
    });
  }

  async _safeUnlink(filePath) {
    try {
      await unlink(filePath);
    } catch {
      /* ignore */
    }
  }
}

module.exports = { CodeExecutionService };
