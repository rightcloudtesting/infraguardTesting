var express = require("express");
var session = require('express-session'); 
var morgan = require("morgan");
var app = express();
//var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;
//app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/]));
app.use(session({secret: '!@ASD$%^123&#*', resave: true, saveUninitialized: true}));
app.use(express.static("angular"));
app.use(morgan("dev"));

require("./controller/routes")(app);

var server = app.listen(8088, function(){
console.log("server started at http://127.0.0.1:8088");
});
