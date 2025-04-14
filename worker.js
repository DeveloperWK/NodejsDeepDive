import { parentPort, workerData } from 'worker_threads';

// Simulate heavy computation
function processData(data) {
  // Example transformation
  return { ...data, processed: true, timestamp: new Date().toISOString() };
}

try {
  const result = processData(workerData);
  parentPort.postMessage(result);
} catch (err) {
  console.error('Worker failed:', err);
  parentPort.postMessage(null); // fallback
}
