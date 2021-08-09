import { Observable, from, forkJoin } from 'rxjs';
import { util } from '../utility';
const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server;
const pkg = require('mongodb/package.json');

class MongoDBClass {
  client: any;
  db: any = null;
  limit: number = 600;
  constructor(params) {
  }

  connectDB(params) {
    if(!params.query || typeof params.query === 'string' || params.query instanceof String) {
      params.query = !params.query || params.query.length == 0 ? {} : JSON.parse(params.query);
    }
    if(!params.options || typeof params.options === 'string' || params.options instanceof String) {
      params.options = !params.options || params.options.length == 0 ? {} : JSON.parse(params.options);
    }
    return Observable.create(async (observer) => {
      if(this.db) {
        observer.next(this.db);
        observer.complete();
      } else {
        let uri = `${params.uri}?authSource=admin&replicaSet=replset&tls=true`;
        this.client = new MongoClient(uri,
          {
            tlsCAFile: params.cert,
            tlsAllowInvalidHostnames: true,
            useUnifiedTopology: true  
          });
          // console.log('$$$client', this.client)
        this.client.connect((err) => {
          if(err) {
            console.log('connection failed: ', err);
            observer.error(err);
          } else {
            this.db = this.client.db(params.database);
            observer.next(this.db);
            observer.complete();
          }
        });
      }
    });      
  }

  closeDBConnection() {
    this.client.close();
  }

  dbFindOne(params) {
    return Observable.create(async (observer) => {
      console.log('$$$client', this.client);
    })
  }

  dbFind(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe((db) => {
        // let query = !params.query || params.query.length == 0 ? {} : JSON.parse(params.query);
        let col = this.db.collection(params.collection);
        // console.log('$$$col', col);
        // Get first documents from cursor using each
        // let cnt = params.count && params.count.length>0 ? parseInt(params.count) : this.limit;
        // cnt = cnt > this.limit ? this.limit : cnt;
        let options = params.options;
        let cnt = options && options.limit ? parseInt(options.limit) : this.limit;
        if(!params.override) {
          options.limit = cnt > this.limit ? this.limit : cnt;
        }
        col.find(params.query, options).toArray((err, doc) => {
          if(doc) {
            // console.log('$$$success', doc);
            console.log(`${params.user}:${params.method}:${JSON.stringify(params.query)}:${JSON.stringify(options)}`);
            observer.next(doc);
            observer.complete();
            // Got a document
          } else {
            // this.client.close();
            console.log('err', err);
            observer.error(err);
          }
        });
      }, (err) => {
        observer.error(err);
      });
    });  
  }

  dbCount(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe(async (db) => {
        // let query = !params.query || params.query.length == 0 ? {} : JSON.parse(params.query);
        let col = this.db.collection(params.collection);
        // Get first documents from cursor using each
        let cnt = await col.count();
        observer.next({count: cnt});
        observer.complete();
      }, (err) => {
        observer.error(err);
      });
    });  
  }

  dbDelete(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe(async (db) => {
        let col = this.db.collection(params.collection);
        col.deleteOne(params.query).then((result) => {
          console.log(`${params.user}:${params.method}:${JSON.stringify(params.query)}`);
          observer.next({result});
          observer.complete();
        }, (err) => {
          observer.error(err);
        });
      });  
    });  
  }

  validate(data) {
    return data;
  }
  dbUpdate(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe(async (db) => {
        let data = this.validate(params.body);
        let col = this.db.collection(params.collection);
        console.log('$$$ update here', data)
        col.updateOne({id: data.id}, {$set: data}, {upsert: true}).then((result) => {
          console.log(`${params.user}:${params.method}:${JSON.stringify(data)}`);
          observer.next(result);
          observer.complete();
        }).catch(err => {
          observer.error(err);
        });  
      });
    })
  }

  dbUpdateMany(params) {
    return Observable.create((observer) => {
      let $update = [];
      let result;
      this.connectDB(params).subscribe(async (db) => {
        try {
          // console.log('$$$body', params.body);
          let data = params.body;
          let col = this.db.collection(params.collection);
          let items = [];
          data.map((el) => {
            el = this.validate(el);
            $update.push(col.updateOne({id: el.id}, {$set: el}, {upsert: true}));
            items.push(el);
          });
          params.body = items;
          forkJoin($update)
          .subscribe((res) => {
            result = res;
          }, (err) => {
            observer.error(err);
          }, () => {
            console.log(`${params.user}:${params.method}:${JSON.stringify(params.body)}`);
            observer.next(result);
            observer.complete();
          });  
        } catch(err) {
          observer.error(err);
        }
      });
    })
  }

  dbInsertMany(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe(async (db) => {
        try {
          let data = params.body;
          let col = this.db.collection(params.collection);
          if(!Array.isArray(data)) {
            data = [data];
          }
          let dataArray = data.map((el) => this.validate(el));
          col.insertMany(dataArray).then((result) => {
            console.log(`${params.user}:${params.method}:${JSON.stringify(params.body)}`);
            observer.next(result);
            observer.complete();
          }).catch(err => {
            observer.error(err);
          });  
        } catch(err) {
          observer.error(err);
        }
      });
    })
  }

  dbCollections(params) {
    return Observable.create((observer) => {
      this.connectDB(params).subscribe(async (db) => {
        try {
          db.listCollections().toArray((err, doc) => {
            if(doc) {
              // console.log('$$$success', doc);
              console.log(`${params.user}:${params.method}`);
              observer.next(doc);
              observer.complete();
              // Got a document
            } else {
              console.log('err', err);
              observer.error(err);
            }
          });
        } catch(err) {
          observer.error(err);
        }
      });
    })
  }
}

export const MongoDB = MongoDBClass;