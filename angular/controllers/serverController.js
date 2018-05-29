var app = angular.module("serverController", ['720kb.datepicker', 'angular-momentjs'])
        app.config(['$compileProvider', function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
        }]);
    app.controller("serverController", 
        function($scope, $http, $rootScope, companyService, $window, $timeout, $document) {

	$scope.visible = false;
	$scope.servers = "";
	$rootScope.listStatus = false;
	$rootScope.emailValid = true;
	$rootScope.userExist = true;
	$rootScope.userEmail = "";
	$rootScope.user_err_msg = "";
	$rootScope.privilege = "user";
	$rootScope.visible_server = false;
	$rootScope.visible_command = false;
	$rootScope.visibleLockdown = false;
	$rootScope.visibleUnlock = false;
	$rootScope.visibleProcessList = false;
	$rootScope.visibleGetAccessKey = false;
        $rootScope.searchBarAllowed = 0;
        $rootScope.modal_class = "modal-backdrop fade in loader";
        $rootScope.serverIds = [];
	
    $rootScope.server_err_msg = "";
	$scope.users = [];
	var serverName = "";
	var local_index = -1;
	var body = angular.element($document[0].body);
	var ip_addr = "";
	var user_obj = {};
	var emailPattern = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
    var mailUserCredentialsUrl="";
    var serverPageDetailsUrl="";
    $scope.createStyle={display:'none'};
    var sCount = true;
    $rootScope.clickAutomation = function () {
                    $rootScope.response = "";
                    $rootScope.Output = false;
                };
    $rootScope.clickUserLogs = function(){
                $http({
                    method: "post",
                    url: "/getServerUsersTrail",
                    data: {server_user_id: $rootScope.user_id},
                    headers: {"Content-Type": "application/json"}
                })
                        .success(function (data) {
                            $rootScope.userTrail = data;
                        });
    };
    $rootScope.assignTag= function (server_id,grouping_tags,tag_id){
        $rootScope.GroupTag = tag_id;
        $rootScope.grouping_tags = grouping_tags;
        $rootScope.server_id = server_id;
        $rootScope.assign_tag = $rootScope.assign_tag ? false : true;
        if($rootScope.assign_tag){
            body.addClass("overflowHidden");
            $rootScope.modal_class = "modal-backdrop fade in";
        } else {
            body.removeClass("overflowHidden");
            $rootScope.modal_class = "";
       }
    };
    $rootScope.setTag= function (tag_id,server_id){
        $rootScope.GroupTag = tag_id;
        $rootScope.server_id = server_id; 
    };
    $rootScope.selectedCustomer= function (value){  
         $rootScope.serverCustomer=value;
         $(".arn").css("display","none");
         $(".external").css("display","none");
         $("."+value+"_arn").css("display","block");
         $("."+value+"_external").css("display","block");
    };
    $rootScope.showjobModal = function () {
                $rootScope.visible_cronjob = $rootScope.visible_cronjob ? false : true;
                $rootScope.jobName = "";
                $rootScope.jobCommand = "";
                $rootScope.minute = "*";
                $rootScope.hour = "*";
                $rootScope.day_of_month = "*";
                $rootScope.month = "*";
                $rootScope.day_of_week = "*";
                $rootScope.errName = false;
                $rootScope.errCommand = false;
                $rootScope.cron_job_err_msg = "";
                if ($rootScope.visible_cronjob) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
    $rootScope.editjobModal = function (name, command, minute, hour, day_of_month, month, day_of_week, index) {
                $rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
                $rootScope.jobName = name;
                $rootScope.jobCommand = command;
                $rootScope.minute = minute;
                $rootScope.hour = hour;
                $rootScope.day_of_month = day_of_month;
                $rootScope.month = month;
                $rootScope.day_of_week = day_of_week;
                $rootScope.jobIndex = index;
                $rootScope.errName = false;
                $rootScope.errCommand = false;
                $rootScope.cron_job_err_msg = "";
                if ($rootScope.edit_cronjob) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
     $rootScope.deleteCronFromProjectModel = function(cron_id,server_job_name,server_id,server_ip,cron_details,index){
		$rootScope.delete_cron_from_project = $rootScope.delete_cron_from_project ? false : true;
                $rootScope.cronId=cron_id;
                $rootScope.serverId=server_id;
                $rootScope.cronDetails=cron_details;
                $rootScope.serverIp = server_ip;
                $rootScope.server_job_name = server_job_name;
                $rootScope.index =index;
                if ($rootScope.delete_cron_from_project) {
			body.addClass("overflowHidden");
			$rootScope.modal_class = "modal-backdrop fade in";
		}else {
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
	};
	$rootScope.showPass = function () {
                $rootScope.showPassword = true;
            };
            $rootScope.hidePass = function () {
                $rootScope.showPassword = false;
            };
    $rootScope.createProjectScriptModel = function (servers){
                $rootScope.serverArray = [];
                for(var x in servers){
                    $rootScope.serverArray.push(servers[x].id);
                }
                $rootScope.create_script = $rootScope.create_script ? false : true;
                $rootScope.scriptName = "";
                $rootScope.scriptDesc = "";
                $rootScope.script = "";
                $rootScope.create_script_err_msg = "";
                $rootScope.errName = false;
                $rootScope.errDesc = false;
                $rootScope.errScript = false;
                $rootScope.showParameter = false;
                $rootScope.parameters = [];
                if ($rootScope.create_script) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
    };
                $rootScope.deleteServerUser = function (username,server_user_id,server_id,user_index){
                user_obj = {};
		user_obj.uname = username;
		user_obj.serverId = server_id;
		user_obj.search = 1;
                user_obj.serveruserId = server_user_id;
                $rootScope.userIndex = user_index;
                $rootScope.delete_server_user = $rootScope.delete_server_user ? false : true;
		if($rootScope.delete_server_user) {
                   body.addClass("overflowHidden");
                   $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                   body.removeClass("overflowHidden");
                   $rootScope.modal_class = "";
               }
             }; 
             $rootScope.showRotateKeyModal = function (server_id,server_user_id,uname,uemail){
                        $rootScope.serverId =  server_id;
                        $rootScope.serverUserId =  server_user_id;
                        $rootScope.uname =  uname;
                        $rootScope.uemail =  uemail;
                        $rootScope.emailError = false;
                        $('#sendKey').prop('checked',true);
                        $rootScope.inputEmail = false;
                        if (uemail != ""){
                            $rootScope.Email = uemail;
                        }else {
                            $rootScope.Email = "";
                        }
                        $rootScope.server_rotate_key = $rootScope.server_rotate_key ? false : true;
                        if($rootScope.server_rotate_key) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
                };
                $rootScope.sendRotateKey = function(){
                    if ($('#sendKey').prop('checked') == false){
                            $rootScope.inputEmail = true;
                            $rootScope.emailError = false;
                        } else {
                            $rootScope.inputEmail = false;
                            if ($rootScope.uemail != ""){
                            $rootScope.Email = $rootScope.uemail;
                            } else {
                            $rootScope.Email = "";
                            }
                        }
                };
                $rootScope.downloadPrivateKeyModal = function (server_id, server_user_id, uname, privateKey) {
                        $rootScope.serverId = server_id;
                        $rootScope.serverUserId = server_user_id;
                        $rootScope.uname = uname;
			$rootScope.privateKey=privateKey;
                        var blob = new Blob([$rootScope.privateKey], { type: 'text/plain' }),
                        url = $window.URL || $window.webkitURL;
                        $rootScope.fileUrl = url.createObjectURL(blob);
                        $http({
                            method: "post",
                            url: "/DownloadKeyTrail",
                            data: {server_user_id: server_user_id, serverId: server_id},
                            headers: {"Content-Type": "application/json"}
                            })
                                .success(function (data) {
                                });
                };
                $rootScope.viewUserLogs = function(userId){
                    $('#tab5').prop("checked", true);
                    $http({
                    method: "post",
                    url: "/getServerUsersTrail",
                    data: {server_user_id: userId},
                    headers: {"Content-Type": "application/json"}
                })
                        .success(function (data) {
                            $rootScope.userTrail = data;
                        });
                };
               /* $rootScope.addParameter = function () {
                var text = $('#textArea').val();
                var lines = text.split(/\r|\r\n|\n/);
                var count = lines.length;
                if ($rootScope.scriptName != "" && $rootScope.scriptDesc != "" && $rootScope.script != "") {
                    if (count == 1) {
                        $rootScope.showParameter = true;
                        $rootScope.parameters.push({});
                        $rootScope.create_script_err_msg = "";
                    } else {
                        $rootScope.parameters.splice(0);
                        $rootScope.create_script_err_msg = "Parameters allowed only for one line script";
                    }
                } else {
                    $rootScope.create_script_err_msg = "Please fill all the details";
                }
            };
            $rootScope.deleteParameter = function (parIndex) {
                $rootScope.parameters.splice(parIndex, 1);
            }; */
    $rootScope.viewScript = function (script){
                $rootScope.script = script;
                $rootScope.view_script = $rootScope.view_script ? false : true;
                if ($rootScope.view_script){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
     };
     $rootScope.selectServer = function (serverId){
          var idx = $rootScope.serverIds.indexOf(serverId);
          if (idx == -1){
            $rootScope.serverIds.push(serverId);
          } else {
            $rootScope.serverIds.splice(idx, 1);
          }
     };
            $rootScope.runScriptForProject = function (servers, projectId, script_id, script_name, script, script_desc) {
                $rootScope.serverIds = [];
                $(".ck").prop("checked", false);
                $rootScope.servers = servers;
                $rootScope.projectId = projectId;
                $rootScope.scriptId = script_id;
                $rootScope.scriptName = script_name;
                $rootScope.script = script;
                $rootScope.scriptDesc = script_desc;
                $rootScope.commands = "";
                $rootScope.parameters = [];
                var lines = script.split(/\r|\r\n|\n/);
                var countScriptLine = lines.length;
                $http({
                    method: "POST",
                    url: "/getParameter",
                    data: {scriptId: script_id},
                    headers: {"Content-Type": "application/json"}
                }).success(function (data) {
                    $rootScope.parameterId = [];
                    $rootScope.parameterName = [];
                    for (var i = 0; i < data.length; i++) {
                        $rootScope.parameters.push({});
                        $rootScope.parameters[i].parameterName = data[i].name;
                        $rootScope.parameterId[i] = data[i].id;
                        $rootScope.parameterName[i] = data[i].name;
                    }
                    if (data.length > 0 && countScriptLine == 1) {
                        $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                        $rootScope.singleScript = $rootScope.script;
                        if ($rootScope.assign_parameter) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
                    } else {
                        $rootScope.serversToRunScript = $rootScope.serversToRunScript ? false : true;
                        if ($rootScope.serversToRunScript) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
                    }
                });
            };
     $rootScope.deleteScript = function(script_id, script_name, script_index){
            $rootScope.scriptId = script_id;
            $rootScope.scriptName = script_name;
            $rootScope.scriptIndex = script_index;
            $rootScope.delete_script = $rootScope.delete_script ? false : true;
                if ($rootScope.delete_script){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
        };
            $rootScope.scriptSchedule = function (script_id, project_id) {
                $rootScope.script_schedule = $rootScope.script_schedule ? false : true;
                $rootScope.scriptId = script_id;
                var scriptId = $rootScope.scriptId;
                $rootScope.projectId = project_id;
                $rootScope.minDate = new Date().toDateString();
                $rootScope.scriptDate = moment().format("MMM DD, YYYY");
                $rootScope.scriptTime = "";
                $rootScope.executedScripts = "";
                $rootScope.errDate = false;
                $rootScope.errTime = false;
                $rootScope.script_schedule_err_msg = "";
                $http({
                    method: "POST",
                    url: "/getScriptSchedule",
                    data: {scriptId: scriptId},
                    headers: {"Content-Type": "application/json"}
                }).success(function (data) {
                    if (data.length > 0) {
                        $rootScope.scriptDate = moment(data[0].automationDate).format('MMM D, YYYY');
                        $rootScope.scriptTime = moment(data[0].automationTime, "HH:mm:ss").format("HH:mm");
                        $rootScope.deleteScheduleScript = true;
                    } else {
                        $rootScope.deleteScheduleScript = false;
                    }
                });
                if ($rootScope.script_schedule) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
                $http({
                    method: "post",
                    url: "/getExecutedScripts",
                    data: {script_id: $rootScope.scriptId},
                    headers: {"Content-Type": "application/json"}
                })
                        .success(function (data) {
                            if (data.length > 0){
                                for (i=0;i<data.length;i++){
                            data[i].automationDate = moment(data[i].automationDate).format('MMM D, YYYY');
                            data[i].automationTime = moment(data[i].automationTime, "HH:mm:ss").format("HH:mm");
                                }
                            $rootScope.executedScripts = data;
                        }
                        });
            };
            $rootScope.deleteScriptSchedule = function () {
                $rootScope.modal_class = "";
                $rootScope.script_schedule = $rootScope.script_schedule ? false : true;
                body.removeClass("overflowHidden");
                $rootScope.delete_script_schedule = $rootScope.delete_script_schedule ? false : true;
                if ($rootScope.delete_script_schedule) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
      $rootScope.runScript = function (script_id,script_name,script,script_desc,projectId,serverIp){
                if(script_id=="0"){
                    script = $('.scriptToRun').val();
                    if(script==""){
                        alert("Please enter script to run.");
                        return false;
                    }
                }
                
                body.addClass("overflowHidden");
                $rootScope.modal_class = "modal-backdrop fade in loader";
                 $http({
                    method: "post",
                    url: "/runScriptForProject",
                    data: {script_id:script_id,script_name: script_name,script:script,serverIp:serverIp,projectId:projectId,script_desc:script_desc},
                    headers: {"Content-Type": "application/json"}
                 })
                    .success(function (data) {
                        $http({
                            method: "post",
                            url: "/getProjectTrail",
                            data: {project_id: projectId},
                            headers: {"Content-Type": "application/json"}
                        })
                        .success(function (data1) {
                            $rootScope.projectTrail = data1;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                            if(data.success==1){
                                if(script_id=="0"){
                                    $rootScope.responseCommand =data.response;
                                }else{
                                    $rootScope.response =data.response;
                                }
                            }else if (data.success==0){
                                if(script_id=="0"){
                                    $rootScope.responseCommand =data.err_desc;
                                }else{
                                    $rootScope.response =data.err_desc;
                                }
                            }
                        });
                    });
            };
    $rootScope.loginToServer = function (globalhost,serverId,companyId,instanceId,customerIAMId,agentVersion,region,globalHostname,vpcId){
        if(customerIAMId==null){
            alert("Login credentials are not assigned for this server. Please contact Administrator.");
            return;
        }
        if(agentVersion < 2){
            alert("SSH feature is not updated on this server. Please contact Administrator.");
            return;
        }
        if(instanceId == null){
            alert("Instance id is not updated on this server. Please contact Administrator.");
            return;
        }
        if(globalHostname == null){
            alert("Gloab hostname is not updated on this server. Please contact Administrator.");
            return;
        }
        if(region == null){
            alert("Region is not updated on this server. Please contact Administrator.");
            return;
        }
        if(vpcId == null){
            alert("VPC id is not updated on this server. Please contact Administrator.");
            return;
        }
        //$rootScope.modal_class = "modal-backdrop fade in loader";
        $http({
                method: "post",
                url: "/createSecurityGroup",
                data:{'serverId':serverId,'companyId':companyId , 'instanceId':instanceId},
                headers: {"Content-Type": "application/json"}
            })
            .success(function (data){
                if(data.success==1){
                    var code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    $http({
                            method: "post",
                            url: "/addLoginCode",
                            data:{'code':code},
                            headers: {"Content-Type": "application/json"}
                        })
                        .success(function (data){
                            if(data.success==1){
                                //$rootScope.modal_class="";
                               //$("#code").val(code);
                               //document.getElementById("myForm").submit();
                               //window.open("http://52.221.15.30:8080/index.php?c="+code);
                               window.open("http://"+globalhost+":5256/index.php?c="+code+"&id="+data.row_id);
                               //window.open("http://localhost/webconsole/webconsole.php?c="+code);
                            }
                     });
                }else{
                   $rootScope.modal_class="";
                   alert(data.err_desc); 
                }
         });
        
        
    };
    $rootScope.serverRotateKey = function(server_id){
			$rootScope.serverId = server_id;
                        $('#sendUpdateServerUsersKey').prop('checked',true);
			$rootScope.updateServerUsersKey = $rootScope.updateServerUsersKey ? false : true;
                        if ($rootScope.updateServerUsersKey) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
    };
                
    $rootScope.deleteServerGroupID = function (serverId){
        $http({
                method: "post",
                url: "/deleteSecurityGroup",
                data:{'serverId':serverId},
                headers: {"Content-Type": "application/json"}
            })
            .success(function (data){
                if(data.success==1){
                   alert("yes");
                }
         });
    };

    $scope.showOptions = function(index) {
		if(local_index != index){
			$scope.visible = false;
		}
		local_index = index;
		$scope.visible = $scope.visible ? false : true;
	};

 	var id = companyService.getId();
 	if(id==undefined){
 		id = $window.localStorage.getItem('projectId');
 		}
 	$window.localStorage.setItem('projectId', id);
    companyService.setId(null);

	var loadTime = 5000000, //Load the data every second
    errorCount = 0, //Counter for the server errors
    loadPromise; //Pointer to the promise created by the Angular $timeout service

	  var getData = function() {
	   
		 $http({
		 method : "post",
		 url : "/getServerPageDetails",
		 headers : {"Content-Type" : "application/json"},
		 data : {id : id}
		 })
//		$http({
//		method : "get",
//		url : serverPageDetailsUrl+"?id="+id,
//		})
		.success(function(data) {
			$scope.project = data.project;
			if(data.servers == null && sCount==true){
					$scope.createStyle={display:'block'};
					sCount=false;
				}
			$rootScope.liveServers = 0;
                        $rootScope.Tags = [];	
			for(var x in data.servers){
				var users = [];
				data.servers[x].users = [];
				if(data.servers[x].userList != null)
				users = data.servers[x].userList.toString().split(",");
				data.servers[x].users = users;
                                if(data.servers[x].ssm_status=='Alive' || data.servers[x].ssm_status=='Online'){
                                    $rootScope.liveServers++;
                                }
                                if($rootScope.Tags.indexOf(data.servers[x].tag_name) == -1){
                                    $rootScope.Tags.push(data.servers[x].tag_name);
                                }
			}
                        $rootScope.tagArray = [];
                        for(var y in $rootScope.Tags){
                            var arrayByTage = [];
                            for(var z in data.servers){
                                if(data.servers[z].tag_name == $rootScope.Tags[y]){
                                    arrayByTage.push(data.servers[z]);
                                }
                            }
                           $rootScope.tagArray[$rootScope.Tags[y]] = arrayByTage;
                        }
                            $scope.servers = data.servers;
                            for (var x in data.customerServers) {
                                var server = [];
                                data.customerServers[x].servers = [];
                                for (var y in data.servers) {
                                    if (data.servers[y].customerIAMId == data.customerServers[x].id) {
                                        server.push(data.servers[y]);
                                        data.customerServers[x].servers = server;
                                    }
                                }
                            }
                            $rootScope.customerServers = data.customerServers;
                            var server_id = [];
                            var serverId = "";
                            for (var x in data.servers){
                             server_id[x] = data.servers[x].id;   
                            }
                            serverId = server_id.toString();                    
                            $http({
                                method: "post",
                                url: "/getServerUserList",
                                data: {server_id: serverId, projectId: id},
                                headers: {"Content-Type": "application/json"}
                            })
                                .success(function (data) {
                                $rootScope.serverUserList = data;
                                $rootScope.serverUsers = {};
                                $rootScope.userid = [];
                                for (var z in $rootScope.serverUserList){
                                    $rootScope.userid[z] = $rootScope.serverUserList[z].id;
                                }
                                $rootScope.user_id = $rootScope.userid.toString();
                                var serverId = "";
                                var userName = [];
                                var userId = [];
                                var userEmail = [];
                                var userPrivateKey = [];
                                var userDetails = {};
                                $rootScope.value = {};
                                var j = 0;
                                for (var x in server_id){
                                   for (var y in data){
                                       if (server_id[x] == data[y].server_id){
                                           if (j < 5){
                                          serverId = server_id[x];
                                          userName[j] = data[y].username;
                                          userId[j] = data[y].id;
                                          userEmail[j] = data[y].email;
                                          userPrivateKey[j] = data[y].private_key;
                                          userDetails[j] = {"username":userName[j], "id" : userId[j], "email" : userEmail[j], "private_key" : userPrivateKey[j]};
                                          j++;
                                          $rootScope.serverUsers[serverId] = userDetails;
                                           } else {
                                               $rootScope.value[serverId] = 1;
                                           }
                                       }
                                   }
                                   userDetails = {};
                                   userId = [];
                                   userName = [];
                                   j = 0;
                                }
                            });
            
                        $rootScope.modal_class = "";
			if($scope.servers == null){
				$scope.servers = [];
			}
			errorCount = 0;
			nextLoad();
  		 });
                  
	  };

	  var cancelNextLoad = function() {
	    $timeout.cancel(loadPromise);
	  };

	  var nextLoad = function(mill) {
	    mill = mill || loadTime;
	    //Always make sure the last timeout is cleared before starting a new one
	    cancelNextLoad();
	    loadPromise = $timeout(getData, mill);
	  };

	  //Start polling the server by getData() first fetch url from properties file
	  $http.get('environment.properties').then(function (response) {
        mailUserCredentialsUrl = response.data.mailUserCredentialsUrl;
        serverPageDetailsUrl = response.data.serverPageDetailsUrl;
        getData();
        });
	  

	  //Always clear the timeout when the view is destroyed, otherwise it will keep polling
	  $scope.$on('$destroy', function() {
	    cancelNextLoad();
	  });
          
          $rootScope.downloadOutput = function (){
                var blob = new Blob([$rootScope.scriptOutput], {type: 'text/plain'}),
                url = $window.URL || $window.webkitURL;
                $rootScope.fileUrl = url.createObjectURL(blob);  
            };
            
	  $rootScope.close = function(value) {
	  	if(value == "user_ok"){
                        //var required_cond = $rootScope.emailForm.userEmail.$error.required;
			if ($rootScope.emailValid == true){
                            $rootScope.listStatus = false;
                            $rootScope.emailError = true;
                            $rootScope.emailValid = false;	
                            return;
			} else if ($rootScope.userEmail == "" || $rootScope.userEmail == undefined){
                            $rootScope.emailError = true;
                            return;
                        } else {
                            $rootScope.visible_add_user = $rootScope.visible_add_user ? false : true;
                            $rootScope.modal_class = "modal-backdrop fade in loader";
                            $http({
				url: "/addUserToServer",
				method: "POST",
				data: user_obj,
				headers: {"Content-Type": "application/json"}
                            })
                            .success(function(data){
                                if(data.success==1){
                                    alert("User has been added successfully.");
                                }else if(data.success==2){
                                    alert("Sorry! This user already exists.");
                                }else {
                                    alert("There is some error to add this user.Please try again.");
                                }
                                $rootScope.modal_class = "";
				//if(data.privateKey != undefined){
     				//email snippet here]
//     				if(user_obj.search ==2){
//     				var userCredentials = {uname : user_obj.user.uname, passw :user_obj.user.passw,email:user_obj.user.email,serverIp:ip_addr};
//						$http({
//					 	url : mailUserCredentialsUrl,
//					 	data : userCredentials,
//					 	method : "post",
//					 	headers: {'Content-Type': 'application/json'},
//					    }).success(function(data){
//					 	    });
//					}
    			//}
                            });
			}
		}
		else if(value == "user_cancel"){
			$rootScope.visible_add_user = $rootScope.visible_add_user ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
		else if(value == "deleteUserOk"){
                        $rootScope.modal_class = "";
                        $rootScope.visible_delete_user = $rootScope.visible_delete_user ? false : true;
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in loader";
			var required_cond = $rootScope.deleteUserForm.userName.$error.required;
			$rootScope.listStatus = false;
			$rootScope.users = [];
			if (required_cond == undefined) {
			$http({
				url: "/deleteUserFromServer",
				method: "POST",
				data: user_obj,
				headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
                                if(data.success==1){
                                    alert("User has been deleted successfully.");
                                }else{
                                    alert("There is some error to delete this user.Please try again.");
                                }
				$rootScope.modal_class = "";
			});

			}
			
		}
		else if(value == "deleteUserCancel"){
			$rootScope.visible_delete_user = $rootScope.visible_delete_user ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		} 
		else if(value == "serverLockdownCancel"){

			$rootScope.visibleLockdown = $rootScope.visibleLockdown ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
		else if(value == "serverLockdownOk"){
                        $rootScope.visibleLockdown = $rootScope.visibleLockdown ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                        $rootScope.modal_class = "modal-backdrop fade in loader";
			var data = {serverId: ip_addr};
			$http({
			url: "/lockDownServer",
			method: "POST",
			data: data,
			headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
                            $rootScope.modal_class = "";
                            if(data.success==1){
                                alert("Server Lockdown successfully.");
                                location.reload();
                            }else{
                                alert("There is some error to Lockdown server");
                            }
			});
		}
		else if(value == "serverUnlockCancel"){

			$rootScope.visibleUnlock = $rootScope.visibleUnlock ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
		else if(value == "serverUnlockOk"){
                        $rootScope.visibleUnlock = $rootScope.visibleUnlock ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                        $rootScope.modal_class = "modal-backdrop fade in loader";
			var data = {serverId: ip_addr};
			$http({
			url: "/unlockServer",
			method: "POST",
			data: data,
			headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
                            $rootScope.modal_class = "";
                            if(data.success==1){
                                alert("Server Lockdown successfully.");
                                location.reload();
                            }else{
                                alert("There is some error to Lockdown server");
                            }					
			});
		}
		else if(value == "privilegeOk"){
			var required_cond = $rootScope.privilegeForm.userName.$error.required;
			user_obj.userRole = $rootScope.privilege;
			if(required_cond == undefined) {
			$http({
				url: "/changeUserPrivilege",
				method: "POST",
				data: user_obj,
				headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
				if(data.success == 0){
					$rootScope.userExist = false;
				}
				else {
				$rootScope.visible_privilege = $rootScope.visible_privilege ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
				$rootScope.userExist = true;
				}
			});

			}
		}
		else if(value == "privilegeCancel"){
			$rootScope.visible_privilege = $rootScope.visible_privilege ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}

		else if(value == "server_cancel"){
				$rootScope.visible_server = $rootScope.visible_server ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		else if(value == "server_ok"){
					var sname = "";
					$rootScope.errName = false;
					sname = $rootScope.serverName;
					if(sname == undefined || sname.trim().length <= 0){
						$rootScope.errName = true;
						return;
					}else{
						$rootScope.errName = false;
						serverName = sname.trim();
						$rootScope.visible_server = false;
						body.removeClass("overflowHidden");
						$rootScope.modal_class = "";
						$scope.showCommandModal();
					}
				
			}
			else if(value == "command"){
				$rootScope.visible_command = $rootScope.visible_command ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
			else if(value == "processListCancel"){

			$rootScope.visibleProcessList = $rootScope.visibleProcessList ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
			}
			else if(value == "processListOk"){
	            $rootScope.visibleProcessList = $rootScope.visibleProcessList ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
				
			}else if(value == "getAccessKeyCancel"){

			$rootScope.visibleGetAccessKey = $rootScope.visibleGetAccessKey ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
			}
			else if(value == "getAccessKeyOk"){
				console.log(" ip_addr = : "+ip_addr);
	            $rootScope.visibleGetAccessKey = $rootScope.visibleGetAccessKey ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
				// call method to generate new access key-pair and update agentActivities
				$http({
				url: "/getAccessKey",
				method: "POST",
				data: {serverId:ip_addr,name:$rootScope.name},
				headers: {"Content-Type": "application/json"}
				})
				.success(function(data){
					
					

				});
			}
                        else if(value == "assign_cancel"){
			$rootScope.visibleAssignCustomer = $rootScope.visibleAssignCustomer ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                        }
                        else if(value == "assign_cutomer_ok"){
                                        $rootScope.errMsg = false;
					var serverId = "";
                                        var custId = "";
					serverId = $rootScope.serverId;
                                        custId = $rootScope.serverCustomer;
					if(custId == undefined || custId==""){
						$rootScope.errMsg = true;
						return;
					}else{
                                           $http({
                                                method: "POST",
                                                url: "/assignCustomer",
                                                data: {serverId: serverId, custId: custId},
                                                headers: {"Content-Type": "application/json"}
                                            }).success(function (data) {
                                                if (data.success == 1) {
                                                    $rootScope.visibleAssignCustomer = $rootScope.visibleAssignCustomer ? false : true;
                                                    body.removeClass("overflowHidden");
                                                    $rootScope.modal_class = "";
                                                    location.reload();
                                                } else if (data.success == 0) {
                                                    $rootScope.cust_err_msg = "Internal Error!";
                                                } else if (data.success == 2) {
                                                    $rootScope.cust_err_msg = data.err_desc;
                                                }
                                            });
					}
				
			} else if(value == "updateServerUsersKey_cancel"){
                            $rootScope.updateServerUsersKey = $rootScope.updateServerUsersKey ? false : true;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        } else if(value == "updateServerUsersKey_ok"){
                            var sendEmailStatus = $('#sendUpdateServerUsersKey').prop('checked');
                            $rootScope.updateServerUsersKey = $rootScope.updateServerUsersKey ? false : true;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                            $rootScope.key_rotate_msg = $rootScope.key_rotate_msg ? false : true;
                            if($rootScope.key_rotate_msg){
                                body.addClass("overflowHidden");
                                $rootScope.modal_class = "modal-backdrop fade in";
                            }else{
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            }
                            $http({
                            url: "/updateServerKeyForServer",
                            method: "POST",
                            data: {projectId: id, serverId : $rootScope.serverId, sendEmailStatus: sendEmailStatus},
                            headers: {"Content-Type": "application/json"}
                            })
                            .success(function(data){
                            });
                        } else if(value == "key_rotate_close"){
                            $rootScope.key_rotate_msg = $rootScope.key_rotate_msg ? false : true;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        } else if (value == "create_script_cancel") {
                            $rootScope.create_script = $rootScope.create_script ? false : true;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        } else if (value == "create_script_ok") {
                            var script_name = $rootScope.scriptName;
                            var script_desc = $rootScope.scriptDesc;
                            var script = $rootScope.script;
                            $rootScope.errName = false;
                            $rootScope.errDesc = false;
                            $rootScope.errScript = false;
                            var count = 0;
                            var parameter = [];
                            var scr = script;
                            var regex = /[!@#$%^&*(),.?":{}|<> ]/;
                            for (var i = 0; script.length > i; i++) {
                                if (script.charAt(i) == '$') {
                                    ++count;
                                }
                            }
                            for (var i = 0; i < count; i++) {
                                scr = scr.substring(scr.indexOf("$") + 1);
                                if (scr.match(regex)) {
                                    parameter[i] = scr.substring(0, scr.indexOf(scr.match(regex)));
                                } else if (scr != "") {
                                    parameter[i] = scr;
                                }
                            }
                           /* var text = $('#textArea').val();
                            var lines = text.split(/\r|\r\n|\n/);
                            var countScriptLine = lines.length; */
                            if (script_name == "" || script_name == undefined) {
                                $rootScope.errName = true;
                                return false;
                            } else if (script_desc == "" || script_desc == undefined) {
                                $rootScope.errDesc = true;
                                return false;
                            } else if (script == "" || script == undefined) {
                                $rootScope.errScript = true;
                                return false;
                            } else {
                                $rootScope.errName = false;
                                $rootScope.errDesc = false;
                                $rootScope.errScript = false;
                                $http({
                                    method: "POST",
                                    url: "/createScript",
                                    data: {script_name: script_name, script_desc: script_desc, script: script,project_id:id,serverIds:$rootScope.serverArray, parameter:parameter},
                                    headers: {"Content-Type": "application/json"}
                                }).success(function (data) {
                                    if (data.success == 1) {
                                        var result_data = {script_name: script_name, script_desc: script_desc.trim(), id: data.row_id, script: script};
                                        $rootScope.projectTop10Script.unshift(result_data);
                                        $rootScope.create_script = $rootScope.create_script ? false : true;
                                        body.removeClass("overflowHidden");
                                        $rootScope.modal_class = "";
                                    } else if (data.success == 0) {
                                        $rootScope.create_script_err_msg = "Internal Error!";
                                    } else if (data.success == 2) {
                                        $rootScope.create_script_err_msg = data.err_desc;
                                    }
                                });
                            }
                }else if(value == "close_view_script"){
                                $rootScope.view_script = $rootScope.view_script ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
               }else if (value == "assign_parameter_cancel") {
                    $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "assign_parameter_ok"){
                        $rootScope.commands = [];
                        for (var i = 0; i < $rootScope.parameters.length; i++) {
                            $rootScope.commands[i] = $rootScope.parameters[i].commandName;
                            if ($rootScope.commands[i] != undefined) {
                                $rootScope.script = $rootScope.script.replace("$" + $rootScope.parameters[i].parameterName, $rootScope.commands[i]);
                            } else {
                                $rootScope.script = $rootScope.script.replace("$" + $rootScope.parameters[i].parameterName, "");
                            }
                        }
                        $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                        $rootScope.serversToRunScript = $rootScope.serversToRunScript ? false : true;
                        if ($rootScope.serversToRunScript) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
                }else if(value == "delete_script_cancel"){
                                $rootScope.delete_script = $rootScope.delete_script ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                        }else if(value == "delete_script_ok"){
                                var scriptId = "";
                                $rootScope.delete_script_err_msg = "";
                                scriptId = $rootScope.scriptId;
                                    if (scriptId == undefined) {
                                   $rootScope.delete_script_err_msg = "Internal Error!";
                                   return;
                               } else {
                                   $rootScope.delete_script_err_msg = "";
                                   $http({
                                       method: "POST",
                                       url: "/deleteScript",
                                       data: {scriptId: scriptId},
                                       headers: {"Content-Type": "application/json"}
                                   }).success(function (data) {
                                       if (data.success == 1) {
                                           $rootScope.delete_script = $rootScope.delete_script ? false : true;
                                           $rootScope.projectTop10Script.splice($rootScope.scriptIndex, 1);
                                           body.removeClass("overflowHidden");
                                           $rootScope.modal_class = "";
                                       } else if (data.success == 0) {
                                           $rootScope.delete_script_err_msg = "Internal Error!";
                                       } else if (data.success == 2) {
                                           $rootScope.delete_script_err_msg = data.err_desc;
                                       }
                                   });
                               }
                                } else if (value == "script_schedule_cancel") {
                                    $rootScope.script_schedule = $rootScope.script_schedule ? false : true;
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "";
                                } else if (value == "script_schedule_save") {
                                    var project_id = $rootScope.projectId;
                                    var script_id = $rootScope.scriptId;
                                    var test_time = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test($rootScope.scriptTime);
                                    var script_time = $rootScope.scriptTime;
                                    var script_date = $rootScope.scriptDate;
                                    $rootScope.newDate = moment(script_date).format('YYYY-MM-DD');
                                    var new_date = $rootScope.newDate;
                                    $rootScope.errDate = false;
                                    $rootScope.errTime = false;
                                    $rootScope.script_schedule_err_msg = "";
                                  if (script_date == "" || script_date == undefined) {
                                    $rootScope.errDate = true;
                                    return false;
                                } else if (script_time == "" || script_time == undefined) {
                                    $rootScope.errTime = true;
                                    return false;
                                } else if (!test_time) {
                                    $rootScope.script_schedule_err_msg = "Please add valid time";
                                    return false;
                                } else {
                                    $rootScope.errDate = false;
                                    $rootScope.errTime = false;
                                    $http({
                                        method: "POST",
                                        url: "/scriptSchedule",
                                        data: {new_date: new_date, script_time: script_time, script_id: script_id, project_id: project_id},
                                        headers: {"Content-Type": "application/json"}
                                    }).success(function (data) {
                                        if (data.success == 1) {
                                            $rootScope.script_schedule = $rootScope.script_schedule ? false : true;
                                            body.removeClass("overflowHidden");
                                            $rootScope.modal_class = "";
                                        } else if (data.success == 0) {
                                            $rootScope.script_schedule_err_msg = "Internal Error!";
                                        } else if (data.success == 2) {
                                            $rootScope.script_schedule_err_msg = data.err_desc;
                                        }
                                    });
                                }
                                } else if (value == "delete_script_schedule_cancel") {
                                    $rootScope.delete_script_schedule = $rootScope.delete_script_schedule ? false : true;
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "";
                                } else if (value == "delete_script_schedule_ok") {
                                    var script_id = $rootScope.scriptId;
                                    $rootScope.modal_class = "";
                                    $rootScope.delete_script_schedule = $rootScope.delete_script_schedule ? false : true;
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "modal-backdrop fade in loader";
                                    $http({
                                        method: "POST",
                                        url: "/deleteScriptSchedule",
                                        data: {script_id: script_id},
                                        headers: {"Content-Type": "application/json"}
                                    }).success(function (data) {
                                    $rootScope.modal_class = "";
                                    if (data.success == 1) {
                                    alert("Scheduler has been deleted successfully.");
                                } else{
                                    alert("some error has been occured. Please try again.");
                                }   
                                });
                                }else if(value == "user_delete_cancel"){
                                $rootScope.delete_server_user = $rootScope.delete_server_user ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                                }else if(value == "user_delete_ok"){
                                $rootScope.modal_class = "";
                                $rootScope.delete_server_user = $rootScope.delete_server_user ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "modal-backdrop fade in loader";
                                $rootScope.listStatus = false;
                                $rootScope.users = [];
                                if (required_cond == undefined) {
                                $http({
                                        url: "/deleteUserFromServer",
                                        method: "POST",
                                        data: user_obj,
                                        headers: {"Content-Type": "application/json"}
                                })
                                .success(function(data){
                                        if(data.success==1){
                                            $rootScope.serverUserList.splice($rootScope.userIndex , 1);
                                            alert("User has been deleted successfully.");
                                        }else{
                                            alert("There is some error to delete this user.Please try again.");
                                        }
                                        $rootScope.modal_class = "";
                                });

                                }
                                }else if(value=="rotate_key_cancel"){
                                $rootScope.server_rotate_key = $rootScope.server_rotate_key ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                                }else if(value=="rotate_key_ok"){
                                var sendEmailStatus = $('#sendKey').prop('checked');
                                var Email  = $rootScope.Email;
                                if (emailPattern.test(Email) == false && $('#sendKey').prop('checked') == true){
                                    $rootScope.emailError = true;
                                    return;
                                    }
                                $rootScope.modal_class = "";
                                $rootScope.server_rotate_key = $rootScope.server_rotate_key ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "modal-backdrop fade in loader";
                                $http({
                                 method: "post",
                                 url: "/serverKeyRotate",
                                 data: {serverId:$rootScope.serverId,serveruserId:$rootScope.serverUserId,uname:$rootScope.uname,uemail:Email,sendEmailStatus:sendEmailStatus},
                                 headers: {"Content-Type": "application/json"}
                              })
                               .success(function (data){
                                    $rootScope.modal_class = "";
                                    if(data.success==1){
                                        alert("key has been rotate successfully.");
                                    }else if (data.success==0){
                                        alert("There is some error to rotate key.Please try again.");
                                    }
                              });
                                } else if(value == "assign_tag_cancel"){
                                $rootScope.assign_tag = $rootScope.assign_tag ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
               }else if(value=="assign_tag_ok"){
                   $http({
                        method: "post",
                        url: "/setServerTag",
                        data:{'tag_id':$rootScope.GroupTag,'server_id':$rootScope.server_id},
                        headers: {"Content-Type": "application/json"}
                    })
                     .success(function (data){
                         $rootScope.assign_tag = $rootScope.assign_tag ? false : true;
                         body.removeClass("overflowHidden");
                         $rootScope.modal_class = "";
                       if(data.success==1){
                           location.reload();
                       }else{
                           alert("There is some error in tagging/grouping.");
                       }
                    });
               }else if(value == "trail_output_ok"){
			$rootScope.trail_output = $rootScope.trail_output ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "cronjob_cancel"){
			$rootScope.visible_cronjob = $rootScope.visible_cronjob ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if (value == "cronjob_ok") {
                    var job_command = "";
                    var job_name = "";
                    var minute = $rootScope.minute;
                    var hour = $rootScope.hour;
                    var day_of_month = $rootScope.day_of_month;
                    var month = $rootScope.month;
                    var day_of_week = $rootScope.day_of_week;
                    var servers = [];
                        for (var x in $scope.servers){
                            servers[x] = $scope.servers[x].id;
                        }
                    $rootScope.errName = false;
                    $rootScope.errCommand = false;
                    job_name = $rootScope.jobName;
                    job_command = $rootScope.jobCommand;
                    if (job_name == undefined || job_name.trim().length <= 0) {
                        $rootScope.errName = true;
                        return;
                    } else if (job_command == undefined || job_command.trim().length <= 0) {
                        $rootScope.errCommand = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errCommand = false;
                        $http({
                            method: "POST",
                            url: "/createProjectCron",
                            data: {job_name: job_name, job_command: job_command.trim(), minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week,servers:servers, projectId:id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {job_name: job_name, job_command: job_command.trim(), id: data.row_id, minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week};
                                $rootScope.CronJobs.push(result_data);
                                $rootScope.visible_cronjob = $rootScope.visible_cronjob ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.cron_job_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.cron_job_err_msg = data.err_desc;
                            }
                        });
                    }
                }       else if(value == "edit_cronjob_cancel"){
			$rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}       else if (value == "edit_cronjob_ok") {
                        var job_command = $rootScope.jobCommand;
                        var job_name = $rootScope.jobName;
                        var minute = $rootScope.minute;
                        var hour = $rootScope.hour;
                        var day_of_month = $rootScope.day_of_month;
                        var month = $rootScope.month;
                        var day_of_week = $rootScope.day_of_week;
                        var servers = [];
                        for (var x in $scope.servers){
                            servers[x] = $scope.servers[x].id;
                        }
                        $rootScope.modal_class = "";
                        $rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in loader";
                        $http({
                            method: "POST",
                            url: "/editProjectCron",
                            data: {job_name: job_name, job_command: job_command.trim(), minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week,servers:servers, projectId:id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            $rootScope.modal_class ="";
                            if (data.success == 1) {
                                var result_data = {job_name: job_name, job_command: job_command.trim(), id: data.row_id, minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week};
                                $rootScope.CronJobs.splice($rootScope.jobIndex, 1, result_data);
                            } else if (data.success == 0) {
                                $rootScope.cron_job_err_msg = "Internal Error!";
                                alert("Internal Error!");
                                var result_data = {job_name: job_name, job_command: job_command.trim(), id: data.row_id, minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week};
                                $rootScope.CronJobs.splice($rootScope.jobIndex, 1, result_data);
                            } else if (data.success == 2) {
                                $rootScope.cron_job_err_msg = data.err_desc;
                                alert(data.err_desc);
                            }
                        });
                }else if(value == "delete_cron_cancel"){
                                $rootScope.delete_cron_from_project = $rootScope.delete_cron_from_project ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                }else if(value == "delete_cron_from_project_ok"){
                            var cronId = "";
                            var cronDetails = "";
                            var serverIp = "";
                            var server_job_name = "";
                            cronId = $rootScope.cronId;
                            cronDetails = $rootScope.cronDetails;
                            serverIp= $rootScope.serverIp;
                            server_job_name = $rootScope.server_job_name;
                            $http({
				url: "/deleteCronFromProject",
				method: "POST",
				data: {cronId:cronId,projectId:id,cronDetails:cronDetails,serverIp:serverIp,server_job_name:server_job_name},
				headers: {"Content-Type": "application/json"}
				})
				.success(function(data){
                                    if (data.success == 1) {
                                        $rootScope.delete_cron_from_project = $rootScope.delete_cron_from_project ? false : true;
                                        $rootScope.CronJobs.splice($rootScope.index, 1);
                                        body.removeClass("overflowHidden");
                                        $rootScope.modal_class = "";
                                    } else if (data.success == 0) {
                                        $rootScope.cron_delete_err_msg = "Internal Error!";
                                    } else if (data.success == 2) {
                                        $rootScope.cron_delete_err_msg = data.err_desc;
                                    }
				});
                        }else if(value == "run_script_cancel"){
			$rootScope.serversToRunScript = $rootScope.serversToRunScript ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value=="run_script_ok"){
                    if($rootScope.serverIds==""){
                        alert("Please select at least one server.");
                        return false;
                    }
                    var run=[];
                    for (var i = 0; i < $rootScope.runCommandName.length; i++) {
                        run = $rootScope.runCommandName[i];
                        if(new RegExp('\\b' + run + '\\b').test($rootScope.script)){
                            alert( run+" command is not allowed to run.");
                            return false;
                        }
                    }
                    $rootScope.modal_class = "";
                    $rootScope.serversToRunScript = $rootScope.serversToRunScript ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    $http({
                       method: "post",
                       url: "/runScriptForMultiPleServes",
                       data: {script_id:$rootScope.scriptId,script_name: $rootScope.scriptName,script:$rootScope.script,projectId:$rootScope.projectId,script_desc:$rootScope.scriptDesc,serverIds:$rootScope.serverIds},
                       headers: {"Content-Type": "application/json"}
                    })
                    .success(function (data){
                        $rootScope.Output = true;
                        $rootScope.modal_class = "";
                        if(data.success==1){ 
                           $rootScope.response =data.response;
                           $rootScope.scriptOutput = data.response;
                        }
                    });
                }
	};


	$scope.showCommandModal = function() {
			$rootScope.visible_command = $rootScope.visible_command ? false : true;
			if ($rootScope.visible_command) {
				$rootScope.commandText = "bash <(wget -qO- https://raw.githubusercontent.com/agentinfraguard/agent/master/scripts/agentInstaller.sh --no-check-certificate) '"+serverName+"' "+ $scope.project.id+" "+"LicenseKey";
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
	};

	$scope.showServerModal = function() {
			$rootScope.visible_server = $rootScope.visible_server ? false : true;
			$rootScope.errName = false;
			$rootScope.serverName = "";
			$rootScope.server_err_msg = "";
			if ($rootScope.visible_server) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		};
		
	$scope.showUserModal = function(mode, ip ,server,customer) {
		
		ip_addr = ip;
		if (mode == "adduser") {
			$rootScope.visible_add_user = $rootScope.visible_add_user ? false : true;
		} else if(mode == "deleteuser"){
			$rootScope.visible_delete_user = $rootScope.visible_delete_user ? false : true;
		} else if(mode == "changeprivilege"){
			$rootScope.visible_privilege = $rootScope.visible_privilege ? false : true;
		} else if(mode == "serverLockdown"){
			$rootScope.visibleLockdown = $rootScope.visibleLockdown ? false : true;
		}else if(mode == "serverUnlock"){
			$rootScope.visibleUnlock = $rootScope.visibleUnlock ? false : true;
		}else if(mode == "processList"){
			$rootScope.visibleProcessList = $rootScope.visibleProcessList ? false : true;
		}else if(mode == "getAccessKey"){
			$rootScope.visibleGetAccessKey = $rootScope.visibleGetAccessKey ? false : true;
		}else if(mode == "assigncustomer"){
			$rootScope.visibleAssignCustomer = $rootScope.visibleAssignCustomer ? false : true;
                        $rootScope.serverId = ip_addr;
                        $rootScope.serverName = server;  
                        $rootScope.serverCustomer = customer; 
                        $(".arn").css("display","none");
                        $(".external").css("display","none");
                        $("."+customer+"_arn").css("display","block");
                        $("."+customer+"_external").css("display","block");
                        if ($rootScope.visibleAssignCustomer) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
		}
		
		$rootScope.errName = false;
		$rootScope.listStatus = false;
		$rootScope.userEmail = "";
		$rootScope.user_err_msg = "";
		$rootScope.userName = "";
		$rootScope.emailValid = false;
                $rootScope.emailError = false;
		$rootScope.userExist = true;
		if ($rootScope.visible_add_user || $rootScope.visible_delete_user || 
			$rootScope.visible_privilege || $rootScope.visibleLockdown || $rootScope.visibleUnlock) {
			body.addClass("overflowHidden");
			$rootScope.modal_class = "modal-backdrop fade in";
		}
		else {
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
	};

	$rootScope.showUsers = function(){
                $rootScope.emailError = false;
		var userEmail = "%" + $rootScope.userEmail + "%";
		var data = {email: userEmail};
		user_obj = {};
		user_obj.user = {};
		$http({
			url: "/showUsers",
			method: "POST",
			data: data,
			headers: {"Content-Type": "application/json"}
		})
		.success(function(data){
			if(data.length > 0 || $rootScope.emailValid == false){
                                $rootScope.emailValid = false;
				$rootScope.users = data;
				$rootScope.listStatus = true;
                                user_obj.search = 2;
				user_obj.serverId = ip_addr;
				user_obj.user.uname = $rootScope.userEmail;
				user_obj.user.linuxName = $rootScope.userEmail;
				if($rootScope.userEmail != undefined && $rootScope.userEmail.indexOf("@") > -1){
                                    user_obj.user.uname = $rootScope.userEmail.split("@")[0];
                                    user_obj.user.linuxName = $rootScope.userEmail.split("@")[0];
				}
				user_obj.user.email = $rootScope.userEmail;
				user_obj.user.passw = generatePassw(8, "#aA!");
				user_obj.user.shell = "/bin/bash";
				user_obj.user.userRegistration = "InfraGuard";
			}
			else {
				$rootScope.users = [];
				$rootScope.listStatus = false;
                                if ($rootScope.userEmail == undefined) {
                                    $rootScope.emailValid = false;
                                } else if(emailPattern.test($rootScope.userEmail) == false) {
                                    $rootScope.emailValid = true;
                                }
                        }
                        if (emailPattern.test($rootScope.userEmail)){
                            $rootScope.emailValid = false;
                        }
		});
	};

	$rootScope.showDeleteUsers = function(){
		var data = {serverId: ip_addr};
		user_obj = {};
		$rootScope.userExist = true;
		$http({
			url: "/showUsersOnServer",
			method: "POST",
			data: data,
			headers: {"Content-Type": "application/json"}
			
		})
		.success(function(data){
			if(data.length > 0){
				$rootScope.users = data;
				$rootScope.listStatus = true;
				user_obj.search = 2;
				user_obj.serverId = ip_addr;
				user_obj.uname = $rootScope.userName;
			}
			else{
				user_obj.search = 0;
				user_obj.serverId = ip_addr;
				user_obj.uname = $rootScope.userName;
			}
			
		});
		
	};

	$rootScope.showPrivilegeUsers = function(){
		var data = {serverIp: ip_addr};
		user_obj = {};
		$http({
			url: "/showPrivilegeUsers",
			method: "POST",
			data: data,
			headers: {"Content-Type": "application/json"}
			
		})
		.success(function(data){
			if(data.length > 0){
				$rootScope.users = data[0].userList.split(",");
				$rootScope.listStatus = true;
				user_obj.search = 2;
				user_obj.serverIp = ip_addr;
				user_obj.uname = $rootScope.userName;
				user_obj.userRole = $rootScope.privilege;
			}
			else{
				user_obj.search = 0;
				user_obj.serverIp = ip_addr;
				user_obj.uname = $rootScope.userName;
				user_obj.userRole = $rootScope.privilege;
			}
			
		});
		
	};

	$rootScope.setUser = function(user){
		$rootScope.listStatus = false;
		$rootScope.users = [];
		user_obj.user = user;
		user_obj.serverId = ip_addr;
		user_obj.search = 1;
		$rootScope.userEmail = user.email;
		if(emailPattern.test($rootScope.userEmail)){
			$rootScope.emailValid = true;
		}
		else{
			$rootScope.emailValid = false;	
		}

	};

	$rootScope.setDeleteUser = function(user,serveruserId){
		$rootScope.listStatus = false;
		$rootScope.users = [];
		$rootScope.userName = user;
		user_obj = {};
		user_obj.uname = user;
		user_obj.serverId = ip_addr;
		user_obj.search = 1;
                user_obj.serveruserId = serveruserId;

	};

	$rootScope.setPrivilegeUser = function(user){
		$rootScope.listStatus = false;
		$rootScope.users = [];
		$rootScope.userName = user;
		user_obj = {};
		user_obj.uname = user;
		user_obj.serverIp = ip_addr;
		var data = {uname: $rootScope.userName};
		$http({
			method: "POST",
			url: "/getUserEmail",
			data: data,
			headers: {"Content-Type":"application/json"}
		})
		.success(function(data){
			if(data != null){
			user_obj.userEmail = data;
			}else{
				user_obj.userEmail = "";
			}
		});

	};
         $rootScope.setServerId = function(id,ssm_status){
                if(ssm_status!="Alive" && ssm_status!="Online"){
                    alert("SSM is not running. Please start SSM to access server details.")
                    return false;
                }
                window.location ="#/serverDetails";
		companyService.setId(id);
	};
         $rootScope.setServerIp = function(id,agentVersion){
                if(agentVersion==1){
                   return;
                }else{
                   companyService.setId(id);
                   window.location = "#/ssh";
                }
	};
        $rootScope.setCompanyId = function(id){
             companyService.setId(id); 
         };
        $rootScope.getUserDetails = function(id){
            $window.localStorage.setItem('serverId', id);
            $rootScope.count = 1;
         };

         $rootScope.showOutputModel = function (script,script_output){
                $rootScope.trailScript = script;
                $rootScope.trailScriptOutput = script_output;
                $rootScope.trail_output = $rootScope.trail_output ? false : true;
                if($rootScope.trail_output){
                     body.addClass("overflowHidden");
                     $rootScope.modal_class = "modal-backdrop fade in";
                }else{
                     body.removeClass("overflowHidden");
                     $rootScope.modal_class = "";
                }
            };
        $rootScope.setProjectId = function(id) {
			companyService.setId(id);
		};
        $rootScope.checkSSMAgentStatus = function(server_id,server_ip,customer_id){
                $('.checkSSMStatus_'+server_id).attr("src","../images/refresh.gif");

                $http({
                    method: "post",
                    url: "/checkSSMStatus",
                    data: {server_id: server_id,server_ip:server_ip,customer_id:customer_id},
                    headers: {"Content-Type": "application/json"}
                })
                .success(function (data) {
                    if(data.success==1){
                       location.reload();
                    }
                 });
            };
	function generatePassw(size, mode) {
    var mask = '';
    if (mode.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (mode.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (mode.indexOf('#') > -1) mask += '0123456789';
    if (mode.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = size; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}
 $http({
                method: "post",
                url: "/getUserAcessElements",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.userElements = [];
                        for (var i = 0, l = data.length; i < l; i++) {
                            $rootScope.userElements[i.toString()] = data[i].policy_element_id;
                        }
                    });
            $http({
                method: "post",
                url: "/getLoginUserDetails",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.name = data[0].uname;
                        $rootScope.roleId = data[0].roleId;
                        $rootScope.roleName = data[0].roleName;
                    });

            $http({
                method: "post",
                url: "/getCustomers",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.customersData = data;
                    });
                       $http({
                method: "post",
                url: "/getProjectAutomationScripts",
                data: {project_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.projectTop10Script = data;
                    });
                    
                 $http({
                method: "post",
                url: "/getProjectTrail",
                data: {project_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.projectTrail = data;
                    });
                          $http({
                method: "post",
                url: "/getRunningCronJobsForProjects",
                data: {project_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.CronJobs = data;
                    });
                    
           $http({
                method: "post",
                url: "/getGroupingTags",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.groupingTags = data;
                    });
            $http({
                method: "post",
                url: "/getCommandName",
                headers: {"Content-Type": "application/json"}
            })
           .success(function (data) {
             $rootScope.runCommandName=[];
	     for (var i = 0; i < data.length; i++) {
	       $rootScope.runCommandName.push(data[i].commandName);
	     }
            });
    
    
    
});
