 var fs = require('fs');
  var sqlite3 = require('sqlite3').verbose();
   
  var DB = DB || {};
   
  DB.SqliteDB = function(file){
      DB.db = new sqlite3.Database(file);
   
      DB.exist = fs.existsSync(file);
     if(!DB.exist){
         console.log("Creating db file!");
         fs.openSync(file, 'w');
     };
 };
  
 DB.printErrorInfo = function(err){
     console.log("Error Message:" + err.message + " ErrorNumber:" + err.errno);
 };
  
 DB.SqliteDB.prototype.createTable = function(sql){
     DB.db.serialize(function(){
         DB.db.run(sql, function(err){
             if(null != err){
                 DB.printErrorInfo(err);
                 return;
             }
         });
     });
 };
  
 /// tilesData format; [[level, column, row, content], [level, column, row, content]]
 DB.SqliteDB.prototype.insertData = function(sql, objects){
     DB.db.serialize(function(){
         var stmt = DB.db.prepare(sql);
         for(var i = 0; i < objects.length; ++i){
             stmt.run(objects[i]);
         }
     
         stmt.finalize();
     });
 };
  
 DB.SqliteDB.prototype.queryData = function(sql){
    return new Promise((resolve, reject) => {
        DB.db.all(sql, function(err, rows){
            // console.log(sql)
          if (err) {
            DB.printErrorInfo(err);
            console.log(err)
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
 };
  
 DB.SqliteDB.prototype.executeSql = function(sql){
     DB.db.run(sql, function(err){
        // console.log(sql)
         if(null != err){
             DB.printErrorInfo(err);
         }
     });
 };
  
 DB.SqliteDB.prototype.close = function(){
     DB.db.close();
 };
  
 /// export SqliteDB.
 exports.SqliteDB = DB.SqliteDB;