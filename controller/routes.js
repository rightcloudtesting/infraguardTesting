var bodyParser = require("body-parser"); 
var multer = require("multer");
var bcryptPassw = require(process.cwd() + "/util/bcryptPassword");
var db = require(process.cwd() + "/config/db");
var urlencoded = bodyParser.urlencoded({extended: true});
var speakeasy = require('speakeasy');// for MFA 
var QRCode = require('qrcode');
var keypair = require('keypair');
var forge = require('node-forge');
var cron = require('node-cron');
var pair = keypair();
var con = null;
var log4js = require('log4js');


require('log4js/lib/appenders/file')
require('log4js/lib/appenders/stdout')

log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'errorlog.log' } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
});
var logger = log4js.getLogger('cheese');
var storage = multer.diskStorage({
  destination: './angular/images/profileImages/',
  filename: function (req, file, cb) {
  			var imageName = req.session.email + '.' + file.originalname.split('.')[file.originalname.split('.').length -1];
            cb(null, imageName);
        }
});
var upload = multer({ storage: storage }).single("file");

// cron schedule for auto rotating server keys monthly
cron.schedule('0 0 1 * * *', function(){
//    if(con == null)
//    con = db.openCon(con);
//    con.query("select distinct c.*,s.id as serverId,s.serverIP,u.email,s.region,s.vpc_id,s.instanceId,s.platform from servers s inner join customers c on (s.customerIAMId=c.id and c.is_deleted=0) inner join users u on(u.id=c.user_id) inner join projectdetails p on (s.project_id=p.id) WHERE autoKeyRotation=1", function(err, result){
//      if(err){
//          console.log("error is running.")
//      }else{
//          console.log("job is running.")
//         for(var i = 0, l = result.length; i < l; i++){
//                    getUserCommand(result[i]);
//         }
//      }
//   });
});

cron.schedule('* * * * *', function(){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var today = new Date();
    var weekday = new Array(7);
    weekday[0] = "SUN";
    weekday[1] = "MON";
    weekday[2] = "TUE";
    weekday[3] = "WED";
    weekday[4] = "THU";
    weekday[5] = "FRI";
    weekday[6] = "SAT";
    var day = weekday[today.getDay()];
    var utcHours =(today.getUTCHours().toString().length < 2) ? "0"+today.getUTCHours() : today.getUTCHours();
    var utcMinutes =(today.getUTCMinutes().toString().length < 2) ? "0"+today.getUTCMinutes() : today.getUTCMinutes();
    var time = utcHours+":"+utcMinutes;
    if(con == null)
    con = db.openCon(con);
    var sql = "select st.* from scheduled_task st where st.is_deleted=0 and st.time='"+time+"' and st.day in ('Day','"+day+"')";
    console.log("Run scheduler in every minute to start and stop instances");
    con.query(sql, function(err, result) {
	if(result.length>0){
            for(var i=0 ; i < result.length ; i++){
                var sql_server = "select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.project_id ="+result[i].project_id;
                var instance = result[i].task;
                con.query(sql_server, function(error, results){
                    if(results.length > 0){
                        for(var j=0;j<results.length;j++){
                             automationExecution(results[j],instance);   
                        }
                    }
                });
            }
        }
    });
});
cron.schedule('* * * * *', function(){
    var today = new Date();
    var dd   =(today.getDate().toString().length < 2) ? "0"+today.getDate() : today.getDate()
    var mm   =((today.getMonth()+1).toString().length < 2) ? "0"+(today.getMonth()+1) : (today.getMonth()+1);
    var datestring = today.getFullYear()  + "-" + mm + "-" + dd;
    var utcHours =(today.getUTCHours().toString().length < 2) ? "0"+today.getUTCHours() : today.getUTCHours();
    var utcMinutes =(today.getUTCMinutes().toString().length < 2) ? "0"+today.getUTCMinutes() : today.getUTCMinutes();
    var time = utcHours+":"+utcMinutes+":00";
    if(con == null)
    con = db.openCon(con);
    var sql = "select st.*,aa.script from script_scheduler st inner join automation_scripts aa on (st.script_id = aa.id) where st.is_deleted=0 and st.automationDate='"+datestring+"' and st.automationTime ='"+time+"' and st.is_executed=0";
    console.log(sql);
    con.query(sql, function(error, result){
        var scheduler_ids = [];
        if(result.length > 0){
            var m=0;
            for(var i=0;i<result.length;i++){
                scheduler_ids.push(result[i].id);
                var sql = "select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.id as serverId,(select ss.status from ssm_alive_history ss where id=max(ssm.id)) as status from servers s inner join ssm_alive_history ssm on (s.id=ssm.server_id) inner join customers cs on (cs.id=s.customerIAMId) where s.project_id ="+result[i].project_id+" and (ssm.`status`='Online' or ssm.`status`='Alive') group by s.id"
                con.query(sql, function(err, results){
                    if(results.length > 0){
                        k=0;
                        var req = { body: {script: result[m].script, script_id:result[m].script_id},session:{uid:null} };
                        m++;
                        for(var j=0;j<results.length;j++){
                            assumeRoleForServer(results[j],req,null,1, function(resultss){
                                k++;
                                if(k==results.length){
                                    var sql = "update script_scheduler s set s.is_executed=1 where s.id in ("+scheduler_ids.toString()+")";
                                    con.query(sql, function(e, r){
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
	
    });
});


// cron schedule to revoke server access for every active user daily cron.schedule('0 0 * * *', function(){
cron.schedule('0 */8 * * * *', function(){
  revokeServerAccess();
});

module.exports = function(app){
app.use(bodyParser.json());
app.get("/", function(request, response){

	if(request.session.email) {
	    response.sendFile(process.cwd() + "/angular/pages/dashBoard.html");
	    response.status(200);
	}
	else {
		response.sendFile(process.cwd() + "/angular/pages/homePage.html");
		response.status(200);
	}
});

app.get("/resetPassword", function(request, response){
 
    var data = new Buffer(request.query.data, 'base64').toString().split("&");
	var id = data[0].split("id=")[1];
	var time = data[1].split("timeStamp=")[1];
	var timeDiffHrs = (Date.now() - time)/(1000*60*60);

	if(timeDiffHrs >= 24) {
	    response.writeHead(200, {'Content-Type': 'text/plain'});
	    response.end('Hello ! Your link has expired. It is valid for 24 Hrs only.\n');
	}
	else {
		// show the password reset page
		response.sendFile(process.cwd() + "/angular/pages/resetpwdPage.html");
		response.status(200);
	}
});

app.post("/updatePassword", urlencoded, function(req, res){
	var userId = req.body.userId;
	var passw = bcryptPassw.generateHash(req.body.pwd);
	
	if(con == null)
	con = db.openCon(con);
	con.query("update users set passw = ? where id = ?", [passw,userId], function(err, result) {
	if (err) {
		res.json({success : 0, err : err});
		return;
	}
	else if(result.affectedRows > 0){
	res.json({success : 1});
	}
	});
	
});

app.post("/changePassword", function(req, res){
	var newP = bcryptPassw.generateHash(req.body.newP);
	if(con == null)
	con = db.openCon(con);
        var passwValid = bcryptPassw.compareHash(req.body.oldP, req.body.passw);
        if(!passwValid && req.body.oldP != 'abc'){
            res.json({success : 0, err_msg : "Old password is not valid."});
        }else{
            console.log("update users set passw = '"+newP+"' where id="+req.body.uid);
            con.query("update users set passw = ? where id = ?", [newP,req.body.uid], function(err, result) {
            if (err) {
                    res.json({success : 0, err_msg : "There is some error to update password."});
                    return;
            }
            else if(result.affectedRows > 0){
                req.session.passw = newP;
                res.json({success : 1});
            }
	});
        }
});

app.get("/logout", function(req, res){
	req.session.destroy(function(err) {
	  if(err) {
	    console.log(err);
	  } else {
	    res.redirect('/');
	  }
	});

});

app.post("/signupAction", urlencoded, function(req, res){
	var email = req.body.email;
	var uname = req.body.uname;
	var passw = bcryptPassw.generateHash(req.body.passw);
	var userRegistration = "self";
	var data = {
		email : email,
		uname : uname,
		passw : passw,
		userRegistration : userRegistration
	}
	signupAction(req, res, data);
});

app.post("/loginAction", urlencoded, function(req, res){
	var email = req.body.email;
	var passw = req.body.passw;
	var data = {
		email : email,
		passw : passw
	};
	loginAction(req, res, data);
});

app.get("/getUserData", function(req, res){
	getUserData(req, res);
});

app.get("/getGroupData", function(req, res){
	getGroupData(req, res);
});

app.post("/checkEmail", function(req, res) {
	var email = req.body.email;
	if(con == null)
	con = db.openCon(con);
	con.query("select * from users where email = ?", [email], function(err, result) {
		if (err) console.log("check_email.error: ", err.stack);
		if (result.length > 0) {
			res.json({found: 1,result : result[0]});
		} else {
			res.json({found : 0});
		}
	});
});

app.post("/uploadImage", function(req, res) {
if(con == null)
con = db.openCon(con);
upload(req, res, function(err){
            if(err){
                 res.json({success : 0, err_desc : err});
                 return;
            }
            con.query("update users set userImage = ? where email = ?", [req.file.filename, req.session.email], function(err, result) {
            	if(err){
            		res.json({success : 0, err_desc : err});
                 	return;
             	}

             	else if(result.affectedRows > 0){
             		res.json({success : 1, err_desc : null});
             	}
             	
            });
            
        })
});

app.post("/updateSSHKey", function(req, res) {
if(con == null)
con = db.openCon(con);
con.query("update users set ssh_key = ? where email = ?", [req.body.sshKey, req.session.email], function(err, result) {
if (err) {
	res.json({success : 0, err_desc : err});
	return;
}
else if(result.affectedRows > 0){
res.json({success : 1, err_desc : null});
}
});
});

app.post("/save_profile_info", function(req, res) {
if(con == null)
con = db.openCon(con);
con.query("update users set shell = ?, linuxName = ? where email = ?", 
	[req.body.shell, req.body.linux_uname, req.session.email], 
	function(err, result){
		if(err){
			res.json({success : 0, err_desc : err});
			return;
		}
		else if(result.affectedRows > 0){
			res.json({success : 1, err_desc : null});
		}
});
});
app.post("/createCompany", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
companyName : req.body.cname,
companyCreator : req.session.uid
};

con.query("select * from companydetails where companyCreator = ? and companyName = ? and is_deleted=0", [req.session.uid,req.body.cname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Company Already Exists!"});
		return;
	}
	else{
		con.query("insert into companydetails set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});


app.post("/editCompany", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
companyName : req.body.cname,
companyId : req.body.cid,
companyCreator : req.session.uid
};

con.query("select * from companydetails where companyCreator = ? and companyName = ? and is_deleted=0", [req.session.uid,req.body.cname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Company Already Exists!"});
		return;
	}
	else{
		con.query("update companydetails set companyName = ? where id = ?", [req.body.cname,req.body.cid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});


app.post("/deleteCompany", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select * from companydetails where companyCreator = ? and companyName = ?", [req.session.uid,req.body.cname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Company Already Exists!"});
		return;
	}
	else{
		con.query("update companydetails set is_deleted = ? where id = ?", [1,req.body.cid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});

app.post("/createProject", function(req, res) {
if(con == null)
con = db.openCon();	
var data = {
projectName : req.body.pname,
company_id : req.body.cid
};

con.query("select * from projectdetails where projectName = ? and company_id = ? and is_deleted = 0", [req.body.pname,req.body.cid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Project Already Exists!"});
		return;
	}
	else{
		con.query("insert into projectdetails set ?", [data], function(err, result) {
		if(err){
			console.log(err.stack);
			res.json({success: 0, err_desc: err});
		}
		else
			res.json({success: 1, err_desc: null, row_id: result.insertId});
	   });
	}
	
	});
});

app.post("/editProject", function(req, res) {
if(con == null)
con = db.openCon();	
var data = {
projectName : req.body.pname,
company_id : req.body.cid,
projectId : req.body.pid
};

con.query("select * from projectdetails where projectName = ? and company_id = ? and is_deleted = 0", [req.body.pname,req.body.cid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Project Already Exists!"});
		return;
	}
	else{
		con.query("update projectdetails set projectName = ? where id = ?", [req.body.pname,req.body.pid], function(err, result){
		if(err){
			console.log(err.stack);
			res.json({success: 0, err_desc: err});
		}
		else
			res.json({success: 1, err_desc: null, row_id: result.insertId});
	   });
	}
	
	});
});

    app.post("/deleteProject", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query("update projectdetails set is_deleted = ? where id = ?", [1, req.body.pid], function (err, result) {
            if (err) {
                res.json({success: 0, err_desc: err});
                return;
            }
            res.json({success: 1, err_desc: null, row_id: result.insertId, creator: req.session.uid});
        });
    });

app.post("/getProject", function(req, res) {
if(con == null)
	con = db.openCon(con);
var obj = {};
Promise.all([

	new Promise((resolve, reject) => {
		con.query("select * from projectdetails where id = ? and is_deleted = 0", [req.body.id], function(err, result) {
			if(err)console.log(err.stack);
			if(result.length > 0){
				resolve(result[0]);
			}
			resolve(null);
		});
	})

]).then((results) => {
obj.project = results[0];
res.status(200).json(obj);
});
});

app.post("/getProjectPagedetails", function(req, res) {
if(con == null)	
	con = db.openCon(con);
var obj = {};
Promise.all([
	new Promise((resolve, reject) => {
		con.query("select * from companydetails where id = ? ", [req.body.id], function(err, result) {
			if(err)console.log(err.stack);
			if(result.length > 0){
				resolve(result[0]);
			}
			resolve(null);
		});
	}),
	new Promise((resolve, reject) => {
                        var sql = "SELECT p.* FROM projectdetails p inner join companydetails c on (c.id=p.company_id) WHERE p.company_id = "+req.body.id+" and c.companyCreator ="+req.session.uid+" and p.is_deleted=0 union select p.* FROM projectdetails p inner join group_company_project gcp on(p.id=gcp.project_id and gcp.is_deleted=0 and p.is_deleted=0) where gcp.compnay_id="+req.body.id;
			//con.query("SELECT * FROM projectdetails WHERE company_id = ? ", [req.body.id], function(err, result){
                        con.query(sql,'0', function(err, result){
				if(err)console.log(err.stack);
					if(result.length > 0){
						resolve(result);
					}
					resolve(null);
					
				});
			
		}),
	new Promise((resolve, reject) => {
			con.query(" SELECT s.id as serverId,s.*,p.*,(select status from ssm_alive_history where id=max(ssm.id)) as ssm_status FROM projectdetails p INNER JOIN servers s ON p.id = s.project_id left join ssm_alive_history ssm on (s.id=ssm.server_id) WHERE p.company_id = ?  group by s.id", [req.body.id], function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		})
	

])
.then((results) => {
	obj.company = results[0];
	obj.projects = results[1];
	obj.servers = results[2];
	res.status(200).json(obj);
});

});


app.post("/getServerPageDetails", function(req, res){
	if(con == null)
	con = db.openCon(con);
	var obj = {};
	Promise.all([
		new Promise((resolve, reject) => {
			con.query("select p.*,c.companyName from projectdetails p inner join companydetails c on (p.company_id = c.id)  where p.id = ? ", [req.body.id], function(err, result) {
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result[0]);
				}
				resolve(null);
			});
		}),
		new Promise((resolve, reject) => {
				con.query("SELECT s.*,g.tag_name,(select status from ssm_alive_history where id=max(ssm.id)) as ssm_status FROM servers s left join ssm_alive_history ssm on (s.id=ssm.server_id) left join grouping_tags g on(g.id=s.tag_id) WHERE project_id = ? group by s.id order by g.id ", [req.body.id], function(err, result){
					if(err)console.log(err.stack);
						if(result.length > 0){
							resolve(result);
						}
						resolve(null);
						
					});
				
			})
	])
	.then((results) => {
		obj.project = results[0];
		obj.servers = results[1];
		res.status(200).json(obj);
	});
});

app.get("/getProjectData", function(req, res){
if(con == null)
con = db.openCon(con);
var obj = {};
obj.projectdata = null;
obj.companydata = null;
Promise.all([
	
		new Promise((resolve, reject) => {
			con.query("SELECT * FROM companydetails WHERE companyCreator = ? ", [req.session.uid], function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
				
			});

			
		}),

		new Promise((resolve, reject) => {
			con.query("SELECT * FROM companydetails c INNER JOIN projectdetails p ON c.id = p.company_id WHERE c.companyCreator = ? ", [req.session.uid], function(err, result){
				if(err)console.log(err.stack);
					if(result.length > 0){
						resolve(result);
					}
					resolve(null);
					
				});
			
		})
		
	]).then((results) => {
		obj.companydata = results[0];
		obj.projectdata = results[1];
		res.status(200).json(obj);
	});



});

app.post("/showUsers", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select * from users where is_deleted=0 and roleId != 'null' and email like ?", [req.body.email], function(err, result){
if(err)console.log(err.stack);
res.status(200).json(result);
});
});

app.post("/showUsersOnServer", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select su.username,su.id from servers s inner join server_users su on (s.id=su.server_id) where su.is_deleted=0 and s.id = ?", [req.body.serverId], function(err, result){
if(err)console.log(err.stack);
res.status(200).json(result);
});
});

app.post("/showPrivilegeUsers", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select * from servers where serverIP = ?", [req.body.serverIp], function(err, result){
if(err)console.log(err.stack);
res.status(200).json(result);
});
});

app.post("/getUserRole", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select * from userRole where uname = ?", [req.body.uname], function(err, result){
if(err)console.log(err.stack);
if(result != null && result.length > 0){
res.status(200).json(result[0].role);
}else{
	var role = "user";
	res.status(200).json(role);
}
});
});

app.post("/getUserEmail", function(req, res){
if(con == null)
con = db.openCon(con);
con.query("select * from users where uname = ?", [req.body.uname], function(err, result){
if(err)console.log(err.stack);
if(result != null && result.length > 0){
res.status(200).json(result[0].email);
}else{
	res.status(200).json(null);
}
});
});

app.post("/addUserToServer", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var record = {};
    var pair = keypair();
    var privateKey = pair.private; 
    console.log(privateKey);
    var pubKey = forge.pki.publicKeyFromPem(pair.public);
    var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, data.user.uname+'@InfraGuard');
    console.log(data.user.uname);
    var command_1 = "useradd -d /home/"+data.user.uname+" -s /bin/bash -m "+data.user.uname;
    var command_2 = 'su - -c "ssh-keygen -q -t rsa -f ~/.ssh/id_rsa -N  \'\'" '+data.user.uname;
    var command_3 = 'su - -c "echo '+sshpubKey+'> .ssh/authorized_keys" '+data.user.uname;
    var command_4 = 'su - -c "chmod 600 .ssh/authorized_keys" '+data.user.uname;
    var command_5 = 'id -u '+data.user.uname;
    var userList = "";
    var serverId = data.serverId;
    var username  = data.user.uname;
    var command = command_1+"\n"+command_2+"\n"+command_3+"\n"+command_4+"\n"+command_5;
    var email = data.user.email;
    var passw = data.user.passw;
    console.log(command);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,u.email,s.serverIP from customers cs inner join servers s on(cs.id=s.customerIAMId) inner join users u on(u.id=cs.user_id) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         var document;
         var paramsCommand;
         var platform;
         if(result[0].platform=='Windows'){
             platform ='W';
             document ='AWS-RunPowerShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
                };
         }else{
             platform ='L';
             document ='AWS-RunShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":[command_1,command_2,command_3,command_4,command_5]
                  }
                };
         }
         console.log(paramsCommand);
         if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            console.log(err, err.stack);
                            logger.error('Error in Send command');
                            logger.error(err);
                            res.json({success : 0});
                        }else{
                            sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                    res.json({success : 0});
                                }else{
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                        res.json({success : 0});
                                    }else{
                                        sendMail(result[0].email,privateKey,result[0].serverIP,username,email);
                                        adduser(email,passw,username);
                                        var insert_record = {
                                            server_id :serverId,
                                            server_ip : result[0].serverIP,
                                            username : username,
                                            private_key : privateKey,
                                            email :email
                                        };
                                        console.log('select * from server_users where is_deleted=0 and server_id= '+serverId+' and email = "'+email+'"');
                                        con.query('select * from server_users where is_deleted=0 and server_id= '+serverId+' and email = "'+email+'"', function(err, resul){
                                            if(resul.length >0){
                                                res.json({success : 2});
                                            }else{
                                                con.query('insert into server_users set ?',[insert_record], function(error, results){
                                                if ( error ){
                                                    logger.error('Error in insert user of servers');
                                                    logger.error(error);
                                                    res.json({success :0});
                                                } else {
                                                    addServerUsersTrail("-8",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",results.insertId);
                                                    res.json({success : 1});
                                                }
                                            });
                                            }
                                        });
                                    }
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            res.json({success : 0});
                            logger.error('Error in send command');
                            logger.error(err);
                            console.log(err, err.stack);
                        }else{
                             sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0});
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                }else{
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                        res.json({success : 0});
                                    }else{
                                        sendMail(result[0].email,privateKey,result[0].serverIP,username,email);
                                        adduser(email,passw,username);
                                        var insert_record = {
                                            server_id :serverId,
                                            server_ip : result[0].serverIP,
                                            username : username,
                                            private_key : privateKey,
                                            email :email
                                        };
                                        console.log(insert_record);
                                        console.log('select * from server_users where is_deleted=0 and server_id= '+serverId+' and email = "'+email+'"');
                                        con.query('select * from server_users where is_deleted=0 and server_id= '+serverId+' and email = "'+email+'"', function(err, resul){
                                            if(resul.length >0){
                                                res.json({success : 2});
                                            }else{
                                                con.query('insert into server_users set ?',[insert_record], function(error, results){
                                                if ( error ){
                                                    logger.error('Error in insert user of servers');
                                                    logger.error(error);
                                                    res.json({success :0});
                                                } else {
                                                    addServerUsersTrail("-8",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",results.insertId);
                                                    res.json({success : 1});
                                                }
                                            });
                                            }
                                        });
                                    }
                                }      
                              });
                          }       
                      });
            }
         });
     }
    }); 
});
app.post("/addUserToServer1", function(req, res){
if(con == null)
con = db.openCon(con);
var data = req.body;
var record = {};
/*var pubKey = forge.pki.publicKeyFromPem(pair.public);
var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, data.user.uname+'@InfraGuard');
var publicKey = sshpubKey;
var privateKey = pair.private; */
if(data.search == 1){
record = {
	serverIp: data.serverIp,
	activityName: "addUser",
	requiredData: JSON.stringify({
		//publicKey: data.user.publicKey,
		userName: data.user.uname,
		shell: data.user.shell
	}),
	status: "0"
};	
Promise.all([
new Promise((resolve, reject) => 
{
	con.query("insert into agentActivities set ?", [record], function(err, result){
		if(err)console.log(err.stack);
			resolve(result);
	});
})
]).then((results) => {
	res.status(200).json({success: 1});
});
}
else{
Promise.all([
new Promise((resolve, reject) => {
	con.query("select * from users where email = ?", [data.user.email], function(err, result){
		if(err){
			console.log(err.stack);
			resolve(null);
		}
		else if(result.length <= 0){
			//data.user.publicKey = publicKey;
			//data.user.privateKey = privateKey; 
			data.user.passw = bcryptPassw.generateHash(data.user.passw);
			con.query("insert into users set ?", [data.user], function(err1, result1){
				if(err1){
					console.log(err1.stack);
					resolve(null);
				}
				resolve(null);
			});
		}
		else{
			resolve(0);
		}
		
	});
	
}),
new Promise((resolve, reject) => {
	con.query("select * from users where email = ?", [data.user.email], function(err, result){
		if(err){
			console.log(err.stack);
			resolve(null);
		}
		else if(result.length > 0){
			record = {
				serverIp: data.serverIp,
				activityName: "addUser",
				requiredData: JSON.stringify({
					//publicKey: result[0].publicKey,
					userName: result[0].uname,
					shell: result[0].shell
					
				}),
				status: "0"
				};
		}
		else if(result.length <= 0){
			record = {
				serverIp: data.serverIp,
				activityName: "addUser",
				requiredData: JSON.stringify({
					//publicKey: publicKey,
					userName: data.user.uname,
					shell: data.user.shell
					
				}),
				status: "0"
			};
		}
			con.query("insert into agentActivities set ?", [record], function(err1, result1){
				if(err1){
					console.log(err1.stack);
					resolve(null);
				}
				resolve(1);
			});
		
			resolve(0);
		
	});

})
]).then((results) => {
	//res.status(200).json({success: 1});
	res.status(200).json({success: 1});
});

}

});

app.post("/deleteUserFromServer", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var command_1 = "sudo userdel "+data.uname;
    var command_2 = "sudo rm -r /home/"+data.uname;
    var command_3 = "grep -c '^"+data.uname+":' /etc/passwd"
    var command = command_1+"\n"+command_2+"\n"+command_3;
    console.log(command);
    var serverId = data.serverId;
    var serveruserId = data.serveruserId;
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         var document;
         var paramsCommand;
         var platform;
         if(result[0].platform=='Windows'){
             platform ='W';
             document ='AWS-RunPowerShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
                };
         }else{
             platform ='L';
             document ='AWS-RunShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":[command_1,command_2,command_3]
                  }
                };
         }
         console.log(paramsCommand);
         if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            console.log(err, err.stack);
                            logger.error('Error in Send command');
                            logger.error(err);
                            res.json({success : 0});
                        }else{
                             sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                    res.json({success : 0});
                                }else{
                                    if(data1.StandardOutputContent=="1"){
                                        res.json({success : 0});
                                    }else{
                                        addServerUsersTrail("-7",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",serveruserId);
                                        con.query('update server_users set is_deleted = 1 where id = ?',[serveruserId], function(error, results){
                                            if ( error ){
                                                res.json({success :0});
                                            } else {
                                                res.json({success : 1});
                                            }
                                        });
                                    }
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            res.json({success : 0});
                            logger.error('Error in send command');
                            logger.error(err);
                            console.log(err, err.stack);
                        }else{
                             sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0});
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                }else{
                                    console.log(data1.StandardOutputContent)
                                    if(data1.StandardOutputContent=="1"){
                                        res.json({success : 0});
                                    }else{
                                       addServerUsersTrail("-7",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",serveruserId);
                                       con.query('update server_users set is_deleted = 1 where id = ?',[serveruserId], function(error, results){
                                            if ( error ){
                                                res.json({success :0});
                                            } else {
                                                res.json({success : 1});
                                            }
                                        });
                                    }
                                }      
                              });
                          }       
                      });
            }
         });
     }
    }); 
});
app.post("/deleteUserFromServer1", function(req, res){
if(con == null)
con = db.openCon(con);
var data = req.body;
var record = null;

if(data.search == 1){
record = {
	serverIp: data.serverIp,
	activityName: "deleteUser",
	requiredData: JSON.stringify({
		userName: data.uname
	}),
	status: "0"
};
Promise.all([
new Promise((resolve, reject) => {
	con.query("insert into agentActivities set ?", [record], function(err, result){
		if(err){
			console.log(err.stack);
			resolve(null);
		}
		resolve(result);
	});
})
]).then((results) => {
	res.status(200).json({success: 1});
});
}
else if(data.search == 2){
record = {
	serverIp: data.serverIp,
	activityName: "deleteUser",
	requiredData: JSON.stringify({
		userName: data.uname
	}),
	status: "0"
};
Promise.all([
new Promise((resolve, reject) => {

	con.query("select * from servers where serverIP = ?", [data.serverIp], function(err, result){
		if(err){
			console.log(err.stack);
			resolve(null);
		}
		else if(result.length > 0){
			var users = result[0].userList;
			if(users.indexOf(data.uname) < 0){
				resolve(0);
			}else{
			con.query("insert into agentActivities set ?", [record], function(err1, result1){
				if(err1){
					console.log(err1.stack);
					resolve(null);
				}
				resolve(1);
			});
			}
		}
		else{
			resolve(0);
		}
		
	});

})
]).then((results) => {
	res.status(200).json({success: results[0]});
});
}
else{
	res.status(200).json({success: 0});
}
});

