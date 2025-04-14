import fs from "node:fs"
import { performance } from "node:perf_hooks";
import {Transform} from "node:stream"
// Step 1: Create a batch processor
class LogBatcher extends Transform{
  constructor(batchSize) {
    super({ readableObjectMode:true,writableObjectMode:true });
    this.batch = [];
    this.batchSize = batchSize;
  }
  _transform(chunk, encoding, callback){
this.batch.push(chunk)
if(this.batch.length>=this.batchSize){
  this.push(this.batch)
  this.batch=[]
}
callback()
  }
  _flush(callback){
    if (this.batch.length > 0) this.push(this.batch);
     callback();
  }
}
// Step 2: Simulate reading logs from a file
const startTime = performance.now()
const logStream = fs.createReadStream('server-logs.txt', { encoding: 'utf8' });

logStream
  .pipe(new Transform({
    readableObjectMode: true,
    writableObjectMode: false,
    transform(chunk, encoding, callback) {
      const chunkString = chunk.toString();
      const lines = chunkString.split('\n').filter(Boolean); // Split by newline
      for (const line of lines) {
        this.push({ timestamp: Date.now(), message: line }); // Wrap each log entry
      }
      callback();
    },
  }))
  .pipe(new LogBatcher(5)) // Batch logs into groups of 5
  .on('data', (batch) => {
    console.log('Inserting batch into database:', batch);
    // Insert the batch into a database here
  })
  .on("end", ()=>{
    const endTime = performance.now()
    const duration = endTime - startTime
    console.log('All logs processed.');
    console.log(`Stream completed in ${duration.toFixed(2)} milliseconds`);
  })
