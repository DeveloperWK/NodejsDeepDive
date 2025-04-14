 import fs from 'node:fs';
 import { Transform } from 'stream';
 import { Worker } from 'worker_threads';

 function createWorker(data) {
   return new Promise((resolve, reject) => {
     const worker = new Worker('./worker.js', { workerData: data });

     worker
       .on('message', resolve)
       .on('error', reject)
       .on('exit', (code) => {
         if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
       });
   });
 }

 class PreprocessStream extends Transform {
   constructor(options) {
     super({ ...options, objectMode: true });
     this.buffer = '';
   }

   _transform(chunk, encoding, callback) {
     try {
       this.buffer += chunk.toString();
       const lines = this.buffer.split('\n');
       this.buffer = lines.pop();

       for (const line of lines) {
         if (line.trim()) {
           const preprocessedData = JSON.parse(line);
           this.push(preprocessedData);
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
         const preprocessedData = JSON.parse(this.buffer);
         this.push(preprocessedData);
       }
       callback();
     } catch (err) {
       callback(err);
     }
   }
 }

 async function processFile(inputFilePath, outputFilePath) {
   const readStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
   const writeStream = fs.createWriteStream(outputFilePath, { flags: 'w' }); // overwrite
   const preprocessStream = new PreprocessStream();

   let isWriting = false;
   const writeQueue = [];

   function processWriteQueue() {
     if (isWriting || writeQueue.length === 0) return;

     const nextChunk = writeQueue.shift();
     isWriting = true;

     const ok = writeStream.write(nextChunk, () => {
       isWriting = false;
       processWriteQueue(); // ensure next write
     });

     if (!ok) {
       writeStream.once('drain', () => {
         isWriting = false;
         processWriteQueue();
       });
     }
   }

   readStream
     .pipe(preprocessStream)
     .on('data', async (data) => {
       console.log('Preprocessed:', data);
       try {
         const result = await createWorker(data);
         console.log('Worker result:', result);
         const line = JSON.stringify(result) + '\n';
         writeQueue.push(line);
         processWriteQueue();
       } catch (err) {
         console.error('Worker error:', err);
       }
     })
     .on('end', () => {
       console.log('Read stream ended. Waiting for writes to finish...');
       const waitForWrites = setInterval(() => {
         if (!isWriting && writeQueue.length === 0) {
           console.log('All data written. Ending stream.');
           writeStream.end();
           clearInterval(waitForWrites);
         }
       }, 100);
     })
     .on('error', (err) => {
       console.error('Stream error:', err);
     });

   preprocessStream.on('error', (err) => {
     console.error('Preprocess stream error:', err);
   });

   writeStream.on('error', (err) => {
     console.error('Write stream error:', err);
   });

   writeStream.on('finish', () => {
     console.log('Write stream finished and closed.');
   });
 }

 processFile('./input.txt', './output.txt').catch(console.error);