app.post("/changeUserPrivilege", function(req, res){
if(con == null)
con = db.openCon(con);
var data = req.body;
var record = null;
record = {
	serverIp: data.serverIp,
	activityName: "changePrivilege",
	requiredData: JSON.stringify({
		userName: data.uname,
		privilege: data.userRole,
        email: data.userEmail
	}),
	status: "0"
};
Promise.all([
	new Promise((resolve, reject) => {
	con.query("insert into agentActivities set ?", [record], function(err, result){
		if(err){
			console.log(err.stack);
			resolve(null);
		}
		resolve(result);
	});
})
]).then((results) => {
	res.status(200).json({success: 1});
});
});

app.post("/lockDownServer", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("select c.*,s.region,s.vpc_id,s.instanceId,s.platform,s.serverIP,su.username from server_users su inner join servers s on(su.server_id=s.id) inner join customers c on (c.id=s.customerIAMId) where su.server_id = ?", [req.body.serverId], function(err, result){
	if(err){
          console.log(err.stack);
          res.json({success : 0});
	}else if (result.length > 0){
          var command_array = [];
          for(var i=0 ; i <result.length;i++){
             if(result[i].username !="" && result[i].username != null){
                command_array[i]= "usermod --expiredate 1 "+result[i].username;
              }
          }
          var script = command_array.toString();
          script = script.replace(/,/g, '\n');
          var AWS = require('aws-sdk');
          var sts = new AWS.STS({apiVersion: '2011-06-15'});
          //var sleep = require('system-sleep');
          var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
          console.log(result[0]);
          var creds ;
          var document;
          if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
          }else{
             document ='AWS-RunShellScript';
          }
          if(result[0].customer_name =='Right Cloud'){
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region
                });
                var params = {
                    DocumentName: document,
                    InstanceIds: [ result[0].instanceId ],
                    Parameters: { "commands":command_array }
                };
                ssm.sendCommand(params, function(err, data){
                    if(err){
                        res.json({success : 0, err_desc : err});
                    }else{
                         sleep(5000, function() {});
                        var params1 = {
                           CommandId: data.Command.CommandId,
                           InstanceId: result[0].instanceId
                        };
                        ssm.getCommandInvocation(params1, function(err, data1){
                           if(err){
                             res.json({success : 0, err_desc : err});
                           }else{
                              var record = {
                                script_id:"-10",
                                server_id:req.body.serverId,
                                user_id : req.session.uid,
                                command_id : data.Command.CommandId,
                                command_output :data1.StandardOutputContent,
                                command :script
                               }
                               con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
                                  if(err1){
                                        console.log(err1.stack);
                                        res.json({success : 0, err_desc : err1});
                                  }else{
                                      var update_sql = "update servers s set s.lockedDown=1 where s.id="+req.body.serverId;
                                      con.query(update_sql, function(err1, result1){
                                          
                                      });
                                  }
                                });
                                res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                            }      
                          });
                        }       
                    });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
		   accessKeyId: data.Credentials.AccessKeyId, 
		   secretAccessKey: data.Credentials.SecretAccessKey,
		   sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region,
                    credentials : creds
                });
                var params = {
                    DocumentName: document,
                    InstanceIds: [ result[0].instanceId ],
                    Parameters: { "commands":command_array }
                };
                 ssm.sendCommand(params, function(err, data){
                    if(err){
                        res.json({success : 0, err_desc : err});
                    }else{
                         sleep(5000, function() {});
                        var params1 = {
                           CommandId: data.Command.CommandId,
                           InstanceId: result[0].instanceId
                        };
                        ssm.getCommandInvocation(params1, function(err, data1){
                           if(err){
                             res.json({success : 0, err_desc : err});
                           }else{
                              var record = {
                                script_id:"-10",
                                server_id:req.body.serverId,
                                user_id : req.session.uid,
                                command_id : data.Command.CommandId,
                                command_output :data1.StandardOutputContent,
                                command :script
                               }
                               con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
                                  if(err1){
                                        console.log(err1.stack);
                                        res.json({success : 0, err_desc : err1});
                                  }else{
                                      var update_sql = "update servers s set s.lockedDown=1 where s.id="+req.body.serverId;
                                      con.query(update_sql, function(err1, result1){
                                          
                                      });
                                  }
                                });
                                res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                            }      
                          });
                        }       
                    });
                }
             });
         }
     }
  });
});
app.post("/unlockServer", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("select c.*,s.region,s.vpc_id,s.instanceId,s.platform,s.serverIP,su.username from server_users su inner join servers s on(su.server_id=s.id) inner join customers c on (c.id=s.customerIAMId) where su.server_id = ?", [req.body.serverId], function(err, result){
	if(err){
          console.log(err.stack);
          res.json({success : 0});
	}else if (result.length > 0){
          var command_array = [];
          for(var i=0 ; i <result.length;i++){
             if(result[i].username !="" && result[i].username != null){
                command_array[i]= "usermod --expiredate \"\" "+result[i].username;
              }
          }
          var script = command_array.toString();
          script = script.replace(/,/g, '\n');
          console.log(command_array);
          var AWS = require('aws-sdk');
          var sts = new AWS.STS({apiVersion: '2011-06-15'});
          //var sleep = require('system-sleep');
          var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
          console.log(result[0]);
          var creds ;
          var document;
          if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
          }else{
             document ='AWS-RunShellScript';
          }
          if(result[0].customer_name =='Right Cloud'){
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region
                });
                var params = {
                    DocumentName: document,
                    InstanceIds: [ result[0].instanceId ],
                    Parameters: { "commands":command_array }
                };
                ssm.sendCommand(params, function(err, data){
                    if(err){
                        res.json({success : 0, err_desc : err});
                    }else{
                        sleep(5000, function() {});
                        var params1 = {
                           CommandId: data.Command.CommandId,
                           InstanceId: result[0].instanceId
                        };
                        ssm.getCommandInvocation(params1, function(err, data1){
                           if(err){
                             res.json({success : 0, err_desc : err});
                           }else{
                              var record = {
                                script_id:"-9",
                                server_id:req.body.serverId,
                                user_id : req.session.uid,
                                command_id : data.Command.CommandId,
                                command_output :data1.StandardOutputContent,
                                command :script
                               }
                               con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
                                  if(err1){
                                        console.log(err1.stack);
                                        res.json({success : 0, err_desc : err1});
                                  }else{
                                      var update_sql = "update servers s set s.lockedDown=0 where s.id="+req.body.serverId;
                                      con.query(update_sql, function(err1, result1){
                                          
                                      });
                                  }
                                });
                                res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                            }      
                          });
                        }       
                    });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
		   accessKeyId: data.Credentials.AccessKeyId, 
		   secretAccessKey: data.Credentials.SecretAccessKey,
		   sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region,
                    credentials : creds
                });
                var params = {
                    DocumentName: document,
                    InstanceIds: [ result[0].instanceId ],
                    Parameters: { "commands":command_array }
                };
                 ssm.sendCommand(params, function(err, data){
                    if(err){
                        res.json({success : 0, err_desc : err});
                    }else{
                         sleep(5000, function() {});
                        var params1 = {
                           CommandId: data.Command.CommandId,
                           InstanceId: result[0].instanceId
                        };
                        ssm.getCommandInvocation(params1, function(err, data1){
                           if(err){
                             res.json({success : 0, err_desc : err});
                           }else{
                              var record = {
                                script_id:"-9",
                                server_id:req.body.serverId,
                                user_id : req.session.uid,
                                command_id : data.Command.CommandId,
                                command_output :data1.StandardOutputContent,
                                command :script
                               }
                               con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
                                  if(err1){
                                        console.log(err1.stack);
                                        res.json({success : 0, err_desc : err1});
                                  }else{
                                      var update_sql = "update servers s set s.lockedDown=0 where s.id="+req.body.serverId;
                                      con.query(update_sql, function(err1, result1){
                                          
                                      });
                                  }
                                });
                                res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                            }      
                          });
                        }       
                    });
                }
             });
         }
     }
  });
});
app.post("/mfaPageData", function(req, res){
if(con == null)
con = db.openCon(con);
var secret = null;
var qrcode = null;
if(req.session.uid != undefined){
	con.query("select * from users where id = ?", [req.session.uid], function(err, result){
		if(err){
			console.log(err.stack);
			res.json({success : 0});
		}
		if(result.length>0){
           if(result[0].mfaEnabled == 1){
           	 secret = JSON.parse(result[0].mfaSecret);
	           	QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
	             qrcode = data_url ;// get QR code data URL
	             res.json({mfaEnabled : 1,qrcode : qrcode,secret:secret,name:result[0].uname});
	            });
	        }
            else {
            	var name = result[0].uname+"@InfraGuardDashBoard"
               secret = speakeasy.generateSecret({length: 32,name:name,issuer:"InfraGuard"});
               QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
	             qrcode = data_url ;// get QR code data URL
	             res.json({mfaEnabled : 0,qrcode : qrcode,secret:secret,name:result[0].uname });
	            });
            }
		}
	});
}else{
	res.json({success : 0});
     }
});


app.post("/enableMFA", function(req, res){
	if(con == null)
	con = db.openCon(con);
	var obj = req.body;
	obj.backupCodeUsed = 0;
	var secretObj = JSON.stringify(obj);

	console.log("enableMFA secretObj = : "+JSON.stringify(secretObj)+"UID = : "+req.session.uid);
	if(req.session.uid != undefined){
		con.query("update users set mfaEnabled = ? , mfaSecret = ? where id = ?", [1,secretObj,req.session.uid], function(err, result){
			if(err){
				console.log(err.stack);
				res.json({success : 0});
			}else{
			console.log("743 . result= : "+JSON.stringify(result));
			res.json({success : 1});
		     }
		});
	}else{
		res.json({success : 0});
	}
});

app.post("/disableMFA", function(req, res){
	if(con == null)
	con = db.openCon(con);
	var secretObj = req.body;
	console.log("disableMFA secretObj = : "+JSON.stringify(secretObj)+"UID = : "+req.session.uid);
	if(req.session.uid != undefined){
		con.query("update users set mfaEnabled = ? , mfaSecret = ? where id = ?", [0,null,req.session.uid], function(err, result){
			if(err){
				console.log(err.stack);
				res.json({success : 0});
			}else {
			console.log("757 . result= : "+JSON.stringify(result));
			res.json({success : 1});
		    }
		});
	}else{
		res.json({success : 0});
	}
});

app.post("/matchMFAToken", function(req, res){
	if(con == null)
	con = db.openCon(con);
	var token = req.body.token;
	console.log("MFA token = : "+JSON.stringify(token) +"    Email ID = : "+req.body.email);
	con.query("select * from users where email = ?", [req.body.email], function(err, result){
		if(err){
			console.log(err.stack);
			res.json({success : 0});
		}
		else if(result.length>0){
			var secret = JSON.parse(result[0].mfaSecret);
			var mfatoken = speakeasy.totp({secret: secret.base32,encoding: 'base32'});
			console.log("mfatoken = "+mfatoken+"     usertoken = "+token+ " backup = : "+secret.hex);
			if(mfatoken == token){
				req.session.email=result[0].email;
				req.session.uid = result[0].id;
			    res.json({success : 1});
				console.log(" token matched ");
			}else if(token == secret.hex) {
				if(secret.backupCodeUsed == 1){
					res.json({success : 0,errmsg : "Backup Token Expired !"});
				}else{
					secret.backupCodeUsed = 1;
					secret = JSON.stringify(secret);
					console.log(" updated secret = ; "+JSON.stringify(secret));
					con.query("update users set  mfaSecret = ? where email = ?", [secret,req.body.email], function(err, result1){
						if(err){
							console.log(err.stack);
							res.json({success : 0});
						}else {
						req.session.email=result[0].email;
						req.session.uid = result[0].id;
					    res.json({success : 1});
						console.log("backup token matched ");
					    }
					});
     		    }
			}else{
				res.json({success : 0,errmsg : "Token not matched !"});
			}
		}
		else{
		  res.json({success : 0 ,errmsg : "ERROR !"});
		}
	});
});

app.post("/resetMFAToken", function(req, res){
	if(con == null)
	con = db.openCon(con);
	var email = req.body.email;
	var userName = req.body.userName;
	var name = userName+"@InfraGuardDashBoard";
	var secret = speakeasy.generateSecret({length: 32,name:name,issuer:"InfraGuard"});
	secret.backupCodeUsed = 0;
	var secretToString = JSON.stringify(secret);
	con.query("update users set  mfaSecret = ?,mfaEnabled = ? where email = ?", [secretToString,1,email], function(err, result){
		if(err){
			console.log(err.stack);
			res.json({success : 0});
		}
		else {
		  QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
	          qrcode = data_url ;// get QR code data URL for mailing
	          saveQRCodeImg(qrcode,email);
	          res.json({success : 1,secret:secret.hex });
	      });
        }
	});
});

app.post("/stopServerKeyRotation", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("update servers set autoKeyRotation = ? where project_id = ?", [0,req.body.projectId], function(err, result){
	if(err)console.log(err.stack);
	res.status(200).json({success : 1});
	});
});

app.post("/startServerKeyRotation", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("update servers set autoKeyRotation = ? where project_id = ?", [1,req.body.projectId], function(err, result){
	if(err)console.log(err.stack);
	res.status(200).json({success : 1});
	});
});
app.post("/updateServerKeyForProject", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("select distinct c.*,s.id as serverId,s.serverIP,u.email,s.region,s.vpc_id,s.instanceId,s.platform,su.username,su.email as uemail from servers s inner join customers c on (s.customerIAMId=c.id and c.is_deleted=0) inner join users u on(u.id=c.user_id) inner join server_users su on(su.server_id = s.id and su.is_deleted = 0) inner join projectdetails p on (s.project_id=p.id) WHERE s.project_id = ?", [req.body.projectId], function(err, result){
            if(err){

            }else{
                for(var i = 0, l = result.length; i < l; i++){
                    getUserCommand(result[i],req);
                }
            }
	});
});
app.post("/updateServerKeyForServer", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("select distinct c.*,s.id as serverId,s.serverIP,u.email,s.region,s.vpc_id,s.instanceId,s.platform,su.username,su.email as uemail from servers s inner join customers c on (s.customerIAMId=c.id and c.is_deleted=0) inner join users u on(u.id=c.user_id) inner join projectdetails p on (s.project_id=p.id) inner join server_users su on(s.id = su.server_id and su.is_deleted = 0) WHERE s.id = ?", [req.body.serverId], function(err, result){
            if(err){

            }else{
                for(var i = 0, l = result.length; i < l; i++){
                    getUserCommand(result[i],req);
                }
            }
	});
});
app.post("/getAccessKey", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("select distinct c.*,s.id as serverId,s.serverIP,u.email,s.region,s.vpc_id,s.instanceId,s.platform from servers s inner join customers c on (s.customerIAMId=c.id and c.is_deleted=0) inner join users u on(u.id=c.user_id) inner join projectdetails p on (s.project_id=p.id) WHERE s.id = ?", [req.body.serverId], function(err, result){
            if(err){

            }else{
                    getUserCommand(result[0],req,"getAccessKey");
            }
	});
});
app.post("/updateServerKeyForProject1", function(req, res){
	if(con == null)
	con = db.openCon(con);
	con.query("SELECT distinct s.serverIP,u.email,s.id FROM users u INNER JOIN companydetails c ON u.id = c.companyCreator INNER JOIN projectdetails p ON c.id = p.company_id INNER JOIN servers s ON p.id = s.project_id WHERE s.project_id = ?", [req.body.projectId], function(err, result){
	//SELECT  s.serverIP,u.email FROM users u INNER JOIN companydetails c ON u.id = c.companyCreator INNER JOIN projectdetails p ON c.id = p.company_id INNER JOIN servers s ON c.id = s.project_id WHERE s.project_id = ?;
	if(err)console.log(err.stack);
	console.log(" server ips = : "+JSON.stringify(result));
	if(result.length>0){
		console.log(" Length = : "+result.length);
		/*var ipArray = [];
		for(var i=0;i<result.length;i++){
			var id = result[i].serverIP;
			ipArray.push(id);
		}
		console.log(" ips in array = : "+ipArray);*/
		updateServerKey(result);
	}
	res.status(200).json({success : 1});
	});
});

app.post("/requestServerAccess", function(req, res){
	var email = req.session.email;
	var userName = req.body.name.toLowerCase();
	console.log(" email : "+email+"  serverIp = : "+req.body.serverIp+"  name = : "+req.body.name.toLowerCase());
	var pair = keypair();
	var pubKey = forge.pki.publicKeyFromPem(pair.public);
	var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, userName+'@InfraGuard');
	var privateKey = pair.private; 
	var serverIp = req.body.serverIp;
	var email = req.session.email;
	var record = {
				serverIp: req.body.serverIp,
				activityName: "addPubKey",
				requiredData: JSON.stringify({
					publicKey: sshpubKey,
					privKey: privateKey,
					userName: userName,
					email : email
				}),
				status: "0"
			    };
	con.query("insert into agentActivities set ?", [record], function(err1, result1){
		if(err1){
			console.log(err1.stack);
			res.json({success : 0});
		}
		res.json({success : 1});
	});
});

