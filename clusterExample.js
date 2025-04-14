import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import process from 'node:process';

if (cluster.isPrimary) {
  console.log(`Master process is running on PID ${process.pid}. Forking workers...`);

  // Get the number of CPU cores
  const numCPUs = os.cpus().length;
console.log(numCPUs)

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Starting a new worker...');
    cluster.fork(); // Restart the worker
  });
} else {
  // Worker process
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello from worker ${process.pid}\n`);
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} is listening on port 3000`);
  });
}
