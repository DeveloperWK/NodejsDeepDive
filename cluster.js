import { isMaster, fork, on } from 'cluster';
import { createServer } from 'http';
import { cpus } from 'os';
const numCPUs = cpus().length;

if (isMaster) {
  console.log(`Master process is running. Forking for ${numCPUs} CPUs...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    fork();
  }

  // Handle worker exit
  on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    fork(); // Restart the worker
  });
} else {
  // Worker process
  createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from worker ${process.pid}`);
  }).listen(3000);

  console.log(`Worker ${process.pid} started`);
}