app.post("/createRole", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
roleName : req.body.rname,
roleDesc : req.body.rdesc,
policyId : req.body.rpolicy,
};
con.query("select * from companydetails where companyCreator = ? and companyName = ? and is_deleted=0", [req.session.uid,req.body.cname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Company Already Exists!"});
		return;
	}
	else{
		con.query("insert into roles set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});

app.post("/editRole", function(req, res){
if(con == null)
con = db.openCon(con);
		con.query("update roles set roleName = ? , roleDesc= ? , policyId = ? where id = ?", [req.body.rname,req.body.rdesc,req.body.rpolicy,req.body.rid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/deleteRole", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update roles set is_deleted = ? where id = ?", [1,req.body.rid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/getRole", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from roles where is_deleted=0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getPoliceElements", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from policy_elements where is_deleted=0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getPolicies", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from policy where is_deleted=0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getPolicyElements", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select pem.policy_element_id from policy p inner join policy_element_map pem on (p.id=pem.policy_id  and pem.is_deleted=0) where p.id='+req.body.polid+ " order by pem.policy_element_id", function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getGroupElements", function(req, res) {
if(con == null)
    con = db.openCon(con);
    //var sql ='select gcp.compnay_id, GROUP_CONCAT(gcp.project_id) as project_id from infra_group ig inner join group_company_project gcp on (ig.id=gcp.group_id and ig.is_deleted=0 and gcp.is_deleted=0) where ig.id='+req.body.groupId+' group by gcp.compnay_id';
    var sql= 'select gcp.compnay_id,gcp.project_id from infra_group ig inner join group_company_project gcp on (ig.id=gcp.group_id and ig.is_deleted=0 and gcp.is_deleted=0) where ig.id='+req.body.groupId+' order by gcp.compnay_id';
    con.query(sql, function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getUsers", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select u.id,u.email,u.uname,u.roleId,r.roleName,u.groupId,u.passw from users u inner join roles r on (u.roleId =r.id ) where u.is_deleted=0 and u.roleId is not NULL', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/getUserAcessElements", function(req, res){
if(con == null)
    con = db.openCon(con);
    var sql ="select pem.policy_element_id,u.roleId,r.roleName from users u inner join roles r on (u.roleId=r.id) inner join policy_element_map pem on (pem.policy_id=r.policyId) where u.email = '"+req.session.email+"' and r.is_deleted=0 and pem.is_deleted=0";
    con.query( sql,'0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/createPolicy", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
policyName : req.body.polname,
policyDesc : req.body.poldesc,
};
con.query("select * from policy where policyName = ? and is_deleted=0", [req.body.polname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Policy Already Exists!"});
		return;
	}
	else{
		con.query("insert into policy set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
        if(result.insertId){
            var sql = "insert into policy_element_map (policy_id,policy_element_id) values ";
            for(var i=0;i<req.body.elements.length;i++)
              sql += "('"+result.insertId+ "','" + req.body.elements[i] + "'),";
              sql = sql.substr(0,sql.length-1);
            con.query(sql,'0', function(err, result){
            if(err){
                    res.json({success : 0, err_desc : err});
                    return;
            }
           });
        }
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});


app.post("/editPolicy", function(req, res){
if(con == null)
con = db.openCon(con);
var policyElementsbyId = [];
con.query("update policy set policyName = ? , policyDesc= ? where id = ?", [req.body.polname,req.body.poldesc,req.body.polid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
        if(req.body.polid){
             con.query("select policy_element_id from policy_element_map where policy_id = ? and is_deleted=0 ", [req.body.polid], function(err, result){
                 if(result.length > 0){
                     for (var i = 0, l = result.length; i < l; i++) {
                          policyElementsbyId[i.toString()] = result[i].policy_element_id;
                          
                    }
                    var c=[];
                    j=0;
                    for (var i=0; i < req.body.elements.length; ++i){
                        if (policyElementsbyId.indexOf(req.body.elements[i]) != -1)
                            c[j++] = req.body.elements[i];
                    }
                    
                    if(req.body.elements && c){
                        for (var j=0; j < req.body.elements.length; j++){
                            if (c.indexOf(req.body.elements[j]) > -1) {
                                
                            }else{
                                var sql = "insert into policy_element_map (policy_id,policy_element_id) values ";
                                sql += "('"+req.body.polid+ "','" + req.body.elements[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                            }
                        }
                    }
                    if(policyElementsbyId && c){
                        for (var j=0; j < policyElementsbyId.length; j++){
                            if (c.indexOf(policyElementsbyId[j]) > -1) {
                                
                            }else{
                                con.query("update policy_element_map set is_deleted=1 where policy_element_id= ? and policy_id= ? ",[policyElementsbyId[j],req.body.polid], function(err, result){
                                });
                            }
                        }
                    }
                }else{
                    for (var j=0; j < req.body.elements.length; j++){
                                var sql = "insert into policy_element_map (policy_id,policy_element_id) values ";
                                sql += "('"+req.body.polid+ "','" + req.body.elements[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                        }
                }
           });
        }
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});


app.post("/deletePolicy", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update policy set is_deleted = ? where id = ?", [1,req.body.polid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/createUser", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
email : req.body.uEmail,
uname : req.body.uName,
passw : bcryptPassw.generateHash(req.body.uPass),
mfaEnabled : 0,
roleId : req.body.uRole,
};
con.query("select * from users where email = ? and is_deleted=0", [req.body.uEmail], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Email Already Exists!"});
		return;
	}
	else{
                var pubKey = forge.pki.publicKeyFromPem(pair.public);
                var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, req.body.uName+'@InfraGuard');
                data.publicKey = sshpubKey;
                data.privateKey = pair.private;
                data.shell = "/bin/bash";
                data.linuxName = req.body.uName;
		con.query("insert into users set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid ,key:pair.private});
        for(var i=0;i<req.body.uGroup.length;i++){
            var sql = "insert into user_groups (user_id,group_id) values ( "+result.insertId+","+req.body.uGroup[i]+")";
                con.query(sql,'0', function(err, result){
            });
       }
	});
	}
	
	});
});

app.post("/editUser", function(req, res){
if(con == null)
con = db.openCon(con);
		con.query("update users set uname = ? , roleId= ?   where id = ?", [req.body.uName,req.body.uRole,req.body.uId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
        var existingGroups = [];
        var string = req.body.uGroup.toString();
        req.body.uGroup = JSON.parse("[" + string + "]");
        var update_sql="select group_id from user_groups where is_deleted=0 and user_id = "+req.body.uId;
        con.query(update_sql,'0', function(err, result){
            if(result.length > 0){
                     for (var i = 0, l = result.length; i < l; i++) {
                          existingGroups[i.toString()] = result[i].group_id;
                    }
                    var c=[];
                    j=0;
                    for (var i=0; i < req.body.uGroup.length; ++i){
                        if (existingGroups.indexOf(req.body.uGroup[i]) != -1){
                            c[j++] = req.body.uGroup[i];}
                    }
                    if(req.body.uGroup && c){
                        for (var j=0; j < req.body.uGroup.length; j++){
                            if (c.indexOf(req.body.uGroup[j]) > -1) {
                            }else{
                                var sql = "insert into user_groups (user_id,group_id) values ";
                                sql += "('"+req.body.uId+ "','" + req.body.uGroup[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                            }
                        }
                    }
                    if(existingGroups && c){
                        for (var j=0; j < existingGroups.length; j++){
                            if (c.indexOf(existingGroups[j]) > -1) {
                                
                            }else{
                                con.query("update user_groups set is_deleted=1 where user_id= ? and group_id= ? ",[req.body.uId,existingGroups[j]], function(err, result){
                                });
                            }
                        }
                    }
                    }else{
                    for (var j=0; j < req.body.uGroup.length; j++){
                                var sql = "insert into user_groups (user_id,group_id) values ";
                                sql += "('"+req.body.uId+ "','" + req.body.uGroup[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                        }
                }
        });
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/deleteUser", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update users set is_deleted = ? where id = ?", [1,req.body.uId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});
app.post("/getGroups", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from infra_group where is_deleted=0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/createGroup", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
groupName : req.body.groupname,
groupDesc : req.body.groupdesc,
is_deleted : 0,
};
con.query("select * from infra_group where groupName = ? and is_deleted=0", [req.body.groupname], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Group Already Exists!"});
		return;
	}
	else{
		con.query("insert into infra_group set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
        if(result.insertId){
            var sql = "insert into group_company_project (group_id,compnay_id,project_id) values ";
            for(var i=0;i<req.body.companyIds.length;i++){
                for(var j=0;j<req.body.compnayProjects[req.body.companyIds[i]].length;j++){
                  sql += "('"+result.insertId+ "','" + req.body.companyIds[i] + "','" + req.body.compnayProjects[req.body.companyIds[i]][j] + "'),";
                }
            }
            sql = sql.substr(0,sql.length-1);
            con.query(sql,'0', function(err, result){
            if(err){
                    res.json({success : 0, err_desc : err});
                    return;
            }
           });
        }
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});

app.post("/editGroup", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
groupName : req.body.groupname,
groupDesc : req.body.groupdesc,
is_deleted : 0,
};
       con.query("update infra_group set groupName = ? , groupDesc= ? where id = ?", [req.body.groupname,req.body.groupdesc,req.body.gid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
        if(req.body.gid){
            var sql_select ="select gcp.compnay_id, GROUP_CONCAT(gcp.project_id) as project_id from infra_group ig inner join group_company_project gcp on (ig.id=gcp.group_id and ig.is_deleted=0 and gcp.is_deleted=0) where ig.id="+req.body.gid+" group by gcp.compnay_id";
            con.query(sql_select,0, function(err, result){
                var company_array = [];
                var company_array_duplicate = [];
                var project_array = [];
                var intersect_array = [];
                if(result.length > 0){
                    for (var i = 0, l = result.length; i < l; i++){
                      company_array[i]=result[i].compnay_id;
                      company_array_duplicate[i]=result[i].compnay_id;
                      project_array[result[i].compnay_id]=result[i].project_id;
                    }
                }
                intersect_array =req.body.companyIds;
                intersect_array= intersect(intersect_array,company_array);
                for( var a =company_array_duplicate.length - 1; a>=0; a--){
                    for( var b=0; b<req.body.companyIds.length; b++){
                      if(company_array_duplicate[a] === req.body.companyIds[b]){
                        company_array_duplicate.splice(a, 1);
                      }
                    }
                  }
                for( var i =req.body.companyIds.length - 1; i>=0; i--){
                    for( var j=0; j<company_array.length; j++){
                      if(req.body.companyIds[i] === company_array[j]){
                        req.body.companyIds.splice(i, 1);
                      }
                    }
                  }
            for(var c=0;c<company_array_duplicate.length;c++){
                con.query("update group_company_project set is_deleted=1 where compnay_id= ? and group_id = ?",[company_array_duplicate[c],req.body.gid], function(err, result){
                });
            }
            var sql = "insert into group_company_project (group_id,compnay_id,project_id) values ";
            for(var i=0;i<req.body.companyIds.length;i++){
                    for(var j=0;j<req.body.compnayProjects[req.body.companyIds[i]].length;j++){
                      sql += "('"+req.body.gid+ "','" + req.body.companyIds[i] + "','" + req.body.compnayProjects[req.body.companyIds[i]][j] + "'),";
                    }
            }
            sql = sql.substr(0,sql.length-1);
            con.query(sql,'0', function(err, result){
           });
           
       var companyid ="";
       for(var i=0;i<intersect_array.length;i++){
           companyid = intersect_array[i];
           var fetch_array = JSON.parse("[" + project_array[intersect_array[i]] + "]");
           var given_array = req.body.compnayProjects[intersect_array[i]];
           var instersect= intersect(fetch_array,given_array);
            for( var k=fetch_array.length - 1; k>=0; k--){
                    for( var j=0; j<instersect.length; j++){
                        if(fetch_array[k] === instersect[j]){
                            fetch_array.splice(k, 1);
                    }
                }
            }
            for( var k=given_array.length - 1; k>=0; k--){
                    for( var j=0; j<instersect.length; j++){
                        if(given_array[k] === instersect[j]){
                            given_array.splice(k, 1);
                    }
                }
            }
            if(fetch_array.length > 0){
               for(var m=0;m<fetch_array.length;m++){
                   if(fetch_array[m] != null){
                        var update_record = "update group_company_project set is_deleted = 1 where group_id = "+req.body.gid+" and compnay_id="+companyid+" and project_id="+fetch_array[m]+" and is_deleted=0";
                        con.query(update_record,'0', function(err, result){
                        }); 
                   }
                } 
            }
            if(given_array.length > 0){
               for(var n=0;n<given_array.length;n++){
                   if(given_array[n] != null){
                      var sql = "insert into group_company_project (group_id,compnay_id,project_id) values ";
                      sql += "('"+req.body.gid+ "','" + companyid + "','" + given_array[n] + "')";
                      con.query(sql,'0', function(err, result){
                     }); 
                   }
                } 
            }
       }
           });
        }
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	});
app.post("/deleteGroup", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update infra_group set is_deleted = ? where id = ?", [1,req.body.groupId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.get("/checkServerLogin", function(req, res){
	var code = req.query.c;
	if(con == null)
	con = db.openCon(con);
	con.query("select * from server_login_code where code = ? and is_deleted=0", [code], function(err, result) {
		if (err) console.log("check_email.error: ", err.stack);
		if (result.length > 0) {
			res.json({found: 1,result : result[0]});
//                        con.query("update server_login_code set is_deleted = ? where code = ? ", [1,code], function(err, result){
//                        if(err){
//                                res.json({success : 0, err_desc : err});
//                                return;
//                        }
//                        });
		} else {
			res.json({found : 0});
		}
	});
});

app.post("/addLoginCode", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
code : req.body.code,
user_id:req.session.uid,
is_deleted : 0,
};
console.log(req.body.code);
console.log(req.session.uid);
        con.query("insert into server_login_code set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});
app.post("/getUserGroups", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select group_id from user_groups where user_id='+req.body.userid+ " and is_deleted=0 order by group_id", function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/getEachServerPageDetails", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query("SELECT s.*,p.projectName,p.company_id,c.companyName FROM servers s inner join projectdetails p on (s.project_id=p.id) inner join companydetails c on (c.id=p.company_id) where s.id = ? ", [req.body.id], function(err, result){
        if ( err ){
            res.status(400).send(err.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/getLoginUserDetails", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query("SELECT u.*,r.roleName FROM users u left join roles r on(r.id=u.roleId) WHERE u.id = ? ", [req.session.uid], function(err, result){
        if ( err ){
            res.status(400).send(err.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/createSecurityGroup", function(req, res) {   
if(con == null)
  con = db.openCon(con);
  con.query("select cs.*,s.region,s.vpc_id from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.serverId], function(err, result){
        //console.log(result[0].customer_name);
      //  console.log(result[0].external_id);
      //  console.log(result[0].arn);   
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
//Assuming Role for Different Accounts
var sts = new AWS.STS({apiVersion: '2011-06-15'});
var params = {
  DurationSeconds: 3600,
  ExternalId: result[0].external_id,
  RoleArn: result[0].arn,
  RoleSessionName: "InfraGuard"
 };
var myConfig = new AWS.Config();
var creds;
//myConfig.update({region: result[0].region});

 sts.assumeRole(params, function(err, data) {
   if (err){ 
       if(err.code="CredentialsError"){
           res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
       }
         console.log(err, err.stack);
     } // an error occurred
   else {
	   creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
		myConfig.update({
				accessKeyId : data.Credentials.AccessKeyId,
				secretAccessKey : data.Credentials.SecretAccessKey,
				sessionToken : data.Credentials.SessionToken,
				region : result[0].region
		});
console.log(creds);

// Create EC2 service object
var ec2 = new AWS.EC2({apiVersion: '2016-11-15',
						region : result[0].region,
						credentials : creds});
var vpc = null;
var gr =[];
var des = "Infraguard username by " +req.session.email+" created on "+(new Date()).toLocaleDateString();
// Retrieve the ID of a VPC
//ec2.describeVpcs(function(err, data) {
//   if (err) {
//      console.log("Cannot retrieve a VPC", err);   
//   } else {
//      vpc = data.Vpcs[0].VpcId;   
//   }
//});

// Create JSON object parameters for creating the security group
var paramsSecurityGroup = {
   Description: des,
   GroupName: 'Infraguard_SG',
   VpcId: result[0].vpc_id
};

// Create the security group
ec2.createSecurityGroup(paramsSecurityGroup, function(err, data) {
   if (err) {
if(err.code=="InvalidGroup.Duplicate"){
		   con.query("select securityGroupId from server_security_groups  where serverId = ? and is_deleted=0 order by id desc", [req.body.serverId], function(err, result){
		   var params = {
					Attribute: "groupSet", 
					InstanceId: req.body.instanceId
		   };
			/*
		   var paramsIngress = {
			GroupId: result[0].securityGroupId,
			IpPermissions:[
			   { IpProtocol: "tcp",
				 FromPort: 5256,
				 ToPort: 5256,
				 IpRanges: [{"CidrIp":"0.0.0.0/0"}]}
			]
		  };
		  */
		  var paramsIngress = {
			CidrIp: '0.0.0.0/0',
			FromPort: 5256,
			GroupId: result[0].securityGroupId,
			IpProtocol: 'tcp',
			ToPort: 5256
			};
      ec2.authorizeSecurityGroupIngress(paramsIngress, function(err, data) {
      });

		  ec2.describeInstanceAttribute(params, function(err, data) {
				if(err){ console.log(err, err.stack);} // an error occurred
				else{  console.log(data);
					var checkGroup = [];
                      for(i = 0; i < data['Groups'].length; i++) {
                        checkGroup.push(data['Groups'][i].GroupId);
                      }
					  if(checkGroup.includes(result[0].securityGroupId)){
						  
					  }else{
						  checkGroup.push(result[0].securityGroupId);
						  console.log("securtiy group is not  available"+result[0].securityGroupId);
						  var params2 = {
                            Groups: checkGroup,
                            InstanceId: req.body.instanceId
							};
						ec2.modifyInstanceAttribute(params2, function(err, data) {
							if (err) console.log(err, err.stack); // an error occurred
							else     console.log(data);           // successful response
                      });
					  }
					  res.json({success : 1, err_desc : null, creator: req.session.uid});
				}
		  });			   
      
	  });		   
	}
      console.log("Error Creating Security Group", err);
   } else {
      var SecurityGroupId = data.GroupId;
       var Security = {
            userId : req.session.uid,
            serverId : req.body.serverId,
            securityGroupId :SecurityGroupId
            };
            con.query("insert into server_security_groups set ?", [Security], function(err, result){
            if(err){
                    res.json({success : 0, err_desc : err});
                    return;
            }
            res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
        });
      console.log("Security Group Created", SecurityGroupId);
	  /*
      var paramsIngress = {
		GroupId: SecurityGroupId,
        IpPermissions:[
           { IpProtocol: "tcp",
             FromPort: 5256,
             ToPort: 5256,
             IpRanges: [{"CidrIp":"0.0.0.0/0"}]}
        ]
      };
	*/
	var paramsIngress = {
			CidrIp: '0.0.0.0/0',
			FromPort: 5256,
			GroupId: SecurityGroupId,
        IpProtocol: 'tcp',
			ToPort: 5256
			};

      ec2.authorizeSecurityGroupIngress(paramsIngress, function(err, data) {
        if (err && !err.code=="InvalidPermission.Duplicate") {
            
          console.log("Error", err);
        } else {
          console.log("Ingress Successfully Set", data);
          var params = {
                Attribute: "groupSet", 
                InstanceId: req.body.instanceId
               };
               ec2.describeInstanceAttribute(params, function(err, data) {
                 if (err){ console.log(err, err.stack);} // an error occurred
                 else   {  console.log(data);
                       gr = data['Groups'];
                      var i;
                      var grouptoadd = [];
                      for(i = 0; i < gr.length; i++) {
                        grouptoadd.push(gr[i].GroupId);
                      }
                      grouptoadd.push(SecurityGroupId);
                      console.log(grouptoadd);
                      var params2 = {
                            Groups: grouptoadd,
                            InstanceId: req.body.instanceId
                        };
                      ec2.modifyInstanceAttribute(params2, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                      });
                      
                 }         // successful response
          });
       
        }
     });
   }
});        
};           // successful response
 });
});
  });

app.get("/deleteSecurityGroupB", function(req, res){
    if(con == null)
    con = db.openCon(con);
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    //Assuming Role for Different Accounts
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
    var sql = "SELECT ssg.*,s.instanceId,s.region,c.external_id,c.arn FROM server_security_groups ssg inner join servers s on (s.id=ssg.serverId) inner join customers c on (c.id=s.customerIAMId) WHERE ssg.id = "+req.query.id+" and ssg.is_deleted=0";
    console.log(sql);
    con.query("SELECT ssg.*,s.instanceId,s.region,c.external_id,c.arn FROM server_security_groups ssg inner join servers s on (s.id=ssg.serverId) inner join customers c on (c.id=s.customerIAMId) WHERE ssg.id = ? and ssg.is_deleted=0", [req.query.id], function(err, result){
        if ( err ){
            res.status(400).send(err.stack);
        } else {
               var params = {
                DurationSeconds: 3600,
                ExternalId: result[0].external_id,
                RoleArn: result[0].arn,
                RoleSessionName: "InfraGuard"
               };
               AWS.config.Credentials=null;
               sts.assumeRole(params, function(err, data) {
                 if (err){ 
                     if(err.code="CredentialsError"){
                         res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                     }
                  }
              AWS.config.update({
                      accessKeyId : data.Credentials.AccessKeyId,
                      secretAccessKey : data.Credentials.SecretAccessKey,
                      sessionToken : data.Credentials.SessionToken,
                      region : result[0].region
              });
             var params = {
		Attribute: "groupSet", 
		InstanceId: result[0].instanceId
            };
            ec2.describeInstanceAttribute(params, function(err, data) {
	    if(err){ 
                console.log(err, err.stack);
            } // an error occurred
	    else{
                console.log(data);
		var checkGroup = [];
                for(i = 0; i < data['Groups'].length; i++) {
                     checkGroup.push(data['Groups'][i].GroupId);
                }
	       if(checkGroup.includes(result[0].securityGroupId)){
			var index = checkGroup.indexOf(result[0].securityGroupId);
                        if (index > -1) {
                            checkGroup.splice(index, 1);
                        }
                     var params2 = {
                            Groups: checkGroup,
                            InstanceId: result[0].instanceId
                        };
                      ec2.modifyInstanceAttribute(params2, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                      });
                }
		res.json({success : 1, err_desc : null, creator: req.session.uid});
	   }
	});
        });
   }
    });
});
app.post("/deleteSecurityGroup", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query("SELECT * FROM server_security_groups WHERE userId = ? and serverId = ? and is_deleted=0", [req.session.uid,req.body.serverId], function(err, result){
        if ( err ){
            res.status(400).send(err.stack);
        } else {
            //res.status(200).send(result);
            
                        // Load the AWS SDK for Node.js
            var AWS = require('aws-sdk');
            // Set the region 
            var PropertiesReader = require('properties-reader');
            var properties = PropertiesReader('/infraguard/infraguard/config/aws.txt');
            AWS.config.update({
                    accessKeyId :properties.get('access_key_id'),
                    secretAccessKey : properties.get('secret_key'),
                    region : 'ap-southeast-1'
            })
            AWS.config.update({region: 'ap-southeast-1'});
            // Create EC2 service object
            var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
            var params = {
               GroupId: result[0].securityGroupId
            };
            // Delete the security group
            ec2.deleteSecurityGroup(params, function(err, data) {
               if (err) {
                  console.log("Error", err);
               } else {
                  console.log("Security Group Deleted");
                  con.query("update server_security_groups set is_deleted=1 WHERE userId = ? and serverId = ?  and securityGroupId =?", [req.session.uid,req.body.serverId,result[0].securityGroupId], function(err, result){
                  if(err){
                            res.json({success : 0, err_desc : err});
                            return;
                  }
                  res.json({success : 1, creator: req.session.uid});
                  });
               }
            });
        }
    });
});

app.post("/createCustomer", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
customer_name : req.body.custName,
arn:req.body.custARN,
external_id : req.body.custExternalID,
user_id : req.session.uid,
service_arn : req.body.custServiceARN
};
    con.query("select * from customers where customer_name = ?  and is_deleted = 0", [req.body.custName], function(err, result){
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Customer name Already Exists!"});
		return;
	}
        else{

        con.query("insert into customers set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
    }
});
});
app.post("/editCustomer", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
customer_name : req.body.custName,
arn:req.body.custARN,
external_id : req.body.custExternalID
};
        con.query("update customers set customer_name = ? ,arn = ? , external_id = ? ,service_arn = ?   where id = ?", [req.body.custName,req.body.custARN,req.body.custExternalID,req.body.custServiceARN,req.body.custId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});

});

app.post("/deleteCustomer", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update customers set is_deleted = ? where id = ?", [1,req.body.custId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

    app.post("/getCustomers", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        if (req.body.roleId == 1) {
            con.query('select * from customers where is_deleted = 0', function (error, results) {
                if (error) {
                    res.status(400).send(error.stack);
                } else {
                    res.status(200).send(results);
                }
            });
        } else {
            con.query("select cust.* from customers cust inner join customer_mapping map on (cust.id = map.customer_id and map.is_deleted=0) order by cust.id", function (err, results) {
                if (err) {
                    res.status(400).send(err.stack);
                } else {
                    res.status(200).send(results);
                }
            });
        }
    });

app.post("/assignCustomer", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('update servers set customerIAMId = ? where id = ?',[req.body.custId,req.body.serverId], function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.json({success : 1, err_desc : null, row_id: results.insertId, creator: req.session.uid});
        }
    });
});

app.post("/sshlog", function(req, res) {
    console.log(req.body.ssh_command)
    if(con == null)
    con = db.openCon(con);
    var record = null;
    var record = {
	serverIp: req.body.serverIp,
	activityName: "rawCommand",
	requiredData: JSON.stringify({
		rawCommand: req.body.ssh_command
	}),
	status: "0"
};
    con.query("insert into agentActivities set ?", [record], function(err, result){
		if(err)console.log(err.stack);
                if(result.insertId){
                    //var sleep = require('system-sleep');
                         sleep(1000, function() {});
                        con.query('select * from agentActivities where id = ?',[result.insertId], function(error, results){
                        if ( error ){
                            res.status(400).send(error.stack);
                        } else {
                               if(results[0].response == null){
                                     sleep(1000, function() {});
                                    con.query('select * from agentActivities where id = ?',[result.insertId], function(error, results){
                                    if ( error ){
                                        res.status(400).send(error.stack);
                                    } else {
                                           if(results[0].response == null){
                                                 sleep(1000, function() {});
                                                con.query('select * from agentActivities where id = ?',[result.insertId], function(error, results){
                                                if ( error ){
                                                    res.status(400).send(error.stack);
                                                } else {
                                                       if(results[0].response == null){
                                                            sleep(1000, function() {});
                                                            con.query('select * from agentActivities where id = ?',[result.insertId], function(error, results){
                                                            if ( error ){
                                                                res.status(400).send(error.stack);
                                                            } else {
                                                                   if(results[0].response == null){
                                                                        sleep(1000, function() {});
                                                                        con.query('select * from agentActivities where id = ?',[result.insertId], function(error, results){
                                                                        if ( error ){
                                                                            res.status(400).send(error.stack);
                                                                        } else {
                                                                               if(results[0].response == null){
                                                                                   results[0].response="Request Time Out";
                                                                               }
                                                                                  res.json({success : 1, response : results[0].response, row_id: results.insertId, creator: req.session.uid});
                                                                               
                                                                        }
                                                                       });

                                                                   }else{
                                                                      res.json({success : 1, response : results[0].response, row_id: results.insertId, creator: req.session.uid});
                                                                   }
                                                            }
                                                           });

                                                       }else{
                                                          res.json({success : 1, response : results[0].response, row_id: results.insertId, creator: req.session.uid});
                                                       }
                                                }
                                               });

                                           }else{
                                              res.json({success : 1, response : results[0].response, row_id: results.insertId, creator: req.session.uid});
                                           }
                                    }
                                   });

                               }else{
                                  res.json({success : 1, response : results[0].response, row_id: results.insertId, creator: req.session.uid});
                               }
                        }
                       });
                }
    });
    
});


app.get("/commandexecutedbyagent", function(req, res){
	var id = parseInt(req.query.id);
        var status = parseInt(req.query.status);
        var commandOutput = req.query.commandOutput;
	if(con == null)
	con = db.openCon(con);
            con.query("update agentActivities set status = ?,response = ? where id = ? ",[1,commandOutput,id], function(err, result) {
                        if(err){
                                res.json({success : 0, err_desc : err});
                                return;
                        }
                        res.json({success : 1, err_desc : "success"});
           });
        
});

app.post("/createCronJob", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var server_name  = req.body.job_name.replace(/ /g,"-")
    server_name  = server_name.replace('.', '');
    console.log(server_name);
    var data = {
        job_name : req.body.job_name,
        job_command : req.body.job_command,
        minute:req.body.minute,
        hour : req.body.hour,
        day_of_month:req.body.day_of_month,
        month : req.body.month,
        day_of_week:req.body.day_of_week,
        server_job_name : server_name
    };
    con.query('select * from cron_job where job_name = "' +req.body.job_name+ '" and is_deleted=0', function(err, result){
        if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Job with same name is Already Exists!"});
		return;
	}else {
           con.query('insert into cron_job set ?',[data], function(error, results){
                if ( error ){
                    res.status(400).send(error.stack);
                } else {
                    res.json({success : 1, err_desc : null, row_id: results.insertId, creator: req.session.uid});
                }
            }); 
        }
    });
});

app.post("/editCronJob", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from cron_job where id = '+req.body.cron_job_id, function(e, r){
    con.query('update cron_job set minute = ? ,hour = ? , day_of_month = ? , month = ? ,day_of_week = ? where id = ?',[req.body.minute,req.body.hour,req.body.day_of_month,req.body.month,req.body.day_of_week,req.body.cron_job_id], function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            var sql = "select s.serverIP from cronjob_server_mapping csm inner join servers s on (csm.server_id=s.id) where csm.cronjob_id= "+req.body.cron_job_id+" and csm.is_deleted=0";
            con.query(sql, function(error, result){
                if(result.length > 0){
                    for(var i=0; i < result.length ;i++){
                      var record = {
                            serverIp: result[0].serverIP,
                            activityName: "editCron",
                            requiredData: JSON.stringify({
                                   url: req.body.minute + " " + req.body.hour + " " + req.body.day_of_month + " " + req.body.month + " " + req.body.day_of_week + " " + req.body.job_command,
                                   jobName : req.body.server_job_name,
                                   jobId : req.body.cron_job_id,
                                   oldUrl : r[0].minute + " " + r[0].hour + " " + r[0].day_of_month + " " + r[0].month + " " + r[0].day_of_week + " " + r[0].job_command,
                            }),
                            status: "0"
                       };
                       con.query("insert into agentActivities set ?", [record], function(err, result_ag){
                       });  
                    }
                }
            });
            res.json({success : 1, err_desc : null, row_id: results.insertId, creator: req.session.uid});
        }
    });
   });
});

app.post("/getCronjobs", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from cron_job where is_deleted=0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getAllocateServersData", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('SELECT csm.id,csm.server_id,c.id as company_id,p.id as project_id FROM cronjob_server_mapping csm inner join servers s on (s.id=csm.server_id) inner join projectdetails p on (p.id=s.project_id) inner join companydetails c on (c.id=p.company_id) WHERE  csm.is_deleted=0 and cronjob_id = '+req.body.cron_job_id+ '  order by p.id', function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/allocateServer", function(req, res){
if(con == null)
    con = db.openCon(con);
    var server_strings = req.body.servers_array.toString();
    var array = JSON.parse("[" + server_strings + "]");
    var resultingArray = [];
    var cron_details = "select * from cron_job where id = "+req.body.cron_job_id;
    con.query(cron_details,'0', function(err, result_details){
      con.query('select * from cronjob_server_mapping where is_deleted=0 and cronjob_id = '+req.body.cron_job_id, function(error, result){
                 if(result.length > 0){
                     for (var i = 0, l = result.length; i < l; i++) {
                          resultingArray[i.toString()] = result[i].server_id;
                          
                    }
                    console.log(resultingArray);
                    var c=[];
                    j=0;
                    for (var i=0; i < array.length; ++i){
                        if (resultingArray.indexOf(array[i]) != -1)
                            c[j++] = array[i];
                    }
                    console.log(c);
                    console.log(array);
                    if(array && c){
                        for (var j=0; j < array.length; j++){
                            if (c.indexOf(array[j]) > -1) {
                                
                            }else{
                                var sql = "insert into cronjob_server_mapping (cronjob_id,server_id) values ";
                                sql += "('"+req.body.cron_job_id+ "','" + array[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                                var serverIp = "select serverIP from servers where id = "+array[j];
                                    con.query(serverIp, function(err, resultIp){
                                        var record = {
                                                serverIp: resultIp[0].serverIP,
                                                activityName: "createCron",
                                                requiredData: JSON.stringify({
                                                        url: result_details[0].minute+" "+result_details[0].hour+" "+result_details[0].day_of_month+" "+result_details[0].month+" "+result_details[0].day_of_week+" "+result_details[0].job_command,
                                                        jobName : result_details[0].server_job_name,
                                                        jobId : req.body.cron_job_id
                                                }),
                                                status: "0"
                                        };
                                        con.query("insert into agentActivities set ?",[record], function(err, result_ag){
                                        });
                                    });
                            }
                        }
                    }
                    if(resultingArray && c){
                        for (var j=0; j < resultingArray.length; j++){
                            if (c.indexOf(resultingArray[j]) > -1) {
                                
                            }else{
                                var serverIp = "select serverIP from servers where id = "+resultingArray[j];
                                con.query(serverIp, function(err, resultIp){
                                        var record = {
                                                serverIp: resultIp[0].serverIP,
                                                activityName: "deleteCron",
                                                requiredData: JSON.stringify({
                                                        url: result_details[0].minute+" "+result_details[0].hour+" "+result_details[0].day_of_month+" "+result_details[0].month+" "+result_details[0].day_of_week+" "+result_details[0].job_command,
                                                        jobName : result_details[0].server_job_name,
                                                        jobId : req.body.cron_job_id
                                                }),
                                                status: "0"
                                        };
                                        con.query("insert into agentActivities set ?",[record], function(err, result_ag){
                                        });
                                 });
                                con.query("update cronjob_server_mapping set is_deleted=1 where server_id= ? and cronjob_id= ? ",[resultingArray[j],req.body.cron_job_id], function(err, result){
                                });
                            }
                        }
                    }
                }else{
                         for (var j=0; j < array.length; j++){
                                var sql = "insert into cronjob_server_mapping (cronjob_id,server_id) values ";
                                sql += "('"+req.body.cron_job_id+ "','" + array[j] + "')";
                                con.query(sql,'0', function(err, result){
                                });
                                var serverIp = "select serverIP from servers where id = "+array[j];
                                    con.query(serverIp, function(err, resultIp){
                                        var record = {
                                                serverIp: resultIp[0].serverIP,
                                                activityName: "createCron",
                                                requiredData: JSON.stringify({
                                                        url: result_details[0].minute+" "+result_details[0].hour+" "+result_details[0].day_of_month+" "+result_details[0].month+" "+result_details[0].day_of_week+" "+result_details[0].job_command,
                                                        jobName : result_details[0].server_job_name,
                                                        jobId : req.body.cron_job_id
                                                }),
                                                status: "0"
                                        };
                                        con.query("insert into agentActivities set ?",[record], function(err, result_ag){
                                        });
                                    });
                        }
                }
           con.query("SELECT csm.*,s.serverName,p.projectName,c.companyName FROM cronjob_server_mapping csm inner join servers s on (s.id=csm.server_id) inner join projectdetails p on (p.id=s.project_id) inner join companydetails c on (c.id=p.company_id) WHERE  csm.is_deleted=0 and cronjob_id = ?", [req.body.cron_job_id], function(error, results){
                      res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid , cronservers : results});
           })
	});
        });
});
app.post("/getCronjobbyId", function(req, res){
if(con == null)
    con = db.openCon(con);
    var obj = {};
	obj.cronjobdata = null;
	obj.cronjobservers = null;
	Promise.all([
		new Promise((resolve, reject) => {
			con.query("select * from cron_job where is_deleted=0 and id = ?", [req.body.id], function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		}),

		new Promise((resolve, reject) => {
			con.query("SELECT csm.*,s.serverName,p.projectName,c.companyName FROM cronjob_server_mapping csm inner join servers s on (s.id=csm.server_id) inner join projectdetails p on (p.id=s.project_id) inner join companydetails c on (c.id=p.company_id) WHERE  csm.is_deleted=0 and cronjob_id = ?", [req.body.id], function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		})
           ]).then(function(results){
		obj.cronjobdata = results[0];
		obj.cronjobservers = results[1];
		res.status(200).json(obj);
	});   
});


app.post("/checkCronJobServers", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select * from cronjob_server_mapping csm where csm.is_deleted = 0 and csm.cronjob_id  = '+req.body.cron_job_id, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            if(result.length > 0){
                res.json({success : 0});
            }else{
                res.json({success : 1});
            }
        }
    });
});

app.post("/deleteCronJob", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('update cron_job set is_deleted = 1 where id  = '+req.body.cron_job_id, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.json({success : 1});
        }
    });
});

app.get("/getServer", function(req, res){
    if(con == null)
	con = db.openCon(con);
    var serverIp = req.query.serverIp;
    	con.query("select activityName,requiredData,convert(id,char(10)) as id from agentActivities where serverIp = ? and status = ?",[serverIp,0], function(err, result) {
		if (err) console.log("check_email.error: ", err.stack);
		if (result.length > 0) {
			res.status(400).send(result);
		} else {
			res.json({found : 0});
		}
	});
});


app.get("/commandexecutedbyagentforcron", function(req, res){
	var id = parseInt(req.query.id);
	if(con == null)
	con = db.openCon(con);
            con.query("update agentActivities set status = ? where id = ? ",[1,id], function(err, result) {
                        if(err){
                                res.json({success : 0, err_desc : err});
                                return;
                        }
                        res.json({success : 1, err_desc : "success"});
           });
});

app.post("/getRunningCronJobsForProjects", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select c.*,csm.server_id from cronjob_server_mapping csm inner join cron_job c on(c.id=csm.cronjob_id) where csm.is_deleted = 0 and csm.project_id  = '+req.body.project_id + ' group by cronjob_id', function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/getRunningCronJobsForServers", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select c.*,csm.server_id from cronjob_server_mapping csm inner join cron_job c on(c.id=csm.cronjob_id) where csm.is_deleted = 0 and csm.server_id  = '+req.body.server_id, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/deleteCronFromServer", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query("update cronjob_server_mapping set is_deleted=1 where server_id= ? and cronjob_id= ? ",[req.body.serverId,req.body.cronId], function(err, result){
         if(err){
            res.status(400).send(err.stack);
         }else{
             deleteCronForServer(req.body.serverId,req.body.cronDetails,req,res);
         }
    });
});

