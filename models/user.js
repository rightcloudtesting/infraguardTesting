module.exports = function(db, cb)
{
    var User = db.define('user', {
              id : Number,
              userName : String,
              password : String,
              email : String,
              linuxUserName : String,
              shell : String,
              SSHkey : String,
              registerDate : Date,
              lastAction : Date,
              specialUser : Boolean,
              uuid  : String
              }
};