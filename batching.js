import {Readable, Transform} from 'node:stream'

class BatchProcessor extends Transform {
  constructor(batchSize){
    super ({objectMode:true})
    this.batch = []
    this.batchSize = batchSize
  }
  _transform(chunk, encoding, callback){
    this.batch.push(chunk)
    if(this.batch.length>= this.batchSize){
      this.push(this.batch)
      this.batch=[]
    }
    callback()
  }
  _flush(callback){
    if(this.batch.length>0) this.push(this.batch)
    callback()
  }
}
const sourceStream = new Readable({
  objectMode:true,
  read(){
    let i = 1
    for (i; i <= 50;i++){
      this.push({ id: i, name: `Item ${i}` });
          }
          this.push(null);
  }
})
sourceStream
  .pipe(new BatchProcessor(5))
  .on('data', (batch) => {
    console.log('Processing batch:', batch);
  })
  .on('end', () => console.log('All batches processed.'))