app.post("/deleteCronFromProject", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query("update cronjob_server_mapping set is_deleted=1 where project_id= ? and cronjob_id= ? ",[req.body.projectId,req.body.cronId], function(err, result){
         if(err){
            res.status(400).send(err.stack);
         }else{
              var record = {
                   serverIp: req.body.serverIp,
                   activityName: "deleteCron",
                   requiredData: JSON.stringify({
                      url: req.body.cronDetails,
                      jobName : req.body.server_job_name,
                      jobId : req.body.cronId
                   }),
                   status: "0"
              };
              con.query("insert into agentActivities set ?", [record], function(err, result_ag){
              });
                res.json({success : 1});
         }
    });
});

    app.post("/createScript", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        var data = {
            script_name: req.body.script_name,
            script_desc: req.body.script_desc,
            script: req.body.script
        };
        con.query('select * from automation_scripts where script_name = "' + req.body.script_name + '" and is_deleted=0', function (err, result) {
            if (err) {
                res.json({success: 2, err_desc: err});
                return;
//	}
//	else if(result.length > 0){
//		res.json({success : 2, err_desc : "Script with same name is Already Exists!"});
//		return;
            } else {
                con.query('insert into automation_scripts set ?', [data], function (error, results) {
                    if (error) {
                        res.status(400).send(error.stack);
                    } else {
                        if (req.body.project_id != undefined) {
                            var sql = "insert into automation_mapping (script_id,project_id,server_id) values ";
                            for (var i = 0; i < req.body.serverIds.length; i++) {
                                sql += "('" + results.insertId + "','" + req.body.project_id + "','" + req.body.serverIds[i] + "'),";
                            }
                            sql = sql.substr(0, sql.length - 1);
                            con.query(sql, '0', function (err, result) {
                                //  res.json({success: 1, err_desc: null, row_id: results.insertId, creator: req.session.uid});
                            });
                        }
                        if (req.body.parameter.length > 0) {
                            var sql = "insert into automation_parameter (script_id,name) values ";
                            for (var i = 0; i < req.body.parameter.length; i++) {
                                sql += "('" + results.insertId + "','" + req.body.parameter[i] + "'),";
                            }
                            sql = sql.substr(0, sql.length - 1);
                            console.log(sql);
                            con.query(sql, '0', function (err, result) {
                                // res.json({success: 1, err_desc: null, row_id: results.insertId, creator: req.session.uid});
                            });
                        }
                        res.json({success: 1, err_desc: null, row_id: results.insertId, creator: req.session.uid});
                    }
                });
            }
        });
    });
app.post("/deleteScript", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update automation_scripts set is_deleted = ? where id = ?", [1,req.body.scriptId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

    app.post("/scriptSchedule", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        var data = {
            script_id: req.body.script_id,
            project_id: req.body.project_id,
            automationDate: req.body.new_date,
            automationTime: req.body.script_time
        };
        con.query('select * from script_scheduler where script_id = "' + req.body.script_id + '" and is_executed=0 and is_deleted=0', function (err, result) {
            if (err) {
                res.json({success: 2, err_desc: err});
                return;
            } else if (result.length > 0) {
                con.query("update script_scheduler set project_id= ?, automationDate = ? , automationTime= ? where script_id = ? and is_executed=0 and is_deleted=0", [ req.body.project_id, req.body.new_date, req.body.script_time, req.body.script_id], function (err, result) {
                    if (err) {
                        res.json({success: 0, err_desc: err});
                        return;
                    }
                });
            } else {
                con.query('insert into script_scheduler set ?', [data], function (error, result) {
                    if (error) {
                        res.status(400).send(error.stack);
                    }
                });
            }
            res.json({success: 1, err_desc: null, row_id: result.insertId, creator: req.session.uid});
        });
    });

    app.post("/getScriptSchedule", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query("select * from script_scheduler where script_id = ? and is_executed = 0 and is_deleted = 0", [req.body.scriptId], function (error, results) {
            if (error) {
                res.status(400).send(error.stack);
            } else {
                res.status(200).send(results);
            }
        });
    });

    app.post("/deleteScriptSchedule", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query("update script_scheduler set is_deleted = 1 where script_id = ? and is_executed = 0", [req.body.script_id], function (err, results) {
            if (err) {
                res.json({success: 0, err_desc: err});
                return;
            } else {
                res.json({success: 1, creator: req.session.uid});
            }
        });
    });

    app.post("/getExecutedScripts", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query('select * from script_scheduler where script_id = ? and is_executed = 1 and is_deleted = 0',[req.body.script_id], function (error, results) {
            if (error) {
                res.status(400).send(error.stack);
            } else {
                res.status(200).send(results);
            }
        });
    });

app.post("/getAutomationScripts", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('select * from automation_scripts where is_deleted=0 order by id desc', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getProjectAutomationScripts", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select distinct a.* from automation_scripts a inner join automation_mapping am on (a.id=am.script_id and a.is_deleted = 0) where am.project_id='+req.body.project_id+' order by id desc', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/getServerAutomationScripts", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select a.* from automation_scripts a inner join automation_mapping am on (a.id=am.script_id and a.is_deleted = 0) where am.server_id='+req.body.server_id+' order by id desc', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/patchList", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select * from patching_log where is_deleted=0 and server_id='+req.body.serverId, function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

    app.post("/editScript", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query('update automation_scripts set script_desc = ? ,script = ?  where id = ?', [req.body.script_desc, req.body.script, req.body.script_id], function (error, results) {
            if (error) {
                res.status(400).send(error.stack);
            }
            if (req.body.parameter.length > 0) {
                var deleteParameter = [];
                deleteParameter = req.body.parameter_name.filter(function (item) {
                    return req.body.parameter.indexOf(item) === -1;
                });
                if (deleteParameter.length > 0) {
                    var sql = "update automation_parameter set is_deleted = 1 where (";
                    for (var i = 0; i < deleteParameter.length; i++) {
                        sql += " name = '" + deleteParameter[i] + "' or";
                    }
                    sql = sql.substr(0, sql.length - 2);
                    sql += ") and script_id = " + req.body.script_id;
                    console.log(sql);
                    con.query(sql, '0', function (err, results) {
                        if (err) {
                            res.status(400).send(err.stack);
                        }
                    });
                }
                con.query("select * from automation_parameter where script_id = ? and is_deleted = 0", [req.body.script_id], function (err, results) {
                    if (results.length > 0) {
                        var sql1 = "insert into automation_parameter (Id, name) values ";
                        for (var i = 0; i < results.length; i++) {
                            sql1 += "('" + results[i].id + "','" + results[i].name + "'),";
                        }
                        sql1 = sql1.substr(0, sql1.length - 1);
                        sql1 += " on duplicate key update name = values(name)";
                        console.log(sql1);
                        con.query(sql1, '0', function (err, results) {
                            if (err) {
                                res.status(400).send(err.stack);
                            }
                        });
                    }
                    var newParameter = [];
                    newParameter = req.body.parameter.filter(function (item) {
                        return req.body.parameter_name.indexOf(item) === -1;
                    });
                    if (newParameter.length > 0) {
                        var sql2 = "insert into automation_parameter (script_id,name) values ";
                        for (var i = 0; i < newParameter.length; i++) {
                            sql2 += "('" + req.body.script_id + "','" + newParameter[i] + "'),";
                        }
                        sql2 = sql2.substr(0, sql2.length - 1);
                        console.log(sql2);
                        con.query(sql2, '0', function (err, results) {
                            if (err) {
                                res.status(400).send(err.stack);
                            }
                        });
                    }
                });
            } else {
                con.query("update automation_parameter set is_deleted = 1 where script_id = ?", [req.body.script_id], function (err, results) {
                });
            }
            res.json({success: 1, err_desc: null, row_id: results.insertId, creator: req.session.uid});
        });
        });

    app.post("/getParameter", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query('select * from automation_parameter where script_id = ? and is_deleted = 0', [req.body.scriptId], function (error, result) {
            if (error) {
                res.status(400).send(error.stack);
            } else {
                res.status(200).send(result);
            }
        });
    });

app.post("/deleteScript", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update automation_scripts set is_deleted = ? where id = ?", [1,req.body.script_id], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/getScriptsById", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query('SELECT * from automation_scripts where id = '+req.body.script_id, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});
app.post("/runScript", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.serverId], function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         
         sts.assumeRole(params, function(err, data){
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
            }
            runScriptMethod(result[0],document,creds,req,res);
        });
    });
});


app.post("/runScriptForMultiPleServes", function(req, res){
    if(con == null)
    con = db.openCon(con);
    var serverIds = req.body.serverIds.toString();
    var output="";
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.id as serverId from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id in ("+serverIds+")", function(err, result){
        if(result.length > 0){
            j=0;
            for(var i=0;i<result.length;i++){
                assumeRoleForServer(result[i],req,res,0, function(resultss){
                    j++;
                    output += resultss;
                    if(j==result.length){
                        res.json({success : 1,response:output});
                    }
                });
             
            }
        }
    });
});

app.post("/runScriptForProject", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var instanceIdString = "";
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.project_id = ?", [req.body.projectId], function(err, result){
       if(result.length > 0){
            for (var i = 0, l = result.length; i < l; i++)
               instanceIdString += result[i].instanceId + ",";
               instanceIdString = instanceIdString.substr(0,instanceIdString.length-1);
        } 
        var instanceIdsArray = instanceIdString.split(","); 
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         var script_string = req.body.script.replace(/\n/g, ",");  
         var command_array = script_string.split(",");
         //var sleep = require('system-sleep');
         if(result[0].customer_name =='Right Cloud'){
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region
                });
                  var params = {
                        DocumentName: document,
                        InstanceIds: instanceIdsArray,
                        Parameters: 
                            {
                                "commands":command_array
                            }
                      };
                      ssm.sendCommand(params, function(err, data){
                        if (err) console.log(err, err.stack);
                        else{
                            sleep(1000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0, err_desc : err});
                                }else{
                                    if(data1.StandardOutputContent==""){
                                      sleep(4000, function() {});
                                      ssm.getCommandInvocation(params1, function(err, data1){
                                        if(err){
                                             res.json({success : 0, err_desc : err});
                                        }else{ 
                                            addServerTrail(req.body.script_id,null,data.Command.CommandId,data1.StandardOutputContent,req.body.script,req.session.uid,req.body.projectId)
                                        }
                                      });
                                    }else{
                                        addServerTrail(req.body.script_id,null,data.Command.CommandId,data1.StandardOutputContent,req.body.script,req.session.uid,req.body.projectId);
                                    }
                                    res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                  var params = {
                        DocumentName: document,
                        InstanceIds: instanceIdsArray,
                        Parameters: 
                            {
                                "commands":command_array
                            }
                      };
                      ssm.sendCommand(params, function(err, data){
                        if (err) console.log(err, err.stack);
                        else{
                            sleep(1000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0, err_desc : err});
                                }else{
                                    if(data1.StandardOutputContent==""){
                                      sleep(4000, function() {});
                                      ssm.getCommandInvocation(params1, function(err, data1){
                                        if(err){
                                             res.json({success : 0, err_desc : err});
                                        }else{ 
                                            addServerTrail(req.body.script_id,null,data.Command.CommandId,data1.StandardOutputContent,req.body.script,req.session.uid,req.body.projectId);
                                        }
                                      });
                                    }else{
                                        addServerTrail(req.body.script_id,null,data.Command.CommandId,data1.StandardOutputContent,req.body.script,req.session.uid,req.body.projectId);
                                    }
                                    res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
                                }      
                              });
                          }       
                      });
            }
         });
      }
    });
});

app.post("/getScriptHistory", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select ass.*,s.serverName,s.serverIp,u.email,ssm.script_run_time,ssm.command_output,ssm.id as history_id from automation_scripts ass inner join script_ssm_history ssm on (ass.id = ssm.script_id)  inner join servers s on (s.id=ssm.server_id) inner join users u on(u.id=ssm.user_id) where ass.id= '+req.body.script_id+' order by ssm.script_run_time desc', function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/getAgentActivityDetails", function(req, res){
if(con == null)
    con = db.openCon(con);
    con.query('select ass.*,s.serverName,s.serverIp,ssm.script_run_time,ssm.command_output from automation_scripts ass inner join script_ssm_history ssm on (ass.id = ssm.script_id)  inner join servers s on (s.id=ssm.server_id) where ssm.id='+req.body.history_id, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/getProjectCrons", function(req, res){
if(con == null)
    con = db.openCon(con);
    var sql = "select distinct c.*,p.projectName from cron_job c inner join cronjob_server_mapping csm on (c.id=csm.cronjob_id and csm.is_deleted=0) inner join servers s on (s.id = csm.server_id) inner join projectdetails p on (s.project_id=p.id) where s.project_id ="+req.body.id;
    con.query(sql, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post("/getServersByCron", function(req, res){
if(con == null)
    con = db.openCon(con);
    var sql = "select s.serverName,s.serverIP,c.* from cronjob_server_mapping csm inner join servers s on (csm.server_id=s.id and csm.is_deleted=0) inner join cron_job c on (c.id=csm.cronjob_id) where csm.cronjob_id="+req.body.cron_id;
    con.query(sql, function(error, result){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(result);
        }
    });
});


app.post("/deleteCronFromAllServers", function(req, res){
if(con == null)
    con = db.openCon(con);
    var sql = "select c.*,csm.server_id,s.serverIP from cron_job c inner join cronjob_server_mapping csm on (c.id=csm.cronjob_id and c.is_deleted=0 and csm.is_deleted=0) inner join servers s on (csm.server_id=s.id) where c.id="+req.body.cron_id;
    con.query(sql, function(error, result){
        if ( error ){
            res.json({success : 2, err_desc : error});
            return;
        } else {
            con.query("update cronjob_server_mapping csm set csm.is_deleted=1 where csm.cronjob_id="+req.body.cron_id, function(err, results){
                if ( err ){
                    res.json({success : 2, err_desc : err});
                    return;
                }else{
                        for (var j = 0; j < result.length; j++){
                        var record = {
                        serverIp: result[0].serverIP,
                                activityName: "deleteCron",
                                requiredData: JSON.stringify({
                                url: result[j].minute + " " + result[j].hour + " " + result[j].day_of_month + " " + result[j].month + " " + result[j].day_of_week + " " + result[j].job_command,
                                        jobName : result[j].server_job_name,
                                        jobId : req.body.cron_job_id
                                }),
                                status: "0"
                        };
                                con.query("insert into agentActivities set ?", [record], function(err, result_ag){
                                });
                        }
                       res.json({success : 1, err_desc : null, creator: req.session.uid}); 
                }
            });
            
        }
    });
});

app.post("/createProjectCron", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var server_name  = req.body.job_name.replace(/ /g,"-");
    server_name  = server_name.replace('.', '');
    console.log(server_name);
    var data = {
        job_name : req.body.job_name,
        job_command : req.body.job_command,
        minute:req.body.minute,
        hour : req.body.hour,
        day_of_month:req.body.day_of_month,
        month : req.body.month,
        day_of_week:req.body.day_of_week,
        server_job_name : server_name
    };
    var cronToAdd = req.body.minute+" "+req.body.hour+" "+req.body.day_of_month+" "+req.body.month+" "+req.body.day_of_week+" "+req.body.job_command;
    con.query('select * from cron_job where job_name = "' +req.body.job_name+ '" and is_deleted=0', function(err, result){
        if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Job with same name is Already Exists!"});
		return;
	}else {
           con.query('insert into cron_job set ?',[data], function(error, results){
                if ( error ){
                    res.status(400).send(error.stack);
                } else {
                     for (var j=0; j < req.body.servers.length; j++){
                                var sql = "insert into cronjob_server_mapping (cronjob_id,server_id,project_id) values ";
                                sql += "('"+results.insertId+ "','" + req.body.servers[j] + "','" + req.body.projectId +"')";
                                if(req.body.servers.length==1){
                                    createCronForServer(req.body.servers[j],cronToAdd,req,res);
                                } 
                                con.query(sql,'0', function(err, result){
                                });
                        }
                        if(req.body.servers.length > 1) {
                                    res.json({success : 1, err_desc : err});
                        }
                }
            }); 
        }
    });
});

    app.post("/editProjectCron", function (req, res) {
        if (con == null)
        con = db.openCon(con);
        var server_name = req.body.job_name.replace(/ /g, "-");
        server_name = server_name.replace('.', '');
        console.log(server_name);
        var data = {
            minute: req.body.minute,
            hour: req.body.hour,
            day_of_month: req.body.day_of_month,
            month: req.body.month,
            day_of_week: req.body.day_of_week,
            server_job_name: server_name
        };
        var cronToEdit = req.body.minute + " " + req.body.hour + " " + req.body.day_of_month + " " + req.body.month + " " + req.body.day_of_week + " " + req.body.job_command;
        con.query('select * from cron_job where job_name = "' + req.body.job_name + '" and is_deleted=0', function (err, result) {
            if (err) {
                res.json({success: 2, err_desc: err});
                return;
            } else if (result.length > 0) {
                con.query('update cron_job set ? where job_name = "' + req.body.job_name + '"', [data], function (error, results) {
                    if (error) {
                        res.status(400).send(error.stack);
                    } else {
                        for (var j = 0; j < req.body.servers.length; j++) {
                            if (req.body.servers.length == 1) {
                                editCronForServer(req.body.servers[j],req.body.oldCronDetails, cronToEdit, req, res);
                            } 
                        }
                        if(req.body.servers.length > 1) {
                                    res.json({success : 1, err_desc : err});
                        }
                    }
                });
            }
        });
    });

app.post("/getCompanyCron", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var sql = "select distinct c.*,cd.companyName from cron_job c inner join cronjob_server_mapping csm on (c.id=csm.cronjob_id and csm.is_deleted=0) inner join servers s on (s.id = csm.server_id) inner join projectdetails p on (s.project_id=p.id) inner join companydetails cd on (cd.id=p.company_id) where cd.id = "+req.body.id;
    con.query(sql, function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/checkServerStatus", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var record = {
	serverIp: req.body.server_ip,
	activityName: "checkServerStatus",
	requiredData: JSON.stringify({
		rawCommand: 'date'
	}),
	status: "0"
    };
    var current_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    con.query("insert into agentActivities set ?", [record], function(err, result){
		if(err)console.log(err.stack);
		if(result){
                    var data = {
                            server_id: req.body.server_id,
                            server_ip: req.body.server_ip,
                            agentactivity_id: result.insertId,
                            last_time :current_time
                      };
                    con.query("insert into server_alive_details set ?", [data], function(error, results){
                        if ( error ){
                            res.status(400).send(error.stack);
                        } else {
                            var startTime = new Date().getTime();
                            var myVar = setInterval(function(){ 
                                con.query('SELECT response from agentActivities where id = '+result.insertId, function(error, results){
                                if(error){
                                    res.json({success : 0, err_desc : err});
                                    return;
                                }else{
                                    if(new Date().getTime() - startTime > 20000){
                                        clearInterval(myVar);
                                        if(results[0].response != null){
                                            res.json({success : 1, err_desc : null, response: 'Alive', creator: req.session.uid,time : current_time}); 
                                        }else{
                                           con.query("Update agentActivities set status = 1 , response = 'stop' WHERE id = ? ", [result.insertId], function(err, result1){
                                               res.json({success : 1, err_desc : null,response: 'Stop',time : current_time}); 
                                           }); 
                                        }
                                        return;
                                    }
                                    if(results[0].response != null){
                                        clearInterval(myVar);
                                        res.json({success : 1, err_desc : null, response: 'Alive', creator: req.session.uid,time : current_time}); 
                                    }
                                }
                            });    
                            }, 1000);
                        }
                    });
                }	
  });
});

app.post("/getServerStatus", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var sql = "select a.*,sad.last_time from agentActivities a inner join servers s on (a.serverIp=s.serverIP) inner join server_alive_details sad on (sad.agentactivity_id=a.id) where s.id="+req.body.server_id+" and a.activityName='checkServerStatus' order by a.id desc limit 1 ";
    con.query(sql, function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/syncInstanceList", function(req, res){
    if(con == null)
    con = db.openCon(con);
    var sql = "select * from customers where id ="+req.body.id;
    con.query(sql, function(error, result){
        if(error){
            console.log(error);
            logger.error('Error in SQL 1');
            logger.error(error);
        }else{
            console.log(result);
            var AWS = require('aws-sdk');
            var myConfig = new AWS.Config();
            var sts = new AWS.STS({apiVersion: '2011-06-15'});
            var params = {
              DurationSeconds: 3600,
              ExternalId: result[0].external_id,
              RoleArn: result[0].arn,
              RoleSessionName: "InfraGuard"
             };
            sts.assumeRole(params, function(err, data){
              if(err){ 
                 logger.error('error in assumeRole');
                 logger.error(err);
                 console.log(err, err.stack);
              }else{
                 creds = new AWS.Credentials({
                    accessKeyId: data.Credentials.AccessKeyId, 
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
                 });
                 var m =0;
                 for(m=0; m<req.body.regionArray.length;m++){
                     myConfig.update({
                            accessKeyId : data.Credentials.AccessKeyId,
                            secretAccessKey : data.Credentials.SecretAccessKey,
                            sessionToken : data.Credentials.SessionToken,
                            region : req.body.regionArray[m]
                      });
                     syncInstanceList(req,creds,result[0].customer_name,req.body.regionArray[m],res);
                 }
                 //if(m==req.body.regionArray.length){
                   // res.json({success : 1}); 
                 //}
             }
            });
        }
    });
});

app.post("/getInstanceList", function(req, res){
     if(con == null)
     con = db.openCon(con);
     var sql = "select s.*,c.customer_name from servers s inner join customers c on (s.customerIAMId=c.id)  where customerIAMId = "+req.body.id+" order by serverName ASC";
     con.query(sql, function(error, result){
        if (error){
            res.status(400).send(error.stack);
        }else{
            res.status(200).send(result);
        }
    });
});

app.post("/syncInstanceListDetails", function(req, res){
     if(con == null)
     con = db.openCon(con);
     var sql = "select distinct s.*,cc.customer_name,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status ,(select s.raw_data from ssm_alive_history s where id=max(ssm.id)) as instance_raw_data from servers s left join projectdetails p on (s.project_id=p.id and p.is_deleted=0) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where s.customerIAMId= "+req.body.id+" group by s.id order by s.serverName ASC,ssm.id desc"
     //var sql = "select s.*,p.projectName,c.companyName,c.id as company_id from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) where s.customerIAMId= "+req.body.id+" order by s.serverName ASC";
     con.query(sql, function(error, result){
        if (error){
            res.status(400).send(error.stack);
        }else{
            //logger.error(result);
            res.status(200).send(result);        
        }
    });
});

app.post("/searchServer", function(req, res){
     if(con == null)
     con = db.openCon(con);
     console.log(req.session.project_id_string);
     var sql = "select distinct s.*,cc.customer_name,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where p.id in ("+req.session.project_id_string+")  and  (s.serverName like '%"+req.body.search_keyword+"%' or s.instanceId like '%"+req.body.search_keyword+"%')  group by s.id order by s.serverName ASC,ssm.id desc"
     //var sql = "select s.*,p.projectName,c.companyName,c.id as company_id from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) where s.customerIAMId= "+req.body.id+" order by s.serverName ASC";
     con.query(sql, function(error, result){
        if (error){
            res.status(400).send(error.stack);
        }else{
            logger.error(result);
            res.status(200).send(result);        
        }
    });
});

app.post("/assignProject", function(req, res){
    if(con == null)
       con = db.openCon(con);
    if(req.body.project_id == ''){
       req.body.project_id = "NULL"; 
    }
    var sql = "update servers s set s.project_id="+req.body.project_id+" where s.id in ("+req.body.server_id+")";
    console.log(sql);
    con.query(sql, function(error, result){
        if (error){
            res.json({success : 0, err_desc : error});
        }else{
            var sql = "select s.*,p.projectName,c.companyName from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) where s.customerIAMId= "+req.body.customer_id;
            con.query(sql, function(error, results){
               if (error){
                   res.status(400).send(error.stack);
               }else{
                   res.json({success : 1, response : results});
               }
           });
        }
    });
 
});

app.post("/CheckSSMStatusBycustomer", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,GROUP_CONCAT(s.instanceId,'##',s.id) as instanceList ,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where cs.id="+req.body.customer_id+" group by s.region", function(err, result){
        if(result.length > 0){
            var params = {
                DurationSeconds: 3600,
                ExternalId: result[0].external_id,
                RoleArn: result[0].arn,
                RoleSessionName: "InfraGuard"
            };
            var creds ;
            sts.assumeRole(params, function(err, data){
              if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err.message);
              }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
	            secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
		});
                var length = result.length;4
                for(var i=0 ;i < result.length;i++){
                  if(i < result.length-1){
                      CheckSSMStatusBycustomer(result[i],creds,req,res,"no");
                  }else{
                      CheckSSMStatusBycustomer(result[i],creds,req,res,"sendResponse");
                  }  
                  
                }
              }
            });
        }
     });
});

app.post("/checkSSMStatus", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.server_id], function(err, result){
        console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         sts.assumeRole(params, function(err, data){
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err.message);
                addPingStatus(req,res,err,'error');
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
	            secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
		});
                checkPingStatus(result[0],creds,req,res);
            }
        });
     });
});

app.post("/checkSSMStatus1", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.server_id], function(err, result){
        console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err.message);
                addSSMAliveHistory(req, res,err.message,'Stop');
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
	            secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
		});
                checkSSMStatus(result[0],document,creds,req,res);
            }
            
        });
     });
});
app.post("/serverDetails", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.server_id], function(err, result){
        console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         sts.assumeRole(params, function(err, data){
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                updateHomeDirectory(res,req.body.server_id,'N/A',result[0].platform);
            }else{
                creds = new AWS.Credentials({
		    accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
               serverDetailsSendCommand(req,res,result[0],creds); 
            }
         });
    });
});
app.post("/serverDetails1", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(req.body.pid !=undefined){
        var killProcess = 'kill '+req.body.pid;
    }else{
        var killProcess = '';
    }
    console.log(killProcess);
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.server_id], function(err, result){
        console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         var document;
         var paramsCommand;
         var platform;
         if(result[0].platform=='Windows'){
             platform ='W';
             document ='AWS-RunPowerShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage",'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"',"fsutil volume diskfree c:","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
                };
         }else{
             platform ='L';
             document ='AWS-RunShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":[''+killProcess+'',"pwd","df -h | awk '$NF==\"/\"'","grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage \"%\"}'","free -m|awk 'NR==2'","cat /etc/os-release | head -2 | xargs -n2 -d'\n'","free -m|awk 'NR==3'","ps aux | sort -nrk 4 | head -15","ps aux | sort -nrk 3 | head -15"]
                  }
                };
         }
         console.log(paramsCommand);
         if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            console.log(err, err.stack);
                            updateHomeDirectory(res,req.body.server_id,'N/A',platform);
                            logger.error('Error in Send command');
                            logger.error(err);
                        }else{
                            sleep(1000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    updateHomeDirectory(res,req.body.server_id,'N/A',platform);
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                }else{
                                    var command = killProcess+" Name of Process : "+req.body.pname;
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                      sleep(4000, function() {});
                                      ssm.getCommandInvocation(params1, function(err, data1){
                                        if(err){
                                             res.json({success : 0, err_desc : err});
                                        }else{
                                            if(data1.StandardOutputContent==""){
                                                command_output = "N/A";
                                            }
                                            if(killProcess != ""){
                                                addServerTrail("-1",req.body.server_id,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);
                                            }
                                        }
                                      });
                                    }else{
                                        if(data1.StandardOutputContent==""){
                                            command_output = "N/A";
                                        }
                                        if(killProcess != ""){
                                            addServerTrail("-1",req.body.server_id,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);
                                        }
                                    }
                                    updateHomeDirectory(res,req.body.server_id,command_output,platform);
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                updateHomeDirectory(res,req.body.server_id,'N/A',platform);
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            logger.error('Error in send command');
                            logger.error(err);
                            console.log(err, err.stack);
                            updateHomeDirectory(res,req.body.server_id,'N/A',platform);
                        }else{
                            if(platform=="W"){
                               sleep(6000, function() {}); 
                            }else{
                               sleep(1000, function() {});  
                            }
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                    updateHomeDirectory(res,req.body.server_id,'N/A',platform);
                                }else{
                                    console.log(data1);
                                    var command = killProcess+" Name of Process : "+req.body.pname;
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                      sleep(5000, function() {});
                                      ssm.getCommandInvocation(params1, function(err, data1){
                                        if(err){
                                             res.json({success : 0, err_desc : err});
                                        }else{
                                            console.log(data1);
                                            var command_output = data1.StandardOutputContent;
                                            if(data1.StandardOutputContent==""){
                                                command_output = "N/A";
                                            }
                                            updateHomeDirectory(res,req.body.server_id,command_output,platform);
                                            addServerTrail("-1",req.body.server_id,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);
                                        }
                                      });
                                    }else{
                                        if(data1.StandardOutputContent==""){
                                            command_output = "N/A";
                                        }
                                        updateHomeDirectory(res,req.body.server_id,command_output,platform);
                                        if(killProcess != ""){
                                            addServerTrail("-1",req.body.server_id,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);
                                        }
                                    }
                                    
                                }      
                              });
                          }       
                      });
            }
         });
     }
    });
});

