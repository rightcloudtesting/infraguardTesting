var mysql = require("mysql");
var orm = require("orm");

module.exports = {

// openCon : function(con){
// con = mysql.createConnection({
// host: "localhost",
// user: "root",
// password: "root",
// database: "infradb"
// });
// con.connect(function(err){
// if(err){
// console.log("connection problem: ", err.stack);
// return null;
// }
// });
// return con;
// },

openCon : function(con){
con = mysql.createConnection({
host: "localhost",
user: "root",
password: "root1234",
database: "InfraDB"
});
con.connect(function(err){
if(err){
console.log("connection problem: ", err.stack);
return null;
}
});
return con;
},

closeCon : function(con){
if(con != null){
con.end(function(err){
if(err) console.log(err.stack);
});
}
}


};
