const { spawn, spawnSync } = require('child_process')
const path = require('path')
require('dotenv').config()

const backendRoot = path.resolve(__dirname, '..')
const port = process.env.PORT || 3000
const baseUrl = process.env.TEST_BASE_URL || `http://127.0.0.1:${port}`
const loginEmail = process.env.TEST_LOGIN_EMAIL || 'test@test.com'
const loginPassword = process.env.TEST_LOGIN_PASSWORD || 'testtest'
const startupTimeoutMs = 60000

/**
 * Waits for the given number of milliseconds.
 *
 * @param {number} ms Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Waits until the backend responds successfully.
 *
 * @returns {Promise<void>} Resolves when the backend is reachable.
 */
const waitForServer = async () => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < startupTimeoutMs) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) {
        return
      }
    } catch {
      // keep retrying until timeout
    }

    await wait(1000)
  }

  throw new Error(`Backend did not become ready at ${baseUrl} within ${startupTimeoutMs} ms`)
}

/**
 * Starts the backend process for the smoke test.
 *
 * @returns {object|null} The spawned backend wrapper, or null when TEST_BASE_URL is set.
 */
const startBackend = () => {
  if (process.env.TEST_BASE_URL) {
    return null
  }

  const child = spawn('node', ['src/server.js'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdout = ''
  let stderr = ''

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString()
  })

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  return {
    child,
    /**
     * Returns the collected backend logs.
     *
     * @returns {{stdout: string, stderr: string}} The accumulated stdout and stderr.
     */
    logs: () => ({ stdout, stderr }),
  }
}

/**
 * Executes the login smoke test request.
 *
 * @returns {object} Parsed login response payload.
 */
const runCurlLogin = () => {
  const result = spawnSync(
    'curl',
    [
      '-sS',
      '-X', 'POST',
      `${baseUrl}/api/auth/login`,
      '-H', 'Content-Type: application/json',
      '--data-raw', JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
      '-w', '\n%{http_code}',
    ],
    {
      cwd: backendRoot,
      encoding: 'utf8',
    }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || 'curl login request failed')
  }

  const output = result.stdout.trim()
  const splitIndex = output.lastIndexOf('\n')

  if (splitIndex === -1) {
    throw new Error(`Unexpected curl output: ${output}`)
  }

  const body = output.slice(0, splitIndex)
  const statusCode = output.slice(splitIndex + 1)

  if (statusCode !== '200') {
    throw new Error(`Expected HTTP 200, got ${statusCode}. Body: ${body}`)
  }

  const response = JSON.parse(body)

  if (!response.token || typeof response.token !== 'string') {
    throw new Error(`Login response missing token: ${body}`)
  }

  if (!response.user || response.user.email !== loginEmail) {
    throw new Error(`Login response user payload was unexpected: ${body}`)
  }

  return response
}

/**
 * Runs the login smoke test flow.
 *
 * @returns {Promise<void>} Resolves when the test has completed.
 */
const main = async () => {
  const backend = startBackend()

  try {
    await waitForServer()
    const response = runCurlLogin()

    console.log('Login test passed')
    console.log(JSON.stringify({
      message: response.message,
      user: response.user,
    }, null, 2))
  } catch (error) {
    console.error('Login test failed:')
    console.error(error)

    if (backend) {
      const logs = backend.logs()
      if (logs.stdout) {
        console.error('--- backend stdout ---')
        console.error(logs.stdout)
      }
      if (logs.stderr) {
        console.error('--- backend stderr ---')
        console.error(logs.stderr)
      }
    }

    process.exitCode = 1
  } finally {
    if (backend) {
      backend.child.kill('SIGTERM')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