app.post("/getSSMStatus", function(req, res) {
if(con == null)
    con = db.openCon(con);
    var sql = "select * from ssm_alive_history s where s.server_id = "+req.body.server_id+" order by s.id desc limit 1";
    con.query(sql, function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/assignProjectServer", function(req, res){
if(con == null)
    con = db.openCon(con);
    var sql_select ="select am.project_id, GROUP_CONCAT(am.server_id) as server_id from automation_scripts a inner join automation_mapping am on (a.id=am.script_id and am.is_deleted=0) where a.id="+req.body.script_id+" group by am.project_id";
    con.query(sql_select,0, function(err, result){
         var project_arr = [];
         var project_arr_duplicate = [];
         var server_arr = [];
         var intersect_array = [];
         if(result.length > 0){
              for(var i = 0, l = result.length; i < l; i++){
                  project_arr[i]=result[i].project_id;
                  project_arr_duplicate[i]=result[i].project_id;
                  server_arr[result[i].project_id]=result[i].server_id;
              }
         }
         intersect_array =req.body.project_array;
         intersect_array= intersect(intersect_array,project_arr);
         for( var a =project_arr_duplicate.length - 1; a>=0; a--){
                    for( var b=0; b<req.body.project_array.length; b++){
                      if(project_arr_duplicate[a] === req.body.project_array[b]){
                         project_arr_duplicate.splice(a, 1);
                      }
                    }
         }
         for(var i =req.body.project_array.length - 1; i>=0; i--){
              for(var j=0; j<project_arr.length; j++){
                    if(req.body.project_array[i] === project_arr[j]){
                        req.body.project_array.splice(i, 1);
                    }
              }
         }
       for(var c=0;c<project_arr_duplicate.length;c++){
                con.query("update automation_mapping set is_deleted=1 where project_id= ? and script_id = ?",[project_arr_duplicate[c],req.body.script_id], function(err, result){
                });
       }
       var sql = "insert into automation_mapping (script_id,project_id,server_id) values ";
       for(var i=0;i<req.body.project_array.length;i++){
          for(var j=0 ; j < req.body.project_server[req.body.project_array[i]].length;j++){
              sql += "('"+req.body.script_id+ "','" + req.body.project_array[i] + "','" + req.body.project_server[req.body.project_array[i]][j] + "'),";
          }
       }
       sql = sql.substr(0,sql.length-1);
       con.query(sql,'0', function(err, result){
          //res.json({success : 1, err_desc : null, creator: req.session.uid});
       });
       var projectid ="";
       for(var i=0;i<intersect_array.length;i++){
           projectid = intersect_array[i];
           var fetch_array = JSON.parse("[" + server_arr[intersect_array[i]] + "]");
           var given_array = req.body.project_server[intersect_array[i]];
           var instersect= intersect(fetch_array,given_array);
            console.log(instersect);
            for( var k=fetch_array.length - 1; k>=0; k--){
                    for( var j=0; j<instersect.length; j++){
                        if(fetch_array[k] === instersect[j]){
                            fetch_array.splice(k, 1);
                    }
                }
            }
            for( var k=given_array.length - 1; k>=0; k--){
                    for( var j=0; j<instersect.length; j++){
                        if(given_array[k] === instersect[j]){
                            given_array.splice(k, 1);
                    }
                }
            }
            if(fetch_array.length > 0){
               for(var m=0;m<fetch_array.length;m++){
                   if(fetch_array[m] != null){
                        var update_record = "update automation_mapping set is_deleted =1 where script_id = "+req.body.script_id+" and project_id="+projectid+" and server_id="+fetch_array[m]+" and is_deleted=0";
                        con.query(update_record,'0', function(err, result){
                        }); 
                   }
                } 
            }
            if(given_array.length > 0){
               for(var n=0;n<given_array.length;n++){
                   if(given_array[n] != null){
                      var sql = "insert into automation_mapping (script_id,project_id,server_id) values ";
                      sql += "('"+req.body.script_id+ "','" + projectid + "','" + given_array[n] + "')";
                      console.log(sql);
                      con.query(sql,'0', function(err, result){
                     }); 
                   }
                } 
            }
       }
    });
    res.json({success : 1, err_desc : null,  creator: req.session.uid});
});
app.post("/getScriptData", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select am.* from automation_scripts a inner join automation_mapping am on (a.id=am.script_id and am.is_deleted=0) where a.id ="+req.body.script_id+" order by project_id";
     con.query(sql,'0', function(err, result){
          if(err){
            res.status(400).send(error.stack);
          }else{
            res.status(200).send(result);
          }
     });
});

app.post("/getServerTrail", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select ssh.*,u.email,a.script_name,a.script from script_ssm_history ssh inner join users u on (ssh.user_id=u.id and u.is_deleted=0) left join automation_scripts a on(ssh.script_id=a.id) where ssh.server_id="+req.body.server_id+" and ssh.script_run_time > '2018-02-19 00:00:00' and ssh.command !=' Name of Process : undefined' order by ssh.id desc";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});

app.post("/getProjectTrail", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select ssh.*,u.email,a.script_name,a.script from script_ssm_history ssh inner join users u on (ssh.user_id=u.id and u.is_deleted=0) left join automation_scripts a on(ssh.script_id=a.id) where ssh.project_id="+req.body.project_id+" and ssh.script_run_time > '2018-02-19 00:00:00' and ssh.command !=' Name of Process : undefined' order by ssh.id desc";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});
app.post("/getUserTrail", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select ssh.*,u.email,u.uname,a.script_name,a.script,s.serverName from script_ssm_history ssh inner join users u on (ssh.user_id=u.id) inner join servers s on (ssh.server_id=s.id) left join automation_scripts a on(ssh.script_id=a.id) where ssh.user_id="+req.body.user_id+" and ssh.script_run_time > '2018-02-19 00:00:00' order by ssh.id desc";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});
    app.post("/getServerUsersTrail", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        if (req.body.server_user_id != "") {
            var sql = "select ssh.*,u.email,a.script_name,a.script,su.username from script_ssm_history ssh inner join users u on (ssh.user_id=u.id and u.is_deleted=0) left join automation_scripts a on(ssh.script_id=a.id) inner join server_users su on(ssh.server_users_id = su.id) where ssh.server_users_id in (" + req.body.server_user_id + ") and ssh.script_run_time > '2018-02-19 00:00:00' and ssh.command !=' Name of Process : undefined' order by ssh.id desc";
            con.query(sql, '0', function (err, result) {
                if (err) {
                    res.status(400).send(err.stack);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            res.status(200).send();
        }
    });

app.post("/getGroupingTags", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select * from grouping_tags where is_deleted=0";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});


app.post("/setServerTag", function(req, res){
    if(con == null)
    con = db.openCon(con);
    var sql = "update servers s set s.tag_id="+req.body.tag_id+ " where s.id="+req.body.server_id;
    console.log(sql);
    con.query(sql, function(err, result){
         if (err){
            res.json({success : 0,  creator: req.session.uid});
          }else{
            res.json({success : 1, creator: req.session.uid});
         }
     });
});

app.post("/patchManagement", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var serverId = data.serverId;
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.userList from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };

         if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region
                });
              var params1 = {
                InstanceId: result[0].instanceId,
                "Filters": [ 
                    { 
                       "Key": "State",
                       "Values": [ "Missing" ]
                    }
                 ],
              };
              ssm.describeInstancePatches(params1, function(err, data){
                if (err){
                    console.log(err, err.stack);
                    res.json({success : 0, output : err});  
                    logger.error('Error in describe Instance Patches');
                    logger.error(err);
                }else{
                    res.json({success : 1, output : data}); 
                    console.log(data);   
                }
              });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0, output : err});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                var params1 = {
                InstanceId: result[0].instanceId,
                "Filters": [ 
                    { 
                       "Key": "State",
                       "Values": [ "Missing" ]
                    }
                 ],
              };
               ssm.describeInstancePatches(params1, function(err, data){
                if(err){
                    console.log(err, err.stack);
                    logger.error('Error in describe Instance Patches');
                    logger.error(err);
                    res.json({success : 0, output : err});  
                }else{
                    res.json({success : 1, output : data}); 
                    console.log(data);   
                }
              });
            }
         });
     }
    }); 
});

app.post("/startInstances", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var serverId = data.serverId;
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.userList from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };

         if(result[0].customer_name =='Right Cloud'){
              var ec2 = new AWS.EC2({
                    apiVersion: '2016-11-15',
		    region : result[0].region
              });
              var params1 = {
                InstanceIds: [ result[0].instanceId]
              };
              ec2.startInstances(params1, function(err, data){
                if (err){
                    console.log(err, err.stack);
                    res.json({success : 0, output : err,flag:1});  
                    logger.error('Error in start Instance');
                    logger.error(err);
                }else{
                    var sql = "update servers s set s.instance_flag=0 where s.id="+serverId;
                    con.query(sql, function(error, results){
                        res.json({success : 1, output : data,flag:0}); 
                        console.log(data);   
                    });
                }
              });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0, output : err,flag:1});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ec2 = new AWS.EC2({
                                apiVersion: '2016-11-15',
                                region : result[0].region,
                                credentials : creds
                });
                var params1 = {
                    InstanceIds: [ result[0].instanceId]
                };
               ec2.startInstances(params1, function(err, data){
                if(err){
                    console.log(err, err.stack);
                    logger.error('Error in start Instance');
                    logger.error(err);
                    res.json({success : 0, output : err,flag:1});  
                }else{
                    var sql = "update servers s set s.instance_flag=0 where s.id="+serverId;
                    con.query(sql, function(error, results){
                        res.json({success : 1, output : data,flag:0}); 
                        console.log(data);   
                    });
                }
              });
            }
         });
     }
    }); 
});

app.post("/stopInstances", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var serverId = data.serverId;
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.userList from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };

         if(result[0].customer_name =='Right Cloud'){
              var ec2 = new AWS.EC2({
                    apiVersion: '2016-11-15',
		    region : result[0].region
              });
              var params1 = {
                InstanceIds: [ result[0].instanceId]
              };
              ec2.stopInstances(params1, function(err, data){
                if (err){
                    console.log(err, err.stack);
                    res.json({success : 0, output : err,flag:0});  
                    logger.error('Error in stop Instance');
                    logger.error(err);
                }else{
                    var sql = "update servers s set s.instance_flag=1 where s.id="+serverId;
                    con.query(sql, function(error, results){
                        res.json({success : 1, output : data,flag:1}); 
                        console.log(data);   
                    });
                }
              });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0, output : err,flag:0});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ec2 = new AWS.EC2({
                                apiVersion: '2016-11-15',
                                region : result[0].region,
                                credentials : creds
                });
                var params1 = {
                    InstanceIds: [ result[0].instanceId]
                };
               ec2.stopInstances(params1, function(err, data){
                if(err){
                    console.log(err, err.stack);
                    logger.error('Error in stop Instance');
                    logger.error(err);
                    res.json({success : 0, output : err,flag:0});  
                }else{
                    var sql = "update servers s set s.instance_flag=1 where s.id="+serverId;
                    con.query(sql, function(error, results){
                        res.json({success : 1, output : data,flag:1}); 
                        console.log(data);   
                    });
                }
              });
            }
         });
     }
    }); 
});

app.post("/stopInstancesForProject", function(req, res){
   if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.userList,s.id as serverId from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id in ("+req.body.serverIds+")", function(err, result){
        if(result.length > 0 ){
         var k=0;
         for(var i=0;i<result.length;i++){
             assumeRoleForStartInstances(req,res,result[i],"stop");
             k++;
             if(k==result.length){
                  res.json({success : 1});             
             }
         }
       }else{
           res.json({success : 0}); 
       }
    });
  });

app.post("/startInstancesForProject", function(req, res){
   if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.userList,s.id as serverId from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id in ("+req.body.serverIds+")", function(err, result){
        if(result.length > 0 ){
         var k=0;
         for(var i=0;i<result.length;i++){
             assumeRoleForStartInstances(req,res,result[i],"start");
             k++;
             if(k==result.length){
                  res.json({success : 1});             
             }
         }
       }else{
           res.json({success : 0}); 
       }
    });
  });

app.post("/getServerUserList", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select su.* from server_users su inner join servers s on(s.project_id =" + req.body.projectId + ")where su.is_deleted=0 and su.server_id in (" + req.body.server_id + ") group by su.id";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});
app.post("/getEachServerUserList", function(req, res){
if(con == null)
    con = db.openCon(con);
     var sql = "select * from server_users where is_deleted=0 and server_id in (" + req.body.server_id + ")";
     con.query(sql,'0', function(err, result){
          if (err){
            res.status(400).send(err.stack);
          }else{
            res.status(200).send(result);
         }
     });
});
app.post("/refreshUserList", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.serverIP from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.serverId], function(err, result){
         var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         //var sleep = require('system-sleep');
         if(result[0].customer_name =='Right Cloud'){
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : result[0].region
                });
                  var params = {
                        DocumentName: document,
                        InstanceIds: [
                          result[0].instanceId
                        ],
                        Parameters: 
                            {
                                "commands":["cat /etc/passwd | grep '/home' | cut -d: -f1"]
                            }
                      };
                      ssm.sendCommand(params, function(err, data){
                        if (err) console.log(err, err.stack);
                        else{
                            sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0, err_desc : err});
                                }else{
                                   var userarray = data1.StandardOutputContent.split("\n");
                                   updateServerUsers(userarray,req.body.serverId,result[0].serverIP,res);
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                  var params = {
                        DocumentName: document,
                        InstanceIds: [
                          result[0].instanceId
                        ],
                        Parameters: 
                            {
                                "commands":["cat /etc/passwd | grep '/home' | cut -d: -f1"]
                            }
                      };
                      ssm.sendCommand(params, function(err, data){
                        if (err) console.log(err, err.stack);
                        else{
                            sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0, err_desc : err});
                                }else{
                                    var userarray = data1.StandardOutputContent.split("\n");
                                    updateServerUsers(userarray,req.body.serverId,result[0].serverIP,res);
                                }      
                              });
                          }       
                      });
            }
         });
      }
    });
});

app.post("/serverKeyRotate", function(req, res){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   if(con == null)
    con = db.openCon(con);
    var data = req.body;
    var record = {};
    var pair = keypair();
    var privateKey = pair.private; 
    var pubKey = forge.pki.publicKeyFromPem(pair.public);
    var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, req.body.uname+'@InfraGuard');
    var command_3 = 'su - -c "echo '+sshpubKey+'> .ssh/authorized_keys" '+req.body.uname;
    var command_4 = 'su - -c "chmod 600 .ssh/authorized_keys" '+req.body.uname;
    var command_5 = 'id -u '+req.body.uname;
    var command = command_3+"\n"+command_4+"\n"+command_5;
    var username = req.body.uname;
    var email = req.body.uemail;
    var sendEmailStatus = req.body.sendEmailStatus;
    var serverId = data.serverId;
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,u.email,s.serverIP from customers cs inner join servers s on(cs.id=s.customerIAMId) inner join users u on(u.id=cs.user_id) where s.id = ?", [data.serverId], function(err, result){
    console.log(result[0]);
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
         var creds ;
         var document;
         var paramsCommand;
         var platform;
         if(result[0].platform=='Windows'){
             platform ='W';
             document ='AWS-RunPowerShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
                };
         }else{
             platform ='L';
             document ='AWS-RunShellScript';
             paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result[0].instanceId
                  ],
                  Parameters: {
                     "commands":[command_3,command_4,command_5]
                  }
                };
         }
         console.log(paramsCommand);
         if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            console.log(err, err.stack);
                            logger.error('Error in Send command');
                            logger.error(err);
                            res.json({success : 0});
                        }else{
                            sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                    res.json({success : 0});
                                }else{
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                        res.json({success : 0});
                                    }else{
                                        rotateKeyEmail(result[0].email,privateKey,result[0].serverIP,username,email,sendEmailStatus);
                                        addServerUsersTrail("-6",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",req.body.serveruserId);
                                        var update = "update server_users set private_key = '"+privateKey+"' where id="+req.body.serveruserId;
                                        console.log(update);
                                         con.query(update, function(err, result){
                                            if(err){
                                                res.json({success : 0});
                                            }else{
                                                res.json({success : 1});
                                            }
                                         });
                                    }
                                }      
                              });
                          }       
                      });
         }else{
         sts.assumeRole(params, function(err, data) {
            if(err){
                logger.error('Error in assume role');
                logger.error(err);
                console.log(err, err.stack);
                res.json({success : 0});
            }else{
                creds = new AWS.Credentials({
					  accessKeyId: data.Credentials.AccessKeyId, 
					  secretAccessKey: data.Credentials.SecretAccessKey,
					  sessionToken: data.Credentials.SessionToken
		});
                var ssm = new AWS.SSM({
                                apiVersion: '2014-11-06',
                                region : result[0].region,
                                credentials : creds
                });
                      ssm.sendCommand(paramsCommand, function(err, data){
                        if(err){
                            res.json({success : 0});
                            logger.error('Error in send command');
                            logger.error(err);
                            console.log(err, err.stack);
                        }else{
                            sleep(5000, function() {});
                            var params1 = {
                                CommandId: data.Command.CommandId,
                                InstanceId: result[0].instanceId
                              };
                              ssm.getCommandInvocation(params1, function(err, data1){
                                if(err){
                                    res.json({success : 0});
                                    logger.error('Error in get command result');
                                    logger.error(err);
                                }else{
                                    var command_output = data1.StandardOutputContent;
                                    if(data1.StandardOutputContent==""){
                                        res.json({success : 0});
                                    }else{
                                       rotateKeyEmail(result[0].email,privateKey,result[0].serverIP,username,email,sendEmailStatus);
                                       addServerUsersTrail("-6",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid,"0",req.body.serveruserId);
                                       var update = "update server_users set private_key = '"+privateKey+"' where id="+req.body.serveruserId;
                                       console.log(update);
                                         con.query(update, function(err, result){
                                            if(err){
                                                res.json({success : 0});
                                            }else{
                                                res.json({success : 1});
                                            }
                                         }); 
                                    }
                                }      
                              });
                          }       
                      });
            }
         });
     }
    }); 
});

app.post("/createTag", function(req, res){
    if(con == null)
    con = db.openCon(con);
    var data = {
        tag_name : req.body.tagName,
        tag_desc:req.body.tagDesc,
        tag_creator : req.session.uid
    };
    con.query("select * from grouping_tags where tag_name = ?  and is_deleted = 0", [req.body.tagName], function(err, result){
	if(err){
            res.json({success : 2, err_desc : err});
	     return;
	}else if(result.length > 0){
		res.json({success : 2, err_desc : "Tag name Already Exists!"});
		return;
	}else{
            con.query("insert into grouping_tags set ?", [data], function(err, result){
                if(err){
                    res.json({success : 0, err_desc : err});
                    return;
                }
                res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
            });
        }
    });
});

app.post("/getTags", function(req, res) {
    if(con == null)
    con = db.openCon(con);
    con.query('select * from grouping_tags where is_deleted = 0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/editTag", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("update grouping_tags set tag_name = ? ,tag_desc = ?  where id = ?", [req.body.tagName,req.body.tagDesc,req.body.tagId], function(err, result){
        if(err){
            res.json({success : 0, err_desc : err});
            return;
        }
        res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
    });
});
app.post("/deleteTag", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update grouping_tags set is_deleted = ? where id = ?", [1,req.body.tagId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, creator: req.session.uid});
	});
});
app.post("/createSchedulerTask", function(req, res){
    if(con == null)
    con = db.openCon(con);
    var startInstance = {
        project_id : req.body.projectId,
        task : "start",
        day : req.body.startDay,
        time : req.body.startTime,
        task_creator:req.session.uid
    };
    var stopInstance = {
        project_id : req.body.projectId,
        task : "stop",
        day : req.body.stopDay,
        time : req.body.stopTime,
        task_creator:req.session.uid
    };
    con.query("insert into scheduled_task set ?", [startInstance], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}else{
           con.query("insert into scheduled_task set ?", [stopInstance], function(err, result){
               if(err){
		res.json({success : 0, err_desc : err});
		return;
              }else{
                 res.json({success : 1,creator: req.session.uid});  
              }
           });
        }
    });
});

app.post("/editSchedulerTask", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("update scheduled_task set day = '"+req.body.startDay+"', time = '"+req.body.startTime+"' where id ="+req.body.sc1, function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}else{
           con.query("update scheduled_task set day = '"+req.body.stopDay+"', time = '"+req.body.stopTime+"' where id ="+req.body.sc2, function(err, result){
               if(err){
		res.json({success : 0, err_desc : err});
		return;
              }else{
                 res.json({success : 1,creator: req.session.uid});  
              }
           });
        }
    });
});
app.post("/deleteScheduleTask", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("update scheduled_task set is_deleted = 1 where id in ("+req.body.sc1+","+req.body.sc2+")", function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}else{
            res.json({success : 1,creator: req.session.uid});  
        }
    });
});

app.post("/createPatchMW", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
     if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform,s.serverName from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id ="+req.body.serverId, function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
         };
        sts.assumeRole(params, function(err, data) {
            if(err){ 
             if(err.code="CredentialsError"){
                res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
             } 
            }else{
             creds = new AWS.Credentials({
               accessKeyId: data.Credentials.AccessKeyId, 
               secretAccessKey: data.Credentials.SecretAccessKey,
               sessionToken: data.Credentials.SessionToken
             });
             createMaintenanceWindow(req,res,creds,result[0]);
            }
        });
    });
});


app.post("/deletePatchMW", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id ="+req.body.serverId, function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
      };
      sts.assumeRole(params, function(err, data) {
        if(err){ 
           if(err.code="CredentialsError"){
              res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
           } 
        }else{
           creds = new AWS.Credentials({
             accessKeyId: data.Credentials.AccessKeyId, 
             secretAccessKey: data.Credentials.SecretAccessKey,
             sessionToken: data.Credentials.SessionToken
          });
          if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                apiVersion: '2014-11-06',
                region : result[0].region
            });
          }else{
               var ssm = new AWS.SSM({
                  apiVersion: '2014-11-06',
                  region : result[0].region,
                  credentials : creds
              }); 
          }
          var params = {
            WindowId: req.body.windowId
         };
         ssm.deleteMaintenanceWindow(params, function(err, data) {
            if(err){
               console.log(err, err.stack);
               res.json({success : 0, err_desc : err});
            }else{
               con.query("update patching_log set is_deleted =1 where id =  ?", [req.body.patchId], function(err, result){
                if(err){
                   res.json({success : 0, err_desc : err});
                   return;
                }else{
                   res.json({success : 1, err_desc : err});
                }
               });
            }
         });
     }
  });
});
});
app.post("/patchExecutionDetails", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id ="+req.body.serverId, function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
      };
      sts.assumeRole(params, function(err, data) {
        if(err){ 
           if(err.code="CredentialsError"){
              res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
           } 
        }else{
           creds = new AWS.Credentials({
             accessKeyId: data.Credentials.AccessKeyId, 
             secretAccessKey: data.Credentials.SecretAccessKey,
             sessionToken: data.Credentials.SessionToken
          });
          if(result[0].customer_name =='Right Cloud'){
              var ssm = new AWS.SSM({
                apiVersion: '2014-11-06',
                region : result[0].region
            });
          }else{
               var ssm = new AWS.SSM({
                  apiVersion: '2014-11-06',
                  region : result[0].region,
                  credentials : creds
              }); 
          }
         var params = {
            WindowId: req.body.windowId
          };
         ssm.describeMaintenanceWindowExecutions(params, function(err, data) {
            if(err){
               console.log(err, err.stack);
               res.json({success : 0, err_desc : err});
            }else{
               res.json({success : 1, output : data});
            }
         });
       }
         });
  });
});

