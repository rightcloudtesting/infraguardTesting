
 var mysql = require("mysql");
 exports.handler = (event, context) => {
   console.log(" Function start for DB interaction ");
    var con = mysql.createConnection({
    host: "infraguarddb.cvfgxhprsmji.us-west-2.rds.amazonaws.com",
    user: "avignadev",
    password: "avIgnaDev3",
    database: "InfraDB"
    });
    
    
   var data = {
		serverName : event.serverName,
		serverIP : event.serverIp,
		hostname : event.hostName,
		project_id : event.projectId,
		userList : event.userList
	};

 con.query('insert into servers set ?', data, function(err, result){
	 console.log(" data saved ");
	 context.succeed(result);
	});

  con.end(function(err) {
  console.log("connection closed");
	   });
 };
