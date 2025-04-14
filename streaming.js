import fs from "node:fs"
import csv  from 'csv-parser' ;
import {performance}from "perf_hooks"
const startTime = performance.now()
fs.createReadStream("input.csv")
  .pipe(csv())
  .on("data",(row)=>{
    console.log('Processing row:', row)
  })
  .on("end", ()=>{
    const endTime = performance.now()
    const duration = endTime - startTime
    console.log('Finished processing the CSV file.');
    console.log(`Stream completed in ${duration.toFixed(2)} milliseconds`);
  })