app.post("/createScheduler", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var instanceIdString = "";
    if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.project_id ="+req.body.projectId, function(err, result){
        if(result.length > 0){
            for (var i = 0, l = result.length; i < l; i++)
               instanceIdString += result[i].instanceId + ",";
               instanceIdString = instanceIdString.substr(0,instanceIdString.length-1);
        } 
     var instanceIdsArray = instanceIdString.split(",");
     var params = {
        DurationSeconds: 3600,
        ExternalId: result[0].external_id,
        RoleArn: result[0].arn,
        RoleSessionName: "InfraGuard"
     };
     console.log(result[0]);
     var creds ;
     if(result[0].customer_name =='Right Cloud'){
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region
         });
                 var params = {
            AllowUnassociatedTargets: true, 
            Cutoff: 0, 
            Duration: 1, 
            Name: "InfraGuard"+new Date().getTime(),
            Schedule: req.body.startCron
        };
         console.log(params);
        ssm.createMaintenanceWindow(params, function(err, data){
            if(err){
                console.log(err, err.stack); // an error occurred
                res.json({success : 0, err_desc : err});
            }else{
                console.log(data.WindowId);  
                var WindowId = data.WindowId;
                var params = {
                    ResourceType: "INSTANCE", 
                    Targets: [ 
                      {
                        Key: 'InstanceIds',
                        Values: instanceIdsArray
                      }
                    ],
                    WindowId: data.WindowId,
                    Description: "InfraGuard"+new Date().getTime(),
                    Name: "InfraGuard"+new Date().getTime()
              };
              console.log(params);
                ssm.registerTargetWithMaintenanceWindow(params, function(err, data) {
                  if(err){ 
                      console.log(err, err.stack);
                      res.json({success : 0, err_desc : err});
                  }else{
                      console.log(data); 
                      var targetId = data.WindowTargetId;
                      var params = {
                            MaxConcurrency: '1',
                            MaxErrors: '1',
                            ServiceRoleArn: result[0].arn,
                            Targets: [ 
                                {
                                  Key: 'InstanceIds',
                                  Values: instanceIdsArray
                                }
                              ],
                            TaskArn: 'AWS-StartEC2Instance',
                            TaskType: 'AUTOMATION' ,
                            WindowId: WindowId,
                            LoggingInfo: {
                              S3BucketName: 'cf-templates-uvrcjjtj88fw-ap-southeast-1', /* required */
                              S3Region: 'ap-southeast-1'
                            },
                            Name:"InfraGuard"+new Date().getTime(),
                            Priority: 0,
                            TaskInvocationParameters: {
                              Automation: {
                                DocumentVersion: '1',
                                Parameters: {
                                  "DocumentDescription" : [ "Start EC2 instances(s)" ]
                                }
                              }
                            }
                          };
                          console.log(params);
                          ssm.registerTaskWithMaintenanceWindow(params, function(err, data) {
                            if(err){ 
                                console.log(err, err.stack);
                                res.json({success : 0, err_desc : err});
                            }else{
                                addScedulerInfo(req.body.projectId,WindowId,data.WindowTaskId,targetId,req.body.startDay,req.body.startTime);
                                console.log(data);  
                                var params = {
                                    AllowUnassociatedTargets: true, 
                                    Cutoff: 0, 
                                    Duration: 1, 
                                    Name: "InfraGuard"+new Date().getTime(),
                                    Schedule: req.body.stopCron
                                };
                                console.log(params);
                                ssm.createMaintenanceWindow(params, function(err, data){
                                    if(err){
                                        console.log(err, err.stack); // an error occurred
                                        res.json({success : 0, err_desc : err});
                                    }else{
                                        console.log(data.WindowId);  
                                        var WindowId = data.WindowId;
                                        var params = {
                                            ResourceType: "INSTANCE", 
                                            Targets: [ 
                                              {
                                                Key: 'InstanceIds',
                                                Values: instanceIdsArray
                                              }
                                            ],
                                            WindowId: data.WindowId,
                                            Description: "InfraGuard"+new Date().getTime(),
                                            Name: "InfraGuard"+new Date().getTime()
                                      };
                                      console.log(params);
                                        ssm.registerTargetWithMaintenanceWindow(params, function(err, data) {
                                          if(err){ 
                                              console.log(err, err.stack);
                                              res.json({success : 0, err_desc : err});
                                          }else{
                                              var targetId = data.WindowTargetId;
                                              console.log(data); 
                                              var params = {
                                                    MaxConcurrency: '1',
                                                    MaxErrors: '1',
                                                    ServiceRoleArn: result[0].arn,
                                                    Targets: [ 
                                                        {
                                                          Key: 'InstanceIds',
                                                          Values: instanceIdsArray
                                                        }
                                                      ],
                                                    TaskArn: 'AWS-StopEC2Instance',
                                                    TaskType: 'AUTOMATION' ,
                                                    WindowId: WindowId,
                                                    LoggingInfo: {
                                                      S3BucketName: 'cf-templates-uvrcjjtj88fw-ap-southeast-1', /* required */
                                                      S3Region: 'ap-southeast-1'
                                                    },
                                                    Name:"InfraGuard"+new Date().getTime(),
                                                    Priority: 0,
                                                    TaskInvocationParameters: {
                                                      Automation: {
                                                        DocumentVersion: '1',
                                                        Parameters: {
                                                          "DocumentDescription" : [ "Stop EC2 instances(s)" ]
                                                        }
                                                      }
                                                    }
                                                  };
                                                  console.log(params);
                                                  ssm.registerTaskWithMaintenanceWindow(params, function(err, data) {
                                                    if(err){ 
                                                        console.log(err, err.stack);
                                                        res.json({success : 0, err_desc : err});
                                                    }else{
                                                        addScedulerInfo(req.body.projectId,WindowId,data.WindowTaskId,targetId,req.body.stopDay,req.body.stopTime);
                                                        console.log(data);  
                                                        res.json({success : 1, err_desc : err});
                                                    }
                                                  });
                                          }     
                                        });
                                    }
                                });
                            }
                          });
                  }     
                });
            }
        });
     }else{
      sts.assumeRole(params, function(err, data) {
      if(err){ 
         if(err.code="CredentialsError"){
            res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
         } 
      }else{
         creds = new AWS.Credentials({
	   accessKeyId: data.Credentials.AccessKeyId, 
   	   secretAccessKey: data.Credentials.SecretAccessKey,
  	   sessionToken: data.Credentials.SessionToken
	 });
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region,
             credentials : creds
         });
        var params = {
            AllowUnassociatedTargets: true, 
            Cutoff: 0, 
            Duration: 1, 
            Name: "InfraGuard"+new Date().getTime(),
            Schedule: req.body.startCron
        };
         console.log(params);
        ssm.createMaintenanceWindow(params, function(err, data){
            if(err){
                console.log(err, err.stack); // an error occurred
                res.json({success : 0, err_desc : err});
            }else{
                console.log(data.WindowId);  
                var WindowId = data.WindowId;
                var params = {
                    ResourceType: "INSTANCE", 
                    Targets: [ 
                      {
                        Key: 'InstanceIds',
                        Values: instanceIdsArray
                      }
                    ],
                    WindowId: data.WindowId,
                    Description: "InfraGuard"+new Date().getTime(),
                    Name: "InfraGuard"+new Date().getTime()
              };
              console.log(params);
                ssm.registerTargetWithMaintenanceWindow(params, function(err, data) {
                  if(err){ 
                      console.log(err, err.stack);
                      res.json({success : 0, err_desc : err});
                  }else{
                      console.log(data); 
                      var targetId = data.WindowTargetId;
                      var params = {
                            MaxConcurrency: '1',
                            MaxErrors: '1',
                            ServiceRoleArn: result[0].arn,
                            Targets: [ 
                                {
                                  Key: 'InstanceIds',
                                  Values: instanceIdsArray
                                }
                              ],
                            TaskArn: 'AWS-StartEC2Instance',
                            TaskType: 'AUTOMATION' ,
                            WindowId: WindowId,
                            LoggingInfo: {
                              S3BucketName: 'cf-templates-uvrcjjtj88fw-ap-southeast-1', /* required */
                              S3Region: 'ap-southeast-1'
                            },
                            Name:"InfraGuard"+new Date().getTime(),
                            Priority: 0,
                            TaskInvocationParameters: {
                              Automation: {
                                DocumentVersion: '1',
                                Parameters: {
                                  "DocumentDescription" : [ "Start EC2 instances(s)" ]
                                }
                              }
                            }
                          };
                          console.log(params);
                          ssm.registerTaskWithMaintenanceWindow(params, function(err, data) {
                            if(err){ 
                                console.log(err, err.stack);
                                res.json({success : 0, err_desc : err});
                            }else{
                                addScedulerInfo(req.body.projectId,WindowId,data.WindowTaskId,targetId,req.body.startDay,req.body.startTime);
                                console.log(data);  
                                var params = {
                                    AllowUnassociatedTargets: true, 
                                    Cutoff: 0, 
                                    Duration: 1, 
                                    Name: "InfraGuard"+new Date().getTime(),
                                    Schedule: req.body.stopCron
                                };
                                console.log(params);
                                ssm.createMaintenanceWindow(params, function(err, data){
                                    if(err){
                                        console.log(err, err.stack); // an error occurred
                                        res.json({success : 0, err_desc : err});
                                    }else{
                                        console.log(data.WindowId);  
                                        var WindowId = data.WindowId;
                                        var params = {
                                            ResourceType: "INSTANCE", 
                                            Targets: [ 
                                              {
                                                Key: 'InstanceIds',
                                                Values: instanceIdsArray
                                              }
                                            ],
                                            WindowId: data.WindowId,
                                            Description: "InfraGuard"+new Date().getTime(),
                                            Name: "InfraGuard"+new Date().getTime()
                                      };
                                      console.log(params);
                                        ssm.registerTargetWithMaintenanceWindow(params, function(err, data) {
                                          if(err){ 
                                              console.log(err, err.stack);
                                              res.json({success : 0, err_desc : err});
                                          }else{
                                              var targetId = data.WindowTargetId;
                                              console.log(data); 
                                              var params = {
                                                    MaxConcurrency: '1',
                                                    MaxErrors: '1',
                                                    ServiceRoleArn: result[0].arn,
                                                    Targets: [ 
                                                        {
                                                          Key: 'InstanceIds',
                                                          Values: instanceIdsArray
                                                        }
                                                      ],
                                                    TaskArn: 'AWS-StopEC2Instance',
                                                    TaskType: 'AUTOMATION' ,
                                                    WindowId: WindowId,
                                                    LoggingInfo: {
                                                      S3BucketName: 'cf-templates-uvrcjjtj88fw-ap-southeast-1', /* required */
                                                      S3Region: 'ap-southeast-1'
                                                    },
                                                    Name:"InfraGuard"+new Date().getTime(),
                                                    Priority: 0,
                                                    TaskInvocationParameters: {
                                                      Automation: {
                                                        DocumentVersion: '1',
                                                        Parameters: {
                                                          "DocumentDescription" : [ "Stop EC2 instances(s)" ]
                                                        }
                                                      }
                                                    }
                                                  };
                                                  console.log(params);
                                                  ssm.registerTaskWithMaintenanceWindow(params, function(err, data) {
                                                    if(err){ 
                                                        console.log(err, err.stack);
                                                        res.json({success : 0, err_desc : err});
                                                    }else{
                                                        addScedulerInfo(req.body.projectId,WindowId,data.WindowTaskId,targetId,req.body.stopDay,req.body.stopTime);
                                                        console.log(data);  
                                                        res.json({success : 1, err_desc : err});
                                                    }
                                                  });
                                          }     
                                        });
                                    }
                                });
                            }
                          });
                  }     
                });
            }
        });
      }
  });
 }
});
});

app.post("/editScheduler", function(req, res){
   var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.project_id ="+req.body.projectId, function(err, result){
        var params = {
        DurationSeconds: 3600,
        ExternalId: result[0].external_id,
        RoleArn: result[0].arn,
        RoleSessionName: "InfraGuard"
     };
     console.log(result[0]);
     var creds ;
     if(result[0].customer_name =='Right Cloud'){
          var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region
         });
         var params = {
            WindowId: req.body.mw1,
            Schedule: req.body.startCron
         };
              ssm.updateMaintenanceWindow(params, function(err, data) {
            if(err){
                console.log(err, err.stack);
                res.json({success : 0, err_desc : err});
            }else{
                 updateSchedulerInfo(req.body.projectId,req.body.mw1,req.body.startDay,req.body.startTime);
                  var params = {
                    WindowId: req.body.mw2,
                    Schedule: req.body.stopCron
                 };
                 ssm.updateMaintenanceWindow(params, function(err, data) {
                     if(err){
                         console.log(err, err.stack);
                         res.json({success : 0, err_desc : err});
                     }else{
                        updateSchedulerInfo(req.body.projectId,req.body.mw2,req.body.stopDay,req.body.stopTime);
                        res.json({success : 1, err_desc : err});
                     }
                 });
            }
        });
     }else{
     sts.assumeRole(params, function(err, data) {
      if(err){ 
         if(err.code="CredentialsError"){
            res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
         } 
      }else{
         creds = new AWS.Credentials({
	   accessKeyId: data.Credentials.AccessKeyId, 
   	   secretAccessKey: data.Credentials.SecretAccessKey,
  	   sessionToken: data.Credentials.SessionToken
	 });
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region,
             credentials : creds
         });
         var params = {
            WindowId: req.body.mw1,
            Schedule: req.body.startCron
         };
        ssm.updateMaintenanceWindow(params, function(err, data) {
            if(err){
                console.log(err, err.stack);
                res.json({success : 0, err_desc : err});
            }else{
                 updateSchedulerInfo(req.body.projectId,req.body.mw1,req.body.startDay,req.body.startTime);
                  var params = {
                    WindowId: req.body.mw2,
                    Schedule: req.body.stopCron
                 };
                 ssm.updateMaintenanceWindow(params, function(err, data) {
                     if(err){
                         console.log(err, err.stack);
                         res.json({success : 0, err_desc : err});
                     }else{
                        updateSchedulerInfo(req.body.projectId,req.body.mw2,req.body.stopDay,req.body.stopTime);
                        res.json({success : 1, err_desc : err});
                     }
                 });
            }
        });
    }
       });
   }
    }); 
});

app.post("/deleteScheduler", function(req, res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    if(con == null)
    con = db.openCon(con);
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.project_id ="+req.body.projectId, function(err, result){
        var params = {
        DurationSeconds: 3600,
        ExternalId: result[0].external_id,
        RoleArn: result[0].arn,
        RoleSessionName: "InfraGuard"
     };
     console.log(result[0]);
     var creds ;
     if(result[0].customer_name =='Right Cloud'){
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region
         });
         var params = {
            WindowId: req.body.mw1
         };
         ssm.deleteMaintenanceWindow(params, function(err, data) {
            if(err){
                console.log(err, err.stack);
                res.json({success : 0, err_desc : err});
            }else{
                 deleteSchedulerInfo(req.body.sc1);
                  var params = {
                    WindowId: req.body.mw2
                 };
                 ssm.deleteMaintenanceWindow(params, function(err, data) {
                     if(err){
                         console.log(err, err.stack);
                         res.json({success : 0, err_desc : err});
                     }else{
                        deleteSchedulerInfo(req.body.sc2);
                        res.json({success : 1, err_desc : err});
                     }
                 });
            }
        });
     }else{
      sts.assumeRole(params, function(err, data) {
      if(err){ 
         if(err.code="CredentialsError"){
            res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
         } 
      }else{
         creds = new AWS.Credentials({
	   accessKeyId: data.Credentials.AccessKeyId, 
   	   secretAccessKey: data.Credentials.SecretAccessKey,
  	   sessionToken: data.Credentials.SessionToken
	 });
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result[0].region,
             credentials : creds
         });
         var params = {
            WindowId: req.body.mw1
         };
        ssm.deleteMaintenanceWindow(params, function(err, data) {
            if(err){
                console.log(err, err.stack);
                res.json({success : 0, err_desc : err});
            }else{
                 deleteSchedulerInfo(req.body.sc1);
                  var params = {
                    WindowId: req.body.mw2
                 };
                 ssm.deleteMaintenanceWindow(params, function(err, data) {
                     if(err){
                         console.log(err, err.stack);
                         res.json({success : 0, err_desc : err});
                     }else{
                        deleteSchedulerInfo(req.body.sc2);
                        res.json({success : 1, err_desc : err});
                     }
                 });
            }
        });
    }
       });
   }
    }); 
});
app.post("/checkScheduler", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("select * from scheduled_task where project_id = ? and is_deleted=0", [req.body.project_id], function(err, result){
        if(result.length > 0){
           res.json({success : 1, data : result}); 
        }else{
           res.json({success : 0, err_desc : err});
        }
    });
});

app.post("/getRegions", function(req, res){
    if(con == null)
    con = db.openCon(con);
    con.query("select region from region where  is_deleted=0", function(err, result){
        if(err){
            res.status(400).send(err.stack);
        }else{
            res.status(200).send(result);
        }
    });
});
app.post("/addCommand", function(req, res){
if(con == null)
con = db.openCon(con);
var data = {
commandName : req.body.cname,
commandDesc : req.body.cdesc,
};
con.query("select * from commands where commandName = ? and is_deleted=0", [req.body.cname], function(err, result){
	console.log(req.body.cname);
	if(err){
		res.json({success : 2, err_desc : err});
		return;
	}
	else if(result.length > 0){
		res.json({success : 2, err_desc : "Command Already Exists!"});
		return;
	}
	else{
		con.query("insert into commands set ?", [data], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
	}
	
	});
});

app.post("/editCommand", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update commands set commandName = ? , commandDesc = ? where id = ?", [req.body.commandName, req.body.commandDesc, req.body.commandId], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});

});

app.post("/deleteCommand", function(req, res){
if(con == null)
con = db.openCon(con);
        con.query("update commands set is_deleted = ? where id = ?", [1,req.body.comid], function(err, result){
	if(err){
		res.json({success : 0, err_desc : err});
		return;
	}
	res.json({success : 1, err_desc : null, row_id: result.insertId, creator: req.session.uid});
	});
});

app.post("/getCommands", function(req, res) {
    if(con == null)
    con = db.openCon(con);
    con.query('select * from commands where is_deleted = 0', function(error, results){
        if ( error ){
            res.status(400).send(error.stack);
        } else {
            res.status(200).send(results);
        }
    });
});
app.post("/getCommandName", function(req, res) {
if(con == null)
    con = db.openCon(con);
    con.query("SELECT commandName FROM commands WHERE is_deleted=0 ", function(err, result){
        if ( err ){
            res.status(400).send(err.stack);
        } else {
            res.status(200).send(result);
        }
    });
});
app.post("/CloudTrail", function(req, res) {
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [req.body.serverId], function(err, result){
        var AWS = require('aws-sdk');
        var sts = new AWS.STS({apiVersion: '2011-06-15'});
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
        };
        var creds;
        sts.assumeRole(params, function(err, data) {
          if(err){
                logger.error('Error in assume role');
                logger.error(err);
                res.json({success : 0});
          }else{
                creds = new AWS.Credentials({
		    accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
                if(result.customer_name == 'Right Cloud'){
                    var cloudtrail = new AWS.CloudTrail({
                        apiVersion: '2013-11-01',
                        region : result[0].region
                    });
                }else{
                    var cloudtrail = new AWS.CloudTrail({
                        apiVersion: '2013-11-01',
                        region : result[0].region,
                        credentials : creds
                    });
                }
                 var params = {
                    LookupAttributes: [
                         {
                           AttributeKey: "ResourceName",
                           AttributeValue: req.body.instanceId
                         }
                       ]
                 };
                cloudtrail.lookupEvents(params, function(err, data){
                    if(err){
                        console.log(err, err.stack);
                        res.json({success : 0, output : err}); 
                    }else{
                       console.log(data);  
                       res.json({success : 1, output : data}); 
                    }
                });
          }
       });  
    });
});
    app.post("/getManagers", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query('select u.id, u.uname, u.email from users u inner join roles r on(r.id=u.roleId) where r.roleName="Manager" and u.is_deleted=0', function (error, results) {
            if (error) {
                res.status(400).send(error.stack);
            } else {
                res.status(200).send(results);
            }
        });
    });
    
    app.post("/addcustomerManager", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query("select * from customer_mapping where customer_id = ? and is_deleted=0", [req.body.custId], function (err, result) {
            if (err) {
                res.json({success: 2, mgr_err_msg: err});
                return;
            } else if (result.length > 0) {
                var managerID = [];
                for (var i = 0; i < result.length; i++) {
                    managerID[i.toString()] = result[i].manager_id;
                }
                if (req.body.mgrId) {
                    con.query("select * from customer_mapping where customer_id = ? and manager_id in(" + req.body.mgrId + ") and is_deleted=0", [req.body.custId], function (err, result) {
                        if (err) {
                            res.json({success: 2, mgr_err_msg: err});
                            return;
                        } else {
                            var managerId = [];
                            var editManagerId = [];
                            for (var i = 0; i < result.length; i++) {
                                managerId[i.toString()] = result[i].manager_id;
                            }
                            editManagerId = req.body.mgrIdList.filter(function (item) {
                                return managerId.indexOf(item) === -1;
                            });

                            if (editManagerId.length > 0) {

                                var sql = "insert into customer_mapping (customer_id,manager_id) values ";
                                for (var i = 0; i < editManagerId.length; i++)
                                    sql += "('" + req.body.custId + "','" + editManagerId[i] + "'),";
                                sql = sql.substr(0, sql.length - 1);
                                con.query(sql, '0', function (err, result) {
                                });
                            }
                            if (managerID) {
                                for (i = 0; i < managerID.length; i++) {
                                    if (req.body.mgrIdList.indexOf(managerID[i]) > -1) {
                                    } else {
                                        con.query("update customer_mapping set is_deleted = 1 where manager_id = ? and customer_id = ?", [managerID[i], req.body.custId], function (err, result) {
                                        });
                                    }
                                }
                            }
                        }
                    });
                } else {
                    con.query("update customer_mapping set is_deleted = 1 where customer_id = ?", [req.body.custId], function (err, result) {
                    });
                }
            } else {
                var sql = "insert into customer_mapping (customer_id,manager_id) values ";
                for (var i = 0; i < req.body.mgrIdList.length; i++)
                    sql += "('" + req.body.custId + "','" + req.body.mgrIdList[i] + "'),";
                sql = sql.substr(0, sql.length - 1);
                con.query(sql, '0', function (err, result) {
                });

            }
            res.json({success: 1, mgr_err_msg: null, row_id: result.insertId, creator: req.session.uid});
        });
    });

    app.post("/getcustomerManager", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        con.query("select manager_id from customer_mapping where customer_id = ? and is_deleted = 0", [req.body.customerId], function (error, results) {
            if (error) {
                res.status(400).send(error.stack);
            } else {
                res.status(200).send(results);
            }
        });
    });
    app.post("/DownloadKeyTrail", function (req, res) {
        if (con == null)
            con = db.openCon(con);
        var record = {
            script_id: "-12",
            server_id: req.body.serverId,
            user_id: req.session.uid,
            command_id: "Download Key",
            command_output: "Download Key",
            command: "",
            server_users_id: req.body.server_user_id,
            
        };
        con.query("insert into script_ssm_history set ?", [record], function (err, result) {
        });
    });
}
function addScedulerInfo(project_id,window_id,task_id,target_id,start_stop_day,start_stop_time){
    if(con == null)
    con = db.openCon(con);
    var data = {
        project_id :project_id,
        window_id : window_id,
        task_id : task_id,
        target_id:target_id,
        start_stop_day : start_stop_day,
        start_stop_time : start_stop_time
    }
    con.query("insert into scheduler_log set ?", [data], function(err1, result1){       
    });
}
function updateSchedulerInfo(project_id,window_id,day,time){
    if(con == null)
    con = db.openCon(con);
    console.log("update scheduler_log set start_stop_day = '"+day+"' , start_stop_time='"+time+"' where project_id = "+project_id+" and window_id='"+window_id+"'");
    con.query("update scheduler_log set start_stop_day = '"+day+"' , start_stop_time='"+time+"' where project_id = "+project_id+" and window_id='"+window_id+"'", function(err1, result1){       
    });
}
function deleteSchedulerInfo(scheduler_id){
    if(con == null)
    con = db.openCon(con);
    con.query("update scheduler_log set is_deleted =1 where id = "+scheduler_id, function(err1, result1){       
    });
}
function adduser(email,passw,uname){
    if(con == null)
    con = db.openCon(con);
    var data = {
        email :email,
        uname : uname,
        passw : bcryptPassw.generateHash(passw),
        linuxName:uname,
        shell : "/bin/bash",
        userRegistration : "InfraGuard"
    }
    con.query("select * from users where email = ?", [email], function(err, result){
		if(err){
			console.log(err.stack);
		}
		else if(result.length <= 0){
			con.query("insert into users set ?", [data], function(err1, result1){
				if(err1){
					console.log(err1.stack);
				}
			});
		}else{
                    
                }
	});
}
function addServerTrail(scriptId,serverId,commandId,commandOutput,command,uid,project_id,flag){
    if(project_id == undefined || project_id==null || project_id==""){
        project_id="";
    }
    if(flag=="1"){
        flag="scheduler"
    }
var record = {
    script_id:scriptId,
    server_id:serverId,
    user_id : uid,
    command_id : commandId,
    command_output :commandOutput,
    command :command,
    project_id:project_id,
    excecuted_from : flag
}
con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
});
}
function addServerUsersTrail(scriptId,serverId,commandId,commandOutput,command,uid,project_id,server_users_id,flag){
    if(project_id == undefined || project_id==null || project_id==""){
        project_id="";
    }
    if(flag=="1"){
        flag="scheduler"
    }
var record = {
    script_id:scriptId,
    server_id:serverId,
    user_id : uid,
    command_id : commandId,
    command_output :commandOutput,
    command :command,
    project_id:project_id,
    server_users_id:server_users_id,
    excecuted_from : flag
}
con.query("insert into script_ssm_history set ?", [record], function(err1, result1){
});
}
function getUserCommand(result,req,key,res){
    console.log(result);
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var params = {
        DurationSeconds: 3600,
        ExternalId: result.external_id,
        RoleArn: result.arn,
        RoleSessionName: "InfraGuard"
    };
    console.log(params);
    var creds;
    var document;
    if(result.platform == 'Windows'){
        document = 'AWS-RunPowerShellScript';
    }else{
        document = 'AWS-RunShellScript';
    }
    //var sleep = require('system-sleep');
    if(result.customer_name == 'Right Cloud'){
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region
        });
        var params = {
            DocumentName: document,
            InstanceIds: [
               result.instanceId
            ],
            Parameters:{
                "commands":["cat /etc/passwd | grep '/home' | cut -d: -f1"]
            }
        };
        ssm.sendCommand(params, function(err, data){
            if(err) console.log(err, err.stack);
            else{
                sleep(5000, function() {});
                var params1 = {
                    CommandId: data.Command.CommandId,
                    InstanceId: result.instanceId
                };
                ssm.getCommandInvocation(params1, function(err, data1){
                    if(err){
                       res.json({success : 0, err_desc : err});
                    }else{
                       var userarray = result.username;
                       //updateProjectUsers(userarray, result.serverId, result.serverIP);
                       rotateKey(result,userarray,null,req,key);
                    }
                });
            }
        });
        }else{
            sts.assumeRole(params, function(err, data){
            if(err){
                if (err.code = "CredentialsError"){
                 //res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                }
            }else{
                creds = new AWS.Credentials({
                    accessKeyId: data.Credentials.AccessKeyId,
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
                });
                var ssm = new AWS.SSM({
                apiVersion: '2014-11-06',
                        region : result.region,
                        credentials : creds
                });
                var params = {
                    DocumentName: document,
                    InstanceIds: [
                                    result.instanceId
                            ],
                     Parameters: {
                        "commands":["cat /etc/passwd | grep '/home' | cut -d: -f1"]
                     }
                };
                console.log(params);
                ssm.sendCommand(params, function(err, data){
                    if (err) console.log(err, err.stack);
                    else{
                       sleep(5000, function() {});
                        var params1 = {
                            CommandId: data.Command.CommandId,
                            InstanceId: result.instanceId
                        };
                        ssm.getCommandInvocation(params1, function(err, data1){
                            if(err){
                                //res.json({success : 0, err_desc : err});
                            }else{
                               var userarray = result.username;
                              // updateProjectUsers(userarray, result.serverId, result.serverIP);
                               rotateKey(result,userarray,creds,req,key);
                            }
                        });
                    }
                });
            }
         });
        }
}
function updateProjectUsers(userarray,server_id,server_ip){
    if(con == null)
    con = db.openCon(con);
    console.log("user array get from server");
    console.log(userarray);
    var sql = "select * from server_users where is_deleted =0  and server_id="+server_id;
    con.query(sql, function(err, result){
        if(err){
        }else{
             var server_users =[];
             if(result.length > 0){
                for(var i = 0, l = result.length; i < l; i++){
                      server_users[i]=result[i].username;
                }
             }
             intersect_array= intersect(userarray,server_users);
             for( var i =userarray.length - 1; i>=0; i--){
                    for( var j=0; j<intersect_array.length; j++){
                      if(userarray[i] === intersect_array[j]){
                        userarray.splice(i, 1);
                      }
                    }
             }
             console.log(userarray);
             if(userarray.length <0 || userarray[0] ==""){
                 var sql = "select * from server_users where is_deleted=0 and server_id ="+server_id;
                       con.query(sql,'0', function(err, result){
                            if (err){
                            }else{
                           }
                 });
             }else{
                var sql = "insert into server_users (server_id,server_ip,username) values ";
                for(var j=0;j<userarray.length;j++){
                         if(userarray[j] !=""){
                             sql += "('"+server_id+ "','" + server_ip + "','" + userarray[j] + "'),";
                         }
                }
               sql = sql.substr(0,sql.length-1);
               con.query(sql,'0', function(err, result){
                   if(err){
                   }else{
                       var sql = "select * from server_users where is_deleted=0 and server_id ="+server_id;
                       con.query(sql,'0', function(err, result){
                            if (err){
                            }else{
                           }
                       });
                   }
               });
           }
        }
    });
}
function rotateKey(result,userarray,creds,req,key){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   //var sleep = require('system-sleep');
   var creds ;var document ;var paramsCommand ;var platform;
   var sshpubKey = []; var command_3 = [] ;var command_4 = [] ;var command_5 = [];
   var uname = userarray; 
   if(con == null)
    con = db.openCon(con);
    var pair = keypair();
    var privateKey = pair.private; 
    var pubKey = forge.pki.publicKeyFromPem(pair.public);
    sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, uname+'@InfraGuard');
    command_3 = 'su - -c "echo '+sshpubKey+'> .ssh/authorized_keys" '+uname;
    command_4 = 'su - -c "chmod 600 .ssh/authorized_keys" '+uname;
    command_5 = 'id -u '+uname;
    var command = command_3+"\n"+command_4+"\n"+command_5;
    var serverId = result.serverId;
    var params = {
        DurationSeconds: 3600,
        ExternalId: result.external_id,
        RoleArn: result.arn,
        RoleSessionName: "InfraGuard"
    };
    if(result.platform=='Windows'){
        platform ='W';
        document ='AWS-RunPowerShellScript';
        paramsCommand = {
          DocumentName: document,
          InstanceIds: [
                 result.instanceId
           ],
          Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
        };
     }else{
        platform ='L';
        document ='AWS-RunShellScript';
        paramsCommand = {
                  DocumentName: document,
                  InstanceIds: [
                     result.instanceId
                  ],
                  Parameters: {
                     "commands":[command_3,command_4,command_5]
                  }
                };
     }
     console.log(paramsCommand);
     if(result.customer_name =='Right Cloud'){
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result.region
         });
     }else{
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result.region,
             credentials : creds
         });
      }
      ssm.sendCommand(paramsCommand, function(err, data){
        if(err){
           console.log(err, err.stack);
           logger.error('Error in Send command');
           logger.error(err);
        }else{
            sleep(5000, function() {});
            var params1 = {
               CommandId: data.Command.CommandId,
               InstanceId: result.instanceId
            };
            ssm.getCommandInvocation(params1, function(err, data1){
              if(err){
                  logger.error('Error in get command result');
                  logger.error(err);
              }else{
                  var command_output = data1.StandardOutputContent;
                  if(data1.StandardOutputContent==""){
                  }else{
                     if(key=="getAccessKey"){
                        serverAcessKeyEmail(result.email,privateKey,result.serverIP,uname,result.uemail,req.session.email);
                        addServerTrail("-5",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);  
                     }else{
                       rotateKeyEmail(result.email,privateKey,result.serverIP,uname,result.uemail,req.body.sendEmailStatus);
                       addServerTrail("-6",serverId,data.Command.CommandId,data1.StandardOutputContent,command,req.session.uid);  
                     }
                     var sql= "select id from server_users where server_id="+result.serverId+" and username='"+uname+"' and is_deleted=0";
                     console.log(sql);
                     con.query(sql, function(err, results){
                         var update = "update server_users set private_key = '"+privateKey+"' where id="+results[0].id;
                         console.log(update);
                         con.query(update, function(err, result){
                        });
                     });
                     
                 }
               }      
             });
           }       
        });
}
function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}

