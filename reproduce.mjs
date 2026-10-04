import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = 4321;
const requestPath = '/';

const child = spawn(
	process.execPath,
	[path.join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--port', String(port), '--host', '127.0.0.1'],
	{
		cwd: root,
		detached: true,
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', FORCE_COLOR: '0' },
		stdio: ['ignore', 'pipe', 'pipe'],
	},
);

let log = '';
const capture = (chunk) => {
	log += chunk.toString();
	if (log.length > 250_000) log = log.slice(-120_000);
};
child.stdout?.on('data', capture);
child.stderr?.on('data', capture);

const stop = () => {
	if (!child.pid) return;
	try {
		process.kill(-child.pid, 'SIGTERM');
	} catch {
		try {
			child.kill('SIGTERM');
		} catch {
			// already gone
		}
	}
};

try {
	const deadline = Date.now() + 180_000;
	let response;
	let lastError;
	while (Date.now() < deadline) {
		if (child.exitCode != null) throw new Error(`astro dev exited ${child.exitCode}\n${log.slice(-5000)}`);
		try {
			response = await fetch(`http://127.0.0.1:${port}${requestPath}`, { redirect: 'manual' });
			break;
		} catch (error) {
			lastError = error;
			await delay(500);
		}
	}
	if (!response) throw new Error(`no connection to 127.0.0.1:${port}: ${lastError}\n${log.slice(-5000)}`);
	await delay(400);
	const body = await response.text();
	const threw = log.includes("Cannot use 'in' operator") && log.includes('undefined');
	if (!(response.status === 500 && threw && !body.includes('HOME'))) {
		throw new Error(
			`expected 500 from applyCacheHeaders(undefined), not the page.\nstatus=${response.status}\nbody=${JSON.stringify(body.slice(0, 240))}\n${log.slice(-2500)}`,
		);
	}
	console.log(`REPRODUCED ${requestPath} -> ${response.status}`);
} finally {
	stop();
	await delay(300);
	if (child.pid) {
		try {
			process.kill(-child.pid, 'SIGKILL');
		} catch {
			// already gone
		}
	}
}
