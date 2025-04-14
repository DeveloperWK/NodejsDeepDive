import async_hooks from "async_hooks"
import fs from "node:fs"

// Create a writable stream to log output safely
const logStream = fs.createWriteStream('./async-hooks.log', { flags: 'a' });

// Helper function to log messages synchronously
function safeLog(message) {
  logStream.write(`${message}\n`);
}

// Create an AsyncHook instance
const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    // Ignore irrelevant resource types
    if (['TTY', 'WRITEWRAP', 'SIGNALWRAP', 'PROMISE', 'TickObject'].includes(type)) return;

    safeLog(`Init: AsyncId ${asyncId}, Type: ${type}`);
  },
  before(asyncId) {
    safeLog(`Before: AsyncId ${asyncId}`);
  },
  after(asyncId) {
    safeLog(`After: AsyncId ${asyncId}`);
  },
  destroy(asyncId) {
    safeLog(`Destroy: AsyncId ${asyncId}`);
  },
});

// Enable the hook
hook.enable();

// Example of an asynchronous operation
setTimeout(() => {
  safeLog('Timeout callback executed');
}, 1000);

// Example of a promise-based operation
Promise.resolve().then(() => {
  safeLog('Promise resolved');
});