function runScriptMethod(result,document,creds,req,res){
    var script_string = req.body.script.replace(/\n/g, "##");  
    var command_array = [];
    if(req.body.runCommand==1){
        command_array = script_string.split("##");
    }else{
        if(result.platform=='Windows'){
            command_array[0] =  "echo.>infraGuard.ps1";
            command_array[1] = "attrib -r infraGuard.ps1";
            command_array[2] = "echo '"+req.body.script+"' > infraGuard.ps1";
            command_array[3] = "./infraGuard.ps1";
        }else{
            command_array[0] = "touch /home/infraGuard.sh";
            command_array[1] = "chmod 777 /home/infraGuard.sh";
            command_array[2] = "echo '"+req.body.script+"' > /home/infraGuard.sh";
            command_array[3] = "./home/infraGuard.sh";
            command_array[4] = "rm ./home/infraGuard.sh";
        }
    }
    var AWS = require('aws-sdk');
    if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
           apiVersion: '2014-11-06',
           region : result.region
        });
    }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
    }
    var params = {
        DocumentName: document,
        InstanceIds: [
           result.instanceId
        ],
        Parameters: { "commands":command_array }
    };
    ssm.sendCommand(params, function(err, data){
        if(err){ console.log(err, err.stack);}
        else{
           sleep(1000, function() {});  
           getCommandInvocation(data.Command.CommandId,result.instanceId,ssm,req,res);
        }       
    });
}

function getCommandInvocation(commandId,instanceId,ssm,req,res){
  var params1 = {
    CommandId: commandId,
    InstanceId: instanceId
  };
  ssm.getCommandInvocation(params1, function(err, data1){
    if(err){
       res.json({success : 0, err_desc : err});
    }else{
        console.log(data1);
      if(data1.Status =="InProgress"){
         sleep(1000, function() {});
         getCommandInvocation(commandId,instanceId,ssm,req,res); 
      }else{
          if(req.body.script=="clear"){
                   data1.StandardOutputContent="";
          }
          if(req.body.script!="clear" && data1.StandardOutputContent==""){
              data1.StandardOutputContent = data1.StandardErrorContent;
          }
          addServerTrail(req.body.script_id,req.body.serverId,commandId,data1.StandardOutputContent,req.body.script,req.session.uid)
          res.json({success : 1, err_desc : null, response: data1.StandardOutputContent, creator: req.session.uid}); 
      }
    }
  });  
}

function checkSSMStatus(result,document,creds,req,res){
    var AWS = require('aws-sdk');
    if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
           apiVersion: '2014-11-06',
           region : result.region
        });
    }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
    }
    var params = {
        DocumentName: document,
        InstanceIds: [
           result.instanceId
        ],
        Parameters: { "commands":['date'] }
    };
    ssm.sendCommand(params, function(err, data){
        if(err){
           logger.error('Error in Send command');
           logger.error(err);
           console.log(err, err.stack);
           addSSMAliveHistory(req, res,err.code,'Stop');
        }else{
           sleep(2000, function() {});  
           checkStatusCommandInvocation(data.Command.CommandId,result.instanceId,ssm,req,res);
        }       
    });
}
function checkStatusCommandInvocation(commandId,instanceId,ssm,req,res){
  var params1 = {
    CommandId: commandId,
    InstanceId: instanceId
  };
  ssm.getCommandInvocation(params1, function(err, data1){
    if(err){
       logger.error('Error in get command result');
       logger.error(err);
       addSSMAliveHistory(req, res,err.code,'Stop');
    }else{ 
          var command_output = "Alive";
          if(data1.StandardOutputContent==""){
               command_output = "Stop";
          }
          addSSMAliveHistory(req, res,commandId,command_output);
    }
  });  
}
function syncInstanceList(req,creds,customer_name,region,res){
  console.log(region);
  var AWS = require('aws-sdk');
  if(customer_name =='Right Cloud'){
       var ec2 = new AWS.EC2({
          apiVersion: '2016-11-15',
           region : region
      });
  }else{
       var ec2 = new AWS.EC2({
          apiVersion: '2016-11-15',
           region : region,
           credentials : creds
      });
  }
   var region_assign = region;
   var params1 = {MaxResults:1000};
   ec2.describeInstances(params1, function(err, data){
    if (err){ 
        console.log(err, err.stack);
        logger.error('error in describeInstances');
        logger.error(err);
    }else{
        //logger.error("Next Token");
        //logger.error(data.NextToken);
        logger.error("region " +region);
        logger.error('data in describeInstances');
        logger.error(data);
        var ServerName = "";var instanceId = "";var serverIP = "";var hostname = "";
        var globalHostName = "";var customerIAMId = "";var region = "";var vpc_id = "";
        var raw_data = "";var serverIPS = [];var deleteIPS = [];
        var sql = "insert into servers (serverName,instanceId,serverIP,hostname,globalHostName,customerIAMId,region,vpc_id,raw_data) values ";
        var get_ips = "select instanceId as ip from servers where customerIAMId="+req.body.id+" and region='"+region_assign+"'";
        con.query(get_ips, function(err, result_ips){
            for(var j=0 ; j <result_ips.length;j++){
                serverIPS[j] = result_ips[j].ip;
                deleteIPS[j] = result_ips[j].ip;
            }
            //logger.error('instance id array');
            //logger.error(serverIPS);
            console.log(region_assign);
            var a=0;
            for (var i = 0; i < data.Reservations.length; i++) {
                for(var m=0;m<data.Reservations[i].Instances.length;m++){
                    console.log(data.Reservations[i].Instances[m].InstanceId);
                if(deleteIPS.indexOf(data.Reservations[i].Instances[m].InstanceId) !== -1){
                    var index = deleteIPS.indexOf(data.Reservations[i].Instances[m].InstanceId);
                    deleteIPS.splice(index, 1);
                }
                for(var k =0 ; k < data.Reservations[i].Instances[m].Tags.length ;k++ ){
                    if(data.Reservations[i].Instances[m].Tags[k]['Key']=="Name"){
                        ServerName =  data.Reservations[i].Instances[m].Tags[k]['Value'];
                    }
                }
                if(serverIPS.indexOf(data.Reservations[i].Instances[m].InstanceId) > -1) {
                    var update_sql = "update servers s set s.serverName='"+ServerName+"' ,s.serverIP='"+data.Reservations[i].Instances[m].PrivateIpAddress+"', s.raw_data='"+JSON.stringify(data.Reservations[i].Instances[m])+"' where s.instanceId='"+data.Reservations[i].Instances[m].InstanceId+"'";
                    con.query(update_sql, function(e, r){
                    });
                }else{
                    instanceId = data.Reservations[i].Instances[m].InstanceId;
                    serverIP = data.Reservations[i].Instances[m].PrivateIpAddress;
                    hostname = data.Reservations[i].Instances[m].PrivateDnsName;
                    globalHostName = data.Reservations[i].Instances[m].PublicDnsName;
                    region = data.Reservations[i].Instances[m].Placement.AvailabilityZone;
                    region = region.slice(0, -1); 
                    vpc_id = data.Reservations[i].Instances[m].VpcId;   
                    customerIAMId = req.body.id;;
                    raw_data = JSON.stringify(data.Reservations[i].Instances[m]);
                    sql += "('"+ServerName+ "','" + instanceId + "','" + serverIP+ "','" + hostname+ "','" + globalHostName+"','"+customerIAMId+"','"+region+"','"+vpc_id+"','"+raw_data+"'),";
                }
                }
            }
            sql = sql.substr(0,sql.length-1);
            con.query(sql,'0', function(err, results){
//                if(deleteIPS.length > 0){
//                    var instance_string = "";
//                    for (var i = 0; i < deleteIPS.length; i++) {
//                        instance_string +="'"+deleteIPS[i]+"',";
//                    }
//                   instance_string = instance_string.substr(0,instance_string.length-1);
//                   var back_up = "INSERT INTO servers_backup  SELECT * FROM servers where instanceId in ("+instance_string+")";
//                   logger.error(back_up);
//                        var delete_sql = "delete from servers where instanceId in ("+instance_string+")";
//                        logger.error(delete_sql);
//                        con.query(back_up,'0', function(err, results){
//                            con.query(delete_sql,'0', function(error, res){
//                            });
//                        });
//                }
//                if(region_assign=="sa-east-1"){
//                    res.json({success : 1}); 
//                }
                if(customer_name=="Right Cloud"){
                    var ssm = new AWS.SSM({
                        apiVersion: '2014-11-06',
                        region : region_assign
                     });
                }else{
                    var ssm = new AWS.SSM({
                        apiVersion: '2014-11-06',
                        region : region_assign,
                        credentials : creds
                     });
                }
                var params2 = {};
                ssm.getInventory(params2, function(err, data) {
                    if(err){ 
                        console.log(err, err.stack);
                        logger.error('error in getInventory');
                        logger.error(err);
                    }else{
                        logger.error('data in getInventory');
                        logger.error(data);
                        var ServerName = "";var instanceId = "";var serverIP = "";var hostname = "";
                        var globalHostName = "";var customerIAMId = "";var region = "";var vpc_id = "";
                        var platform = ""; var serverIPS = [];
                        var sql = "insert into servers (serverName,instanceId,serverIP,hostname,globalHostName,customerIAMId,region,platform) values ";
                        var get_ips = "select instanceId as ip from servers where customerIAMId="+req.body.id;
                        con.query(get_ips, function(err, result_ips){
                            for(var j=0 ; j <result_ips.length;j++){
                               serverIPS[j] = result_ips[j].ip;
                            }
                        //console.log(serverIPS);
                        var a =0;
                        if(data.Entities.length > 0){
                            for(var i = 0; i < data.Entities.length; i++) {
                                console.log(data.Entities[i]);
                                console.log(data.Entities[i].Data);
                                if(Object.keys(data.Entities[i].Data).length>0){
                                    if(data.Entities[i].Data['AWS:InstanceInformation'].Content[0].InstanceStatus=="Terminated"){
                                        deleteIPS[a]=data.Entities[i].Id;
                                        a++;
                                    }
                                    if(data.Entities[i].Data['AWS:InstanceInformation'] !=undefined && data.Entities[i].Id.indexOf("mi-") !== -1){
                                        if(serverIPS.indexOf(data.Entities[i].Id) > -1) {
                                            platform = data.Entities[i].Data['AWS:InstanceInformation'].Content[0].PlatformType; 
                                            serverIP = data.Entities[i].Data['AWS:InstanceInformation'].Content[0].IpAddress;
                                            con.query("update servers set platform ='"+platform+"' where serverIP='"+serverIP+"'", function(err, results){
                                            });
                                        }else{
                                            instanceId = data.Entities[i].Id;
                                            serverIP = data.Entities[i].Data['AWS:InstanceInformation'].Content[0].IpAddress;
                                            hostname = '';
                                            globalHostName = '';
                                            platform = data.Entities[i].Data['AWS:InstanceInformation'].Content[0].PlatformType; 
                                            region = region_assign;
                                            customerIAMId = req.body.id;
                                            ServerName=data.Entities[i].Data['AWS:InstanceInformation'].Content[0].ComputerName;
                                            sql += "('"+ServerName+ "','" + instanceId + "','" + serverIP+ "','" + hostname+ "','" + globalHostName+"','"+customerIAMId+"','"+region+"','"+platform+"'),";
                                        }
                                    }
                                }
                                
                            }
                            sql = sql.substr(0,sql.length-1);
                            con.query(sql,'0', function(err, results){
                               // console.log(deleteIPS);
                                if(deleteIPS.length > 0){
                                   for (var i = 0; i < deleteIPS.length; i++) {
                                     var delete_sql = "delete from servers where instanceId='"+deleteIPS[i]+"'";
                                     con.query(delete_sql,'0', function(err, results){
                                     });
                                   }
                                   //res.json({success : 1, err_desc : err});
                                }else{
                                   //res.json({success : 1, err_desc : err});
                                }
                            });
                        }else{
                           //res.json({success : 1, err_desc : err}); 
                        }
                    });
                                    }
                });
                   if(region_assign=="sa-east-1"){
                    res.json({success : 1}); 
                }
            });
        });
    }
  });
}
function updateServerUsers(userarray,server_id,server_ip,res){
    if(con == null)
    con = db.openCon(con);
    console.log("user array get from server");
    console.log(userarray);
    var sql = "select * from server_users where is_deleted =0  and server_id="+server_id;
    con.query(sql, function(err, result){
        if(err){
             res.json({success : 0, err_desc : null}); 
        }else{
             var server_users =[];
             if(result.length > 0){
                for(var i = 0, l = result.length; i < l; i++){
                      server_users[i]=result[i].username;
                }
             }
             intersect_array= intersect(userarray,server_users);
             for( var i =userarray.length - 1; i>=0; i--){
                    for( var j=0; j<intersect_array.length; j++){
                      if(userarray[i] === intersect_array[j]){
                        userarray.splice(i, 1);
                      }
                    }
             }
             console.log(userarray);
             if(userarray.length <0 || userarray[0] ==""){
                 var sql = "select * from server_users where is_deleted=0 and server_id ="+server_id;
                       con.query(sql,'0', function(err, result){
                            if (err){
                              res.json({success : 0, err_desc : null});  
                            }else{
                              res.json({success : 1, err_desc : null,output:result});  
                           }
                 });
             }else{
                var sql = "insert into server_users (server_id,server_ip,username) values ";
                for(var j=0;j<userarray.length;j++){
                         if(userarray[j] !=""){
                             sql += "('"+server_id+ "','" + server_ip + "','" + userarray[j] + "'),";
                         }
                }
               sql = sql.substr(0,sql.length-1);
               con.query(sql,'0', function(err, result){
                   if(err){
                      res.json({success : 0, err_desc : null});  
                   }else{
                       var sql = "select * from server_users where is_deleted=0 and server_id ="+server_id;
                       con.query(sql,'0', function(err, result){
                            if (err){
                              res.json({success : 0, err_desc : null});  
                            }else{
                              res.json({success : 1, err_desc : null,output:result});  
                           }
                       });
                   }
               });
           }
        }
    });  
}
function sendMail(email,private_key,serverIp,username,useremail){
    var Email = require('email').Email;
    var myMsg = new Email({ 
        from: "admin@infragaurd.io", 
        to:email, 
        cc:useremail,
        subject: "Add User Credentials", 
        body: "Please find credentials for user["+username+"] which has been added and keep it safe.\n\nServerIP  : "+serverIp+" \n\n Your private key for SSH Login : \n\n "+private_key+"\n\n  Thanks \n Infraguard Team"
    });
    myMsg.send(function(err){
        console.log(err);
    });
}
function rotateKeyEmail(email,private_key,serverIp,username,useremail,sendEmailStatus){
    var Email = require('email').Email;
    var myMsg = {};
    if (sendEmailStatus == true && useremail !=""){
        myMsg = new Email({ 
        from: "admin@infragaurd.io", 
        to:email, 
        cc:useremail,
        subject: "Server Key Rotation Credentials", 
        body: "Please find credentials for server user("+username+") which has been changed due to Server Key Rotation Policy and keep it safe.\n\nServerIP  : "+serverIp+" \n\n Your private key for SSH Login : \n\n "+private_key+"\n\n  Thanks \n Infraguard Team"
    })
    } else {
        myMsg = new Email({ 
        from: "admin@infragaurd.io", 
        to:email, 
        subject: "Server Key Rotation Credentials", 
        body: "Please find credentials for server user("+username+") which has been changed due to Server Key Rotation Policy and keep it safe.\n\nServerIP  : "+serverIp+" \n\n Your private key for SSH Login : \n\n "+private_key+"\n\n  Thanks \n Infraguard Team"
    }) 
    }
    myMsg.send(function(err){
        console.log(err);
    });
}
function serverAcessKeyEmail(email,private_key,serverIp,username,useremail){
    var Email = require('email').Email
    var myMsg = new Email({ 
        from: "admin@infragaurd.io", 
        to:email, 
        cc:useremail,
        subject: "Server Access Key", 
        body: "Please find credentials for server and keep it safe.\n\nServerIP  : "+serverIp+" \n\n Your private key for SSH Login : \n\n "+private_key+"\n\n  Thanks \n Infraguard Team"
    })
    myMsg.send(function(err){
        console.log(err);
    });
}
function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

function checkPingStatus(result,creds,req,res){
    var AWS = require('aws-sdk');
    if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
           apiVersion: '2014-11-06',
           region : result.region
        });
    }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
    }
    var params = {
          Filters: [
            {
              Key: 'InstanceIds', 
              Values: [ result.instanceId]
            }
          ]
    }
    ssm.describeInstanceInformation(params, function(err, data){
        if(err){
            console.log(err, err.stack);
            addPingStatus(req,res,err,'error');
        }else{
            console.log(data);
            addPingStatus(req,res,data,'success');
        }
    });   
}
function addPingStatus(req,res,data,output){
    if(con == null)
    con = db.openCon(con);
    var current_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var ping_status = "";
    var plaform_type = ""; 
    if(output=="error"){
        ping_status = "Error";
    }else{
        if(data['InstanceInformationList'][0] =="" || data['InstanceInformationList'][0] ==null){
           ping_status = 'Error';
        }else{
           ping_status = data['InstanceInformationList'][0].PingStatus;
           plaform_type = data['InstanceInformationList'][0].PlatformType;
        }
    }
    var raw_data_output = JSON.stringify(data['InstanceInformationList'][0]);
    var record = {
        server_id:req.body.server_id,
        server_ip:req.body.server_ip,
        status :ping_status,
        last_run_time : current_time,
        raw_data : raw_data_output
    }
    var sql = "select max(s.id) as id from ssm_alive_history s where s.server_id = "+req.body.server_id;
    con.query(sql, function(e,r){
        if(r.length > 0 && r[0].id !=null){
            var update_sql = "update ssm_alive_history s set s.status='"+ping_status+"' , s.last_run_time='"+current_time+"',s.raw_data='"+raw_data_output+"' where s.id="+r[0].id;
            console.log(update_sql);
            con.query(update_sql, function(err, result){
                var sql = "select distinct s.*,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status,(select s.raw_data from ssm_alive_history s where id=max(ssm.id)) as instance_raw_data from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where s.customerIAMId= "+req.body.customer_id+" group by s.id order by s.serverName ASC,ssm.id desc"
                con.query(sql, function(error, results){
                   res.json({success : 1, err_desc : null, response: ping_status, creator: req.session.uid,time : current_time,projectInstance:results});  
               });
            });
        }else{
            con.query("insert into ssm_alive_history set ?", [record], function(err, result){
                var sql = "select distinct s.*,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status,(select s.raw_data from ssm_alive_history s where id=max(ssm.id)) as instance_raw_data from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where s.customerIAMId= "+req.body.customer_id+" group by s.id order by s.serverName ASC,ssm.id desc"
                con.query(sql, function(error, results){
                   res.json({success : 1, err_desc : null, response: ping_status, creator: req.session.uid,time : current_time,projectInstance:results});  
               });
            });
        }
        console.log("update servers set platform = '"+plaform_type+ "' where id="+req.body.server_id);
        con.query("update servers set platform = '"+plaform_type+ "' where id="+req.body.server_id, function(err, result){
            
        });
    });   
}
function addSSMAliveHistory(req,res,CommandId,command_output){
    if(con == null)
    con = db.openCon(con);
    var current_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var record = {
        server_id:req.body.server_id,
        server_ip:req.body.server_ip,
        command_id : CommandId,
        status :command_output,
        last_run_time : current_time
    }
    con.query("insert into ssm_alive_history set ?", [record], function(err, result){
        if(err){
             console.log(err1.stack);
        }else{
            var sql = "select distinct s.*,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status,(select s.command_id from ssm_alive_history s where id=max(ssm.id)) as failed_reason from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where s.customerIAMId= "+req.body.customer_id+" group by s.id order by s.serverName ASC,ssm.id desc"
           // var sql = "select distinct s.*,p.projectName,c.companyName,c.id as company_id,max(ssm.status) as status,max(ssm.id) as ssmid from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) where s.customerIAMId= "+req.body.customer_id+" group by s.id order by s.serverName ASC,ssm.id desc";
            con.query(sql, function(error, results){
               res.json({success : 1, err_desc : null, response: command_output, creator: req.session.uid,time : current_time,projectInstance:results});  
           });
        }
   });
}

