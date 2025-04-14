// main.js
import { Worker, isMainThread, parentPort } from 'worker_threads';

if (isMainThread) {
  // Main thread
  console.log('Main thread is running.');

  const worker = new Worker(__filename); // Spawn a worker

  worker.on('message', (result) => {
    console.log(`Result from worker: ${result}`);
  });

  worker.postMessage(42); // Send data to worker
} else {
  // Worker thread
  parentPort.on('message', (data) => {
    console.log(`Worker received data: ${data}`);
    const result = data * 2; // Perform some computation
    parentPort.postMessage(result); // Send result back to main thread
      process.exit()
  });

}
process.on('exit', () => {
  console.log('Worker thread is exiting.');
});
