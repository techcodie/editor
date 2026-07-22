import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const executableExtension = process.platform === 'win32' ? '.cmd' : ''
const tsc = resolve(root, 'node_modules', '.bin', `tsc${executableExtension}`)
const vite = resolve(root, 'node_modules', '.bin', `vite${executableExtension}`)

if (existsSync(resolve(root, '.env'))) process.loadEnvFile(resolve(root, '.env'))

const initialBuild = spawnSync(tsc, ['-p', 'tsconfig.server.json'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
})

if (initialBuild.status !== 0) process.exit(initialBuild.status ?? 1)

const children = [
  spawn(vite, [], { cwd: root, env: process.env, stdio: 'inherit' }),
  spawn(tsc, ['-p', 'tsconfig.server.json', '--watch', '--preserveWatchOutput'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  }),
  spawn(
    process.execPath,
    [
      '--watch',
      '--watch-path=dist-server',
      '--watch-preserve-output',
      'dist-server/server/index.js',
    ],
    {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
    },
  ),
]

let stopping = false

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exitCode = exitCode
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping && signal !== 'SIGTERM') stop(code ?? 1)
  })
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
