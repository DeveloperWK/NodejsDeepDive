import fs from 'node:fs';
import { Transform, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Worker } from 'worker_threads';

// Custom line-by-line JSON parser stream
class PreprocessStream extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    try {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (line.trim()) {
          const parsed = JSON.parse(line);
          this.push(parsed);
        }
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      if (this.buffer.trim()) {
        this.push(JSON.parse(this.buffer));
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Worker helper with Promise
function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker
      .on('message', resolve)
      .on('error', reject)
      .on('exit', code => {
        if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      });
  });
}

// Concurrency limiter
function createWorkerPool(limit = 4) {
  let active = 0;
  const queue = [];

  const run = async (task) => {
    if (active >= limit) {
      await new Promise(resolve => queue.push(resolve));
    }
    active++;

    try {
      const result = await task();
      return result;
    } finally {
      active--;
      if (queue.length) {
        const next = queue.shift();
        next();
      }
    }
  };

  return run;
}

// Main processing function using pipeline
async function processFile(inputFilePath, outputFilePath) {
  const limitWorker = createWorkerPool(4); // Change concurrency level here

  await pipeline(
    fs.createReadStream(inputFilePath, { encoding: 'utf8' }),
    new PreprocessStream(),
    async function* (source) {
      for await (const data of source) {
        const result = await limitWorker(() => runWorker(data));
        yield JSON.stringify(result) + '\n';
      }
    },
    fs.createWriteStream(outputFilePath, { flags: 'w' }) // Overwrite
  );

  console.log('Processing complete.');
}

processFile('./input.txt', './output.txt').catch(console.error);