function updateHomeDirectory(res,server_id,output,platfrom){
    if(con == null)
    con = db.openCon(con);
    logger.error("1"+output+"1"+platfrom);
    if(output != "N/A" || output !=undefined || output !=""){
        if(platfrom=="L"){
            var array1 = output.split("\n");
            var array = array1.slice(0,6);
            array.push(array1.slice(6).join("\n"));
            var homeDir = array[0];
            var disk = (array[1]=="" || array[1]==undefined)?"":array[1].split(/(\s+)/);
            var diskSpace = disk[4]+"/"+disk[2]+" ("+disk[8]+")";
            var CPU = array[2];

            var memory = (array[3]=="" || array[3]==undefined)?"":array[3].split(/(\s+)/);
            var memorySpace = (memory[4]/1024).toFixed(2)+"GB/"+(memory[2]/1024).toFixed(2)+"GB"+" ("+((memory[4]/memory[2]*100).toFixed(2))+"%)";
            var osVersion = array[4];
            osVersion = (osVersion=="" || osVersion==undefined)?"":osVersion.replace(/NAME=/g, '');
            osVersion = (osVersion=="" || osVersion==undefined)?"":osVersion.replace(/VERSION=/g, '');
            osVersion = (osVersion=="" || osVersion==undefined)?"":osVersion.replace(/"/g, '');
            if (array[5] !=null){
            var bufferCache = array[5].replace(/cache:         /g, '');
            bufferCache  = (bufferCache=="" || bufferCache==undefined)?"":bufferCache.replace(/cache:     /g, '');
            bufferCache  = (bufferCache=="" || bufferCache==undefined)?"":bufferCache.replace(/buffers/g, '');
            bufferCache  = (bufferCache=="" || bufferCache==undefined)?"":bufferCache.replace(/\+/g,'')
            bufferCache  = (bufferCache=="" || bufferCache==undefined)?"":bufferCache.replace(/\-/g,'')
            bufferCache  = (bufferCache=="" || bufferCache==undefined)?"":bufferCache.replace(/\//g, '');
            console.log(bufferCache);
            bufferCache = bufferCache.split("        ");
            var buffer = (bufferCache[0]/1024).toFixed(2)+"GB";
            var cache = (bufferCache[1]/1024).toFixed(2)+"GB";
            console.log(buffer+""+cache);
        }
        }else{
           var homeDir = "/";
           
           var array1 = output.split("\n");
           var array3 = array1.slice(0,11);
           array3.push(array1.slice(11).join("\n"));
           var CPU = array1[2]+"%";
           var memory1 = array1[0];
           var memory2 = array1[1];
           var buffer ="";
           var cache = "";
           var memorySpace = (memory2/(1024*1024)).toFixed(2)+"GB/"+(memory1/(1024*1024)).toFixed(2)+"GB"+" ("+((memory2/memory1*100).toFixed(2))+"%)"; 
           var os1 = (array1[3]=="" || array1[3]==undefined)?"":array1[3].replace(/OS Name:/g, '');
           var os2 = (array1[4]=="" || array1[4]==undefined)?"":array1[4].replace(/OS Version:/g, '');
           var osVersion = os1.trim()+" "+os2.trim();
           var ds1 = (array1[5]=="" || array1[5]==undefined)?"":array1[5].replace(/Total # of free bytes        :/g, '');
           var ds2 = (array1[6]=="" || array1[6]==undefined)?"":array1[6].replace(/Total # of bytes             :/g, '');
           var diskSpace = (ds1.trim()/(1024*1024*1024)).toFixed(2)+"GB/"+" "+(ds2.trim()/(1024*1024*1024)).toFixed(2)+"GB"+" ("+((ds1.trim()/ds2.trim()*100).toFixed(2))+"%)"; 
        }
        var sql = "update servers s set s.home_directory = '"+homeDir+"',s.cpu_per='"+CPU+"',s.memory_per='"+memorySpace+"',s.disk_per='"+diskSpace+"',s.os_version='"+osVersion+"',s.buffer='"+buffer+"',s.cache='"+cache+"' where s.id="+server_id;
        console.log(sql);
       // var sql = "update servers s set s.home_directory='"+output+"' where s.id="+server_id;
            con.query(sql, function(error, results){
               res.json({success : 1, err_desc : null, response: output,platfrom:platfrom});  
        });
    }else {
        res.json({success : 1, err_desc : null, response: output,platfrom:platfrom});  
    }
}
function updateServerKey(dataset){
if(con == null)
con = db.openCon(con);
var data = [];
console.log(" Length = : "+dataset.length);
	for(var i=0;i<dataset.length;i++){
		var pair = keypair();
		var pubKey = forge.pki.publicKeyFromPem(pair.public);
		var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, 'default@InfraGuard');
		var privateKey = pair.private; 
		var serverIp = dataset[i].serverIP;
		var email = dataset[i].email;
		var record = [];
		record = [
		    serverIp,
		    "updateServerDefaultUserKey",
		    JSON.stringify({publicKey: sshpubKey,privKey:privateKey,email:email}),
		    "0"
			];	
		data.push(record);
	}

console.log(" final data length = : "+data.length+"   data = " +data);
	con.query("insert into agentActivities (serverIp,activityName,requiredData,status) values ?", [data], function(err, result){
		if(err)console.log(err.stack);
			console.log(" updateServerKey data inserted into agent activities");
	}
	);

console.log('running task = updateServerKey every minute. This will get executed on 1st of every month');
}

function revokeServerAccess(){
	var data = [];
	if(con == null)
	con = db.openCon(con);
    con.query("select * from userServerAccessStatus where accessStatus = ?", [1], function(err, result) {
    if (err) console.log("signup_error: ", err.stack); 
	if (result.length > 0) {
		for(var i=0;i<result.length;i++){
		record = [
		    result[i].serverIP,
		    "deletePubKey",
		    JSON.stringify({userName: result[i].userName}),
		    "0"
		];	
		data.push(record);
	}
	con.query("insert into agentActivities (serverIp,activityName,requiredData,status) values ?", [data], function(err1, result1){
		if(err1){
			console.log(err1.stack);
		}
	});
	}
 });
 console.log('running task = revokeServerAccess every day. This will get executed every day');
}

function saveQRCodeImg(qrcode,email){
	var base64Data = qrcode.replace(/^data:image\/png;base64,/, "");
    require("fs").writeFile("./angular/images/qrcode/"+email+".png", base64Data, 'base64', function(err) {
	 	console.log(err);
	});
}

function signupAction(req, res, data){
	if(con == null)
	con = db.openCon(con);
	con.query("select email from users where email = ?", [data.email], function(err, result) {
		if (err) console.log("signup_error: ", err.stack); 
		if (result.length > 0) {
			res.json({success : 0});
		} else {

			
			var pubKey = forge.pki.publicKeyFromPem(pair.public);
			var sshpubKey = forge.ssh.publicKeyToOpenSSH(pubKey, data.uname+'@InfraGuard');
            data.publicKey = sshpubKey;
            data.privateKey = pair.private;
            data.shell = "/bin/bash";
            data.linuxName = data.uname;
            con.query("insert into users set ? ", data, function(err, result){
				if(err)console.log(err.stack);
				res.json({success : 1,key : pair.private });
			});

			//mailPrivateKey(pair.private);
		}
		
	});
}

function loginAction(req, res, data){
	if(con == null)
	con = db.openCon(con);
	con.query("SELECT * FROM users WHERE email = ? and is_deleted=0 ", data.email, function(err, result){
		if(err)console.log("select error: ", err.stack);
		if (result.length > 0) {
			var passwValid = bcryptPassw.compareHash(data.passw, result[0].passw);
			if(passwValid){
				if(result[0].mfaEnabled == 0){
                                    req.session.email=result[0].email;
                                    req.session.uid = result[0].id;
                                    req.session.passw = result[0].passw;
                                    req.session.groupId = result[0].groupId;
                                }else{
                                    req.session.uid = result[0].id;
                                    req.session.passw = result[0].passw;
                                }
                                var current_time = Math.floor(Date.now() / 1000);
                                con.query("Update users set lastlogin = ? WHERE id = ? ", [current_time,result[0].id], function(err, result){
                                });
				var data1 = {success: 1 , uname : result[0].uname, email : result[0].email, mfa : result[0].mfaEnabled};
				res.status(200).json(data1);
			} else {
				res.status(200).json({success : 0, error : "email/password not valid"});
			}

		} else {
			res.status(200).json({success : 0, error : "email/password not valid"});
		}
		//con.destroy();
	});
}

function getUserData(req, res){
	if(con == null)
	con = db.openCon(con);
	var obj = {};
        var group_id_string = "";
        var project_id_string = "";
	obj.userdata = null;
	obj.companydata = null;
	obj.projectdata = null;
        obj.serverdata = null;
	Promise.all([
	
		new Promise((resolve, reject) => {
			con.query("SELECT u.*,r.roleName FROM users u left join roles r on (u.roleId = r.id) WHERE (email = ? )", [req.session.email], function(err, result){
				if(err)console.log(err.stack);
				if (result.length > 0) {
					resolve(result[0]);
				}
			  resolve(null);
			});
		}),
		
		new Promise((resolve, reject) => {
                    var sql_group = "select group_id from user_groups where is_deleted=0 and user_id="+req.session.uid;
                    con.query(sql_group,'0', function(err, result){
                        if(err){
                            console.log(err.stack);
                        }else{
                         if(result.length>0){
                           for (var i = 0, l = result.length; i < l; i++)
                                  group_id_string += result[i].group_id + ",";
                                  group_id_string = group_id_string.substr(0,group_id_string.length-1);
                           }else{
                               group_id_string ="0";
                           }    
                        }
                    var sql ="select cd.* from companydetails cd where cd.is_deleted=0 and cd.companyCreator= "+req.session.uid+" union select cd.* from companydetails cd inner join group_company_project gcp on (cd.id=gcp.compnay_id and cd.is_deleted=0 and gcp.is_deleted=0 ) where gcp.group_id in ("+group_id_string+") group by cd.id";
//			con.query("SELECT * FROM companydetails WHERE companyCreator = ? and is_deleted=0 ", [req.session.uid], function(err, result){
                        con.query(sql,'0', function(err, result){
                            if(err){
                                console.log(err.stack);
                            }else{
                                if(result.length > 0){
                                 resolve(result);
                                }
                                 resolve(null);
                            }
			});
                        });
		}),

		new Promise((resolve, reject) => {
                     var sql_group = "select group_id from user_groups where is_deleted=0 and user_id="+req.session.uid;
                     var group_id_string = "";
                      con.query(sql_group,'0', function(err, result){
                        if(err){
                            console.log(err.stack);
                        }else{
                         if(result.length>0){
                           for (var i = 0, l = result.length; i < l; i++)
                                  group_id_string += result[i].group_id + ",";
                                  group_id_string = group_id_string.substr(0,group_id_string.length-1);
                           }else{
                               group_id_string ="0";
                           }   
                        }
                        var sql = "SELECT c.*,p.*,p.id as project_id  FROM companydetails c INNER JOIN projectdetails p ON c.id = p.company_id WHERE c.companyCreator = "+req.session.uid+" and c.is_deleted=0 and p.is_deleted=0 union select c.*,p.*,p.id as project_id from companydetails c Inner Join projectdetails p  inner join group_company_project gcp on (c.id=p.company_id and  c.id=gcp.compnay_id and p.id =gcp.project_id and c.is_deleted=0 and gcp.is_deleted=0 and p.is_deleted=0 and gcp.group_id in ("+group_id_string+"))";
			//con.query("SELECT * FROM companydetails c INNER JOIN projectdetails p ON c.id = p.company_id WHERE c.companyCreator = ? and is_deleted=0 ", [req.session.uid], function(err, result){
                          con.query(sql,'0', function(err, result){
				if(err){
                                   console.log(err.stack);
                                }else{
                                    if(result.length > 0){
                                        for (var i = 0, l = result.length; i < l; i++)
                                       project_id_string += result[i].project_id + ",";
                                       project_id_string = project_id_string.substr(0,project_id_string.length-1);
                                     resolve(result);
                                    }
                                    resolve(null);
                                }
                                req.session.project_id_string = project_id_string;
			});
                     });
		}),
                new Promise((resolve, reject) => {
			con.query(" SELECT s.id as serverId,p.company_id,s.project_id,(select status from ssm_alive_history where id=max(ssm.id)) as ssm_status FROM projectdetails p INNER JOIN servers s ON p.id = s.project_id left join ssm_alive_history ssm on (s.id=ssm.server_id)  group by s.id", function(err, result){
				if(err){
                                   console.log(err.stack);
                                }else{
                                    if(result.length > 0){
                                     resolve(result);
                                    }
                                    resolve(null);
                                }
			});
		})
		
	]).then(function(results){
		obj.userdata = results[0];
		obj.companydata = results[1];
		obj.projectdata = results[2];
                obj.serverdata = results[3];
		res.status(200).json(obj);
	});
	
}
function CheckSSMStatusBycustomer(result,creds,req,res,check){
    var AWS = require('aws-sdk');
    if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
           apiVersion: '2014-11-06',
           region : result.region
        });
    }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
    }
    var instance_array = result.instanceList.split(",");
    var instances = [];
    var instancesWithServer = [];
    for(var i=0;i<instance_array.length;i++){
       var data =  instance_array[i].split("##");
       instances[i]=data[0];
       instancesWithServer[data[0]] =  data[1];
    }
    var params = {
          Filters: [
            {
              Key: 'InstanceIds', 
              Values: instances
            }
          ]
    }
    ssm.describeInstanceInformation(params, function(err, data){
        if(err){
            console.log(err, err.stack);
            updateCustomerStatus(req,res,err,'error');
        }else{
            console.log(data);
            updateCustomerStatus(req,res,data,'success',instancesWithServer);
            if(check=="sendResponse"){
              console.log("I am in it");
              var sql = "select distinct s.*,p.projectName,c.companyName,c.id as company_id,(select s.status from ssm_alive_history s where id=max(ssm.id)) as status,(select s.raw_data from ssm_alive_history s where id=max(ssm.id)) as instance_raw_data from servers s left join projectdetails p on (s.project_id=p.id) left join companydetails c on (p.company_id=c.id) left join ssm_alive_history ssm on (ssm.server_id=s.id) inner join customers cc on (s.customerIAMId=cc.id) where s.customerIAMId= "+req.body.customer_id+" group by s.id order by s.serverName ASC,ssm.id desc"
              con.query(sql, function(error, results){
                  res.json({success : 1,projectInstance:results});  
              });
            }
        }
    }); 
}
function updateCustomerStatus(req,res,data,output,instancesWithServer){
   if(con == null)
    con = db.openCon(con);
    var current_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var ping_status = "";
    if(output=="error"){
        ping_status = "Error";
        res.json({success : 1});  
    }else{
        var j=0;
        for(var i=0; i < data['InstanceInformationList'].length;i++ ){
            var raw_data_output = JSON.stringify(data['InstanceInformationList'][i]);
            if(data['InstanceInformationList'][i] =="" || data['InstanceInformationList'][i] ==null){
                ping_status = 'Error';
            }else{
                ping_status = data['InstanceInformationList'][i].PingStatus;
                var record = {
                  server_id:instancesWithServer[data['InstanceInformationList'][i].InstanceId],
                  server_ip:'',
                  status :ping_status,
                  last_run_time : current_time,
                  raw_data : raw_data_output
              }
                var sql = "select max(s.id) as id from ssm_alive_history s inner join servers ss on (ss.id=s.server_id) where ss.instanceId = '"+data['InstanceInformationList'][i].InstanceId+"'";
                con.query(sql, function(e,r){
                    j++;
                    if(r.length > 0 && r[0].id !=null){
                        var update_sql = "update ssm_alive_history s set s.status='"+ping_status+"' , s.last_run_time='"+current_time+"',s.raw_data='"+raw_data_output+"' where s.id="+r[0].id;
                        console.log(update_sql);
                        con.query(update_sql, function(err, result){
                        });
                    }else{
                        con.query("insert into ssm_alive_history set ?", [record], function(err, result){
                        });
                    }
                }); 
            }
        }
    }
}
function serverDetailsSendCommand(req,res,result,creds){
    if(req.body.pid !=undefined){
       var killProcess = 'kill '+req.body.pid;
    }else{
       var killProcess = '';
    }
    if(result.platform=='Windows'){
         platform ='W';
         document ='AWS-RunPowerShellScript';
         paramsCommand = {
             DocumentName: document,
             InstanceIds: [ result.instanceId ],
             Parameters: {
                     "commands":["Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.totalvisiblememorysize}","Get-WmiObject Win32_OperatingSystem | %{'{0}' -f $_.freephysicalmemory}","Get-WmiObject Win32_Processor | Select-Object -expand LoadPercentage",'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"',"fsutil volume diskfree c:","Get-Process | Sort-Object -Descending -Property CPU | Select-Object -First 20", "Get-Process | Sort-Object -Descending -Property VM | Select-Object -First 20"]
                  }
         };
    }else{
         platform ='L';
         document ='AWS-RunShellScript';
         paramsCommand = {
             DocumentName: document,
             InstanceIds: [ result.instanceId ],
             Parameters: {
                     "commands":[''+killProcess+'',"pwd","df -h | awk '$NF==\"/\"'","grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage \"%\"}'","free -m|awk 'NR==2'","cat /etc/os-release | head -2 | xargs -n2 -d'\n'","free -m|awk 'NR==3'","ps aux | sort -nrk 4 | head -15","ps aux | sort -nrk 3 | head -15"]
             }
          };
     }
     var AWS = require('aws-sdk');
     if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region
        });
     }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
     }
     ssm.sendCommand(paramsCommand, function(err, data){
        if(err){
            console.log(err, err.stack);
            updateHomeDirectory(res,req.body.server_id,'N/A',platform);
            logger.error('Error in Send command');
            logger.error(err);
        }else{
            sleep(1000, function() {});
            serverGetCommandInvocation(data.Command.CommandId,result.instanceId,ssm,req,res,platform,killProcess);
        }
    });
}
function serverGetCommandInvocation(commandId,instanceId,ssm,req,res,platform,killProcess){
  var params1 = {
    CommandId: commandId,
    InstanceId: instanceId
  };
  ssm.getCommandInvocation(params1, function(err, data1){
    if(err){
       res.json({success : 0, err_desc : err});
    }else{ 
      if(data1.Status =="InProgress"){
         sleep(1000, function() {});
         serverGetCommandInvocation(commandId,instanceId,ssm,req,res,platform,killProcess); 
      }else{
         var command = killProcess+" Name of Process : "+req.body.pname;
         var command_output = data1.StandardOutputContent;
         if(data1.StandardOutputContent==""){
             command_output = "N/A";
         }
         if(killProcess != ""){
            addServerTrail("-1",req.body.server_id,commandId,data1.StandardOutputContent,command,req.session.uid);
        }
        updateHomeDirectory(res,req.body.server_id,command_output,platform);
      }
    }
  });  
}
 function automationExecution(results,instance){
   var AWS = require('aws-sdk');
   var sts = new AWS.STS({apiVersion: '2011-06-15'});
   var creds ;
   var params = {
      DurationSeconds: 3600,
      ExternalId: results.external_id,
      RoleArn: results.arn,
      RoleSessionName: "InfraGuard"
    };
   sts.assumeRole(params, function(err, data){
    if (err){
        console.log(err, err.stack);
    }
    creds = new AWS.Credentials({
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken
    });
    if (results.customerName == 'Right Cloud'){
        var ec2 = new AWS.EC2({
            apiVersion: '2016-11-15',
                    region : results.region
            });
    }else{
        var ec2 = new AWS.EC2({
            apiVersion: '2016-11-15',
                    region : results.region,
                    credentials : creds
            });
    }
    var params1 = {
        InstanceIds: [ results.instanceId]
    };
    if(instance == "start"){
        ec2.startInstances(params1, function(err, data){
        console.log(data);
            if (err){
             console.log(err, err.stack);
             logger.error('Error in start Instance');
             logger.error(err);
            }
        });
    }else{
        ec2.stopInstances(params1, function(err, data){
        console.log(data);
            if(err){
             console.log(err, err.stack);
             logger.error('Error in stop Instance');
             logger.error(err);
            }
        });
    }
  });
 }
function getGroupData(req, res){
	if(con == null)
	con = db.openCon(con);
	var obj = {};
	obj.userdata = null;
	obj.companydata = null;
	obj.projectdata = null;
	Promise.all([
		new Promise((resolve, reject) => {
			con.query("SELECT * FROM companydetails WHERE  is_deleted=0 ", '0', function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		}),

		new Promise((resolve, reject) => {
			con.query("SELECT * FROM companydetails c INNER JOIN projectdetails p ON c.id = p.company_id WHERE  c.is_deleted=0 and p.is_deleted=0 ", '0', function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		}),
                
                new Promise((resolve, reject) => {
			con.query("SELECT s.* FROM servers s INNER JOIN projectdetails p ON s.project_id = p.id ", '0', function(err, result){
				if(err)console.log(err.stack);
				if(result.length > 0){
					resolve(result);
				}
				resolve(null);
			});
		})
		
	]).then(function(results){
		obj.companydata = results[0];
		obj.projectdata = results[1];
                obj.serverdata = results[2];
		res.status(200).json(obj);
	});
	
}
function assumeRoleForServer(result,req,res,flag,callback){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var params = {
      DurationSeconds: 3600,
      ExternalId: result.external_id,
      RoleArn: result.arn,
      RoleSessionName: "InfraGuard"
    };
    var creds ;
    var document;
    if(result.platform=='Windows'){
        document ='AWS-RunPowerShellScript';
    }else{
        document ='AWS-RunShellScript';
    }
    sts.assumeRole(params, function(err, data){
       if(err){
            logger.error('Error in following instance id for assume role'+result.instanceId);
            logger.error(err);
       }else{
           creds = new AWS.Credentials({
                accessKeyId: data.Credentials.AccessKeyId, 
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            });
       }
       sendCommandForServer(result,document,creds,req,res,flag,function(random_data) {
            callback(random_data);
       })
       //sendCommandForServer(result,document,creds,req,res);
    });
}
function sendCommandForServer(result,document,creds,req,res,flag,callback){
    var script_string = req.body.script.replace(/\n/g, ",");  
    var command_array = script_string.split(",");
    var AWS = require('aws-sdk');
    if(result.customer_name =='Right Cloud'){
        var ssm = new AWS.SSM({
           apiVersion: '2014-11-06',
           region : result.region
        });
    }else{
        var ssm = new AWS.SSM({
            apiVersion: '2014-11-06',
            region : result.region,
            credentials : creds
        });
    }
    var params = {
        DocumentName: document,
        InstanceIds: [
           result.instanceId
        ],
        Parameters: { "commands":command_array }
    };
    ssm.sendCommand(params, function(err, data){
        if(err){
            logger.error('Error in following instance id for send command'+result.instanceId);
            logger.error(err);
        }else{
           sleep(1000, function() {});
           getCommandInvocationForServer(data.Command.CommandId,result.instanceId,ssm,req,res,result.serverId,flag, function(random_data) {
           callback(random_data);
           });
           //getCommandInvocationForServer(data.Command.CommandId,result.instanceId,ssm,req,res,result.serverId);
        }       
    });
}
function getCommandInvocationForServer(commandId,instanceId,ssm,req,res,serverId,flag,callback){
  var params1 = {
    CommandId: commandId,
    InstanceId: instanceId
  };
  ssm.getCommandInvocation(params1, function(err, data1){
    if(err){
       if(flag=="1"){
       }else{
           res.json({success : 0, err_desc : err});
       }
    }else{ 
      if(data1.Status =="InProgress"){
         sleep(1000, function() {});
         getCommandInvocationForServer(commandId,instanceId,ssm,req,res,serverId,flag,callback); 
      }else{
          addServerTrail(req.body.script_id,serverId,commandId,data1.StandardOutputContent,req.body.script,req.session.uid,null,flag);
          //console.log(data1.StandardOutputContent);
          if(req.body.script=="clear"){
               data1.StandardOutputContent="";
          }
          if(req.body.script!="clear" && data1.StandardOutputContent==""){
              var output = "Result for instance id "+instanceId+"\n"+data1.StandardErrorContent+"\n";
          }else{
              var output = "Result for instance id "+instanceId+"\n"+data1.StandardOutputContent+"\n";
          }
          callback(output);
      }
    }
  });  
  
}
function createMaintenanceWindow(req,res,creds,result){
  var AWS = require('aws-sdk');
  var ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region : result.region,
    credentials : creds
  });
  var params = {
    Resources: [ result.instanceId ],
    Tags: [
      {
        Key: 'Patching',
        Value:result.serverName
      },
    ]
};
ec2.createTags(params, function(err, data){
  if(err){
      console.log(err, err.stack);
  }else{
   if(result.customer_name =='Right Cloud'){
         var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result.region
         });
    }else{
        var ssm = new AWS.SSM({
             apiVersion: '2014-11-06',
             region : result.region,
             credentials : creds
         });
        var params = {
            AllowUnassociatedTargets: true, 
            Cutoff: req.body.cutOff, 
            Duration: req.body.duration, 
            Name: req.body.patchName,
            Schedule: req.body.cron
        };
        ssm.createMaintenanceWindow(params, function(err, data){
            if(err){
                console.log(err, err.stack);
                res.json({success : 0, err_desc : err});
            }else{
                console.log(data.WindowId);  
                var WindowId = data.WindowId;
                var params = {
                    ResourceType: "INSTANCE", 
                    Targets: [ 
                                {
                                  Key: 'InstanceIds',
                                  Values: [result.instanceId]
                                }
                    ],
                    WindowId: data.WindowId,
                    Description: req.body.patchName+" Description",
                    Name: req.body.patchName
              };
              ssm.registerTargetWithMaintenanceWindow(params, function(err, data) {
                  if(err){ 
                      console.log(err, err.stack);
                      res.json({success : 0, err_desc : err});
                  }else{
                      console.log(data); 
                      var targetId = data.WindowTargetId;
                      var params = {
                            MaxConcurrency: '1',
                            MaxErrors: '1',
                            ServiceRoleArn: result.service_arn,
                            Targets: [ 
                                {
                                  Key: 'InstanceIds',
                                  Values: [result.instanceId]
                                }
                            ],
                            TaskArn: 'AWS-RunPatchBaseline',
                            TaskType: 'RUN_COMMAND' ,
                            WindowId: WindowId,
                            LoggingInfo: {
                              S3BucketName: 'cf-templates-uvrcjjtj88fw-ap-southeast-1', /* required */
                              S3Region: 'ap-southeast-1'
                            },
                            Name:req.body.patchName,
                            Priority: 1,
                            TaskInvocationParameters: {
                              RunCommand: {
                                "Parameters": {
                                   "DocumentDescription" : ["Scans for or installs patches from a patch baseline."],
                                   "Operation" : [req.body.operationType]
                                 }
                              }
                            }
                          };
                          ssm.registerTaskWithMaintenanceWindow(params, function(err, data){
                            if(err){ 
                                console.log(err, err.stack);
                                res.json({success : 0, err_desc : err});
                            }else{
                                var obj = {
                                    server_id : req.body.serverId,
                                    patch_name:req.body.patchName,
                                    window_id: WindowId,
                                    task_id:targetId,
                                    target_id:targetId,
                                    cron:req.body.cron,
                                    duration:req.body.duration,
                                    cutoff:req.body.cutOff,
                                    operation_type:req.body.operationType,
                                }
                                con.query("insert into patching_log set ?", [obj], function(err, result){
                                if(err){
                                        res.json({success : 0, err_desc : err});
                                        return;
                                }else{
                                    res.json({success : 1, err_desc : err});
                                }
                             });
                           }
                        });
                  }
             });
          }
      });
    }
  }
});
}
function assumeRoleForStartInstances(req,res,result,flag){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var params = {
      DurationSeconds: 3600,
      ExternalId: result.external_id,
      RoleArn: result.arn,
      RoleSessionName: "InfraGuard"
    };
    var creds ;
    sts.assumeRole(params, function(err, data){
       if(err){
            logger.error('Error in following instance id for assume role'+result.instanceId);
            logger.error(err);
       }else{
           creds = new AWS.Credentials({
                accessKeyId: data.Credentials.AccessKeyId, 
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            });
            if(flag=="start"){
                startInstancesForProject(req,res,creds,result);  
            }else{
               stopInstancesForProject(req,res,creds,result);  
            }
       }
    });
}
function startInstancesForProject(req,res,creds,result){
      var AWS = require('aws-sdk');
      if(result.customer_name =='Right Cloud'){
          var ec2 = new AWS.EC2({
             apiVersion: '2016-11-15',
	     region : result.region
          });
      }else{
          var ec2 = new AWS.EC2({
             apiVersion: '2016-11-15',
             region : result.region,
             credentials : creds
          });
      }
      var params = {
         InstanceIds: [ result.instanceId]
      };
      ec2.startInstances(params, function(err, data){
        if(err){
          console.log(err, err.stack);
          logger.error('Error in start Instance');
          logger.error(err);
        }else{
          var sql = "update servers s set s.instance_flag=0 where s.id="+result.serverId;
          con.query(sql, function(error, results){
          });
        }
      });
    }
function stopInstancesForProject(req,res,creds,result){
      var AWS = require('aws-sdk');
      if(result.customer_name =='Right Cloud'){
          var ec2 = new AWS.EC2({
             apiVersion: '2016-11-15',
	     region : result.region
          });
      }else{
          var ec2 = new AWS.EC2({
             apiVersion: '2016-11-15',
             region : result.region,
             credentials : creds
          });
      }
      var params = {
         InstanceIds: [ result.instanceId]
      };
      ec2.stopInstances(params, function(err, data){
        if(err){
          console.log(err, err.stack);
          logger.error('Error in start Instance');
          logger.error(err);
        }else{
          var sql = "update servers s set s.instance_flag=1 where s.id="+result.serverId;
          con.query(sql, function(error, results){
          });
        }
      });
}

function createCronForServer(server_id,cron,req,res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var command_array =[];
    command_array[0] = "echo '"+cron+"' >> /var/spool/cron/root";
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [server_id], function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         
         sts.assumeRole(params, function(err, data){
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
                if(result[0].customer_name =='Right Cloud'){
                    var ssm = new AWS.SSM({
                       apiVersion: '2014-11-06',
                       region : result[0].region
                    });
                }else{
                    var ssm = new AWS.SSM({
                        apiVersion: '2014-11-06',
                        region : result[0].region,
                        credentials : creds
                    });
                }
                var params = {
                    DocumentName: document,
                    InstanceIds: [
                       result[0].instanceId
                    ],
                    Parameters: { "commands":command_array }
                };
                ssm.sendCommand(params, function(err, data){
                    if(err){ console.log(err, err.stack);res.json({success : 0, err_desc : err});}
                    else{
                       sleep(1000, function() {});  
                       CronCommandInvocation(data.Command.CommandId,result[0].instanceId,ssm,req,res);
                    }       
                });
            }
        });
    });
}
function deleteCronForServer(server_id,cron,req,res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var cron_url= cron.replace(/\*/g, "\\*");
    cron_url = cron_url.replace(/\//g, "\\/");
    var command_array =[];
    command_array[0] = "sed -i '/"+cron_url+"/d' /var/spool/cron/root";
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [server_id], function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         
         sts.assumeRole(params, function(err, data){
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
                if(result[0].customer_name =='Right Cloud'){
                    var ssm = new AWS.SSM({
                       apiVersion: '2014-11-06',
                       region : result[0].region
                    });
                }else{
                    var ssm = new AWS.SSM({
                        apiVersion: '2014-11-06',
                        region : result[0].region,
                        credentials : creds
                    });
                }
                var params = {
                    DocumentName: document,
                    InstanceIds: [
                       result[0].instanceId
                    ],
                    Parameters: { "commands":command_array }
                };
                ssm.sendCommand(params, function(err, data){
                    if(err){ console.log(err, err.stack);res.json({success : 0, err_desc : err});}
                    else{
                       sleep(1000, function() {});  
                       CronCommandInvocation(data.Command.CommandId,result[0].instanceId,ssm,req,res);
                    }       
                });
            }
        });
    });
}
function CronCommandInvocation(commandId,instanceId,ssm,req,res){
  var params1 = {
    CommandId: commandId,
    InstanceId: instanceId
  };
  ssm.getCommandInvocation(params1, function(err, data1){
    if(err){
       res.json({success : 0, err_desc : err});
    }else{
        console.log(data1);
      if(data1.Status =="InProgress"){
         sleep(1000, function() {});
         CronCommandInvocation(commandId,instanceId,ssm,req,res); 
      }else{
          res.json({success : 1, err_desc : err});
      }
    }
  });  
}
function editCronForServer(server_id,old_cron,new_cron,req,res){
    var AWS = require('aws-sdk');
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    var old_cron_url= old_cron.replace(/\*/g, "\\*");
    old_cron_url = old_cron_url.replace(/\//g, "\\/");
    var command_array =[];
    command_array[0] = "sed -i '/"+old_cron_url+"/d' /var/spool/cron/root";
    command_array[1] = "echo '"+new_cron+"' >> /var/spool/cron/root";
    if(con == null)
    con = db.openCon(con); 
    con.query("select cs.*,s.region,s.vpc_id,s.instanceId,s.platform from customers cs inner join servers s on(cs.id=s.customerIAMId) where s.id = ?", [server_id], function(err, result){
        var params = {
            DurationSeconds: 3600,
            ExternalId: result[0].external_id,
            RoleArn: result[0].arn,
            RoleSessionName: "InfraGuard"
           };
           console.log(result[0]);
         var creds ;
         var document;
         if(result[0].platform=='Windows'){
             document ='AWS-RunPowerShellScript';
         }else{
             document ='AWS-RunShellScript';
         }
         
         sts.assumeRole(params, function(err, data){
            if(err){ 
                if(err.code="CredentialsError"){
                    res.json({success : 0, err_desc : "IAM role in not configured for this server", creator: req.session.uid});
                } 
            }else{
                creds = new AWS.Credentials({
	            accessKeyId: data.Credentials.AccessKeyId, 
		    secretAccessKey: data.Credentials.SecretAccessKey,
		    sessionToken: data.Credentials.SessionToken
		});
                if(result[0].customer_name =='Right Cloud'){
                    var ssm = new AWS.SSM({
                       apiVersion: '2014-11-06',
                       region : result[0].region
                    });
                }else{
                    var ssm = new AWS.SSM({
                        apiVersion: '2014-11-06',
                        region : result[0].region,
                        credentials : creds
                    });
                }
                var params = {
                    DocumentName: document,
                    InstanceIds: [
                       result[0].instanceId
                    ],
                    Parameters: { "commands":command_array }
                };
                ssm.sendCommand(params, function(err, data){
                    if(err){ console.log(err, err.stack);res.json({success : 0, err_desc : err});}
                    else{
                       sleep(1000, function() {});  
                       CronCommandInvocation(data.Command.CommandId,result[0].instanceId,ssm,req,res);
                    }       
                });
            }
        });
    });
}


