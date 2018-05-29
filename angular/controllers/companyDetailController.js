angular.module("companyDetailController", []).controller("companyDetailController", 
function($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
	$scope.visible = false;
    $rootScope.visible_project = false;
	$rootScope.errName = false;
    $rootScope.projectName = "";
	$rootScope.project_err_msg = "";
	$rootScope.modal_class = "";
	$rootScope.startServerKeyRotation = false;
	$rootScope.stopServerKeyRotation = false;
	$rootScope.updateServerKey = false;
	$rootScope.projectId = "";
        $rootScope.searchBarAllowed = 0;
        $rootScope.modal_class = "modal-backdrop fade in loader";
	var local_index = -1;
    var body = angular.element($document[0].body);
    var projectPageDetailsUrl="";
    $scope.createStyle={display:'none'};
    var pCount = true;

	var id = companyService.getId();
	if(id == undefined || id == null){
	 	id = $window.localStorage.getItem('companyId');
	 	}
 	$window.localStorage.setItem('companyId', id);

// server polling starts 

var loadTime = 5000000, //Load the data every second
    errorCount = 0, //Counter for the server errors
    loadPromise; //Pointer to the promise created by the Angular $timout service

	 var getData = function() {
	     $http({
		 method : "post",
		 url : "/getProjectPagedetails",
		 headers : {"Content-Type" : "application/json"},
		 data : {id : id}
		 }).
		
//		$http({
//		method : "get",
//		url : projectPageDetailsUrl+"?id="+id,
//		}).
		success(function(data) {
                        $rootScope.projectdata = data.projects;
			$scope.company_name = data.company.companyName;
			$scope.company_notes = data.company.companyNotes;
            
			if(data.projects == null && pCount==true){
					$scope.createStyle={display:'block'};
					pCount=false;
				}
                        

			for(var x in data.projects){
                        var servers = [];
                        var liveservers = [];
                        var i =0;
			data.projects[x].servers = [];
                        data.projects[x].Liveservers = [];
				for(var y in data.servers){
					if(data.servers[y].project_id == data.projects[x].id){
                                            if(data.servers[y].ssm_status=='Alive' || data.servers[y].ssm_status=='Online'){
                                                   liveservers.push(data.servers[y]);
                                             }
						servers.push(data.servers[y]);
						data.projects[x].servers = servers;
                                                data.projects[x].Liveservers = liveservers;
				    }
			    }
                            if ($rootScope.projectId !=""){
                                for (var z in servers){
                                    if (servers[z].project_id == $rootScope.projectId){
                                        $rootScope.servers[i] = servers[z];
                                        i++;
                                }
                            }
                        }
		    }
		    $scope.projects = data.projects;
                    $rootScope.modal_class = "";
			if($scope.projects == null){
				$scope.projects = [];
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
        projectPageDetailsUrl = response.data.projectPageDetailsUrl;
        getData();
        });
	  
	  //Always clear the timeout when the view is destroyed, otherwise it will keep polling
	  $scope.$on('$destroy', function() {
	    cancelNextLoad();
	  });

// server polling ends
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
        $rootScope.createScheduler = function(project_id){ 
            $rootScope.projectId = project_id;
            $rootScope.servers = [];
            getData();
            var servers = $rootScope.servers;
            $http({
		method : "POST",
		url : "/checkScheduler",
                data : {project_id :project_id},
		headers : {"Content-Type" : "application/json"}
	    }).
	    success(function(data){
                    $rootScope.schedulerData = data.data;
                    if(data.success==1){
                    var instanceFlagOn = 0;
                    var instanceFlagOff = 0;
                    for (var x in servers){
                        if (servers[x].instance_flag == 0){
                            instanceFlagOn++;
                        } else {
                            instanceFlagOff++;
                        }
                    }
                    if (instanceFlagOn > instanceFlagOff){
                        $('.instanceEdit').prop("checked", true);
                    } else {
                        $('.instanceEdit').prop("checked", false);
                    }
                    $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
                    $rootScope.stopInstanceTime = data.data[1].time;
                    $rootScope.stopInstanceDay = data.data[1].day;
                    $rootScope.startInstanceTime = data.data[0].time;
                    $rootScope.startInstanceDay = data.data[0].day;
                    $rootScope.sc1 = data.data[0].id;
                    $rootScope.sc2 = data.data[1].id;
                    if($rootScope.scheduler_editable){
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    }else{
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else{
                    var instanceFlagOn = 0;
                    var instanceFlagOff = 0;
                    for (var x in servers){
                        if (servers[x].instance_flag == 0){
                            instanceFlagOn++;
                        } else {
                            instanceFlagOff++;
                        }
                    }
                    if (instanceFlagOn > instanceFlagOff){
                        $('.instanceCreate').prop("checked", true);
                    } else {
                        $('.instanceCreate').prop("checked", false);
                    }
                    $rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
                    $rootScope.startInstanceDay= "Day";
                    $rootScope.stopInstanceDay= "Day";
                    $rootScope.startInstanceTime = "";
                    $rootScope.stopInstanceTime  = "";
                    if($rootScope.scheduler_visible){
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    }else{
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }                    
            });            
        };
        $rootScope.deleteScheduler = function(){
             $rootScope.modal_class = "";
             $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
             body.removeClass("overflowHidden");
             $rootScope.delete_scheduler = $rootScope.delete_scheduler ? false : true;
             if($rootScope.delete_scheduler){
                body.addClass("overflowHidden");
                $rootScope.modal_class = "modal-backdrop fade in";
            }else{
                body.removeClass("overflowHidden");
                $rootScope.modal_class = "";
            }
        };
        function Captcha(){
            var alpha = new Array(0,1,2,3,4,5,6,7,8,9);
            var i;
            for (i = 0; i < 6; i++) {
                var a = alpha[Math.floor(Math.random() * alpha.length)];
                var b = alpha[Math.floor(Math.random() * alpha.length)];
                var c = alpha[Math.floor(Math.random() * alpha.length)];
                var d = alpha[Math.floor(Math.random() * alpha.length)];
                var e = alpha[Math.floor(Math.random() * alpha.length)];
                var f = alpha[Math.floor(Math.random() * alpha.length)];
                var g = alpha[Math.floor(Math.random() * alpha.length)];
            }
            var code = a + ' ' + b + ' ' + ' ' + c + ' ' + d + ' ' + e + ' ' + f + ' ' + g;
            document.getElementById("mainCaptcha").value = code;
        }
        function removeSpaces(string){
            return string.split(' ').join('');
        }
        function StartMessage(){
                $rootScope.heading = "Start Instance";
                $rootScope.warningMsg = "This action will start all the servers in this project which will add cost to your bill. Do you want to continue ?";
                $rootScope.url = "startInstancesForProject";
                $rootScope.success_msg = "Instace has started successfully.";
                $rootScope.error_msg = "There is some error to start instances.";    
        }
        function StopMessage(){
                $rootScope.heading = "Stop Instance";
                $rootScope.warningMsg = "This action will stop all the servers in this project.If data is not backed up on EBS volume, it will be lost. Do you want to continue ?"; 
                $rootScope.url = "stopInstancesForProject"; 
                $rootScope.success_msg = "Instace has stoped successfully.";
                $rootScope.error_msg = "There is some error to stop instances.";                 
        }
        function StartStop(){
            $rootScope.start_stop_instance = $rootScope.start_stop_instance ? false : true;
                  if($rootScope.start_stop_instance){
                       body.addClass("overflowHidden");
                       $rootScope.modal_class = "modal-backdrop fade in";
                  }else{
                       body.removeClass("overflowHidden");
                       $rootScope.modal_class = "";
                  }
        }
        $rootScope.startStopInstance = function (){
                 Captcha();
                 document.getElementById('CaptchaInput').value ="";
                 $rootScope.warningMsg = "";
                 $rootScope.heading = ""; 
                 $rootScope.url = ""; 
                 $rootScope.success_msg = ""; 
                 $rootScope.error_msg = ""; 
                 $rootScope.captchError = false;
                if ($rootScope.schedulerData ==undefined){
                 $rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
                 $rootScope.modal_class = "";
                 if($('.instanceCreate').prop("checked") == true){
                     StartMessage();
                     StartStop();
                  }else{
                     StopMessage(); 
                     StartStop();
                  }
                } else {
                $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
                $rootScope.modal_class = "";
                if($('.instanceEdit').prop("checked") == true){
                      StartMessage();
                      StartStop();
                  }else{
                      StopMessage();
                      StartStop();
                  }
                }
             };
	$rootScope.setProjectId = function(id) {
		companyService.setId(id);
                $rootScope.pid = id;
	};
        $rootScope.setServerId = function(id,ssm_status){
                if(ssm_status!="Alive" && ssm_status!="Online"){
                    alert("SSM is not running. Please start SSM to access server details.")
                    return false;
                }
                window.location ="#/serverDetails";
		companyService.setId(id);
	};
	$rootScope.showServers = function(project_id) {
                    var src = $('.img_'+project_id).attr("src");
                    $('.hideDetails').attr("src","images/plus.png");
                    $('.hiderow').css("display","none");
                    if(src=="images/minus.png"){
                        $('.img_'+project_id).attr("src","images/plus.png");
                        $('.'+project_id).css("display","none");
                    }else{
                        $('.img_'+project_id).attr("src","images/minus.png");
                        $('.'+project_id).css("display","block");
                    }
	};	
	$rootScope.close = function(value) {
		if(value == "project_ok"){
			var pname = "";
                        var liveserverdata = [];
                        var serverdata = [];
			$rootScope.errName = false;
			pname = $rootScope.projectName;
			if(pname == undefined || pname.trim().length <= 0){
				$rootScope.errName = true;
				return;
			}else{
				$scope.errName = false;
				$http({
					method : "POST",
					url : "/createProject",
					data : {pname : pname.trim(), cid : companyService.getId()},
					headers : {"Content-Type" : "application/json"}
				}).
				success(function(data){
					if(data.success == 1){
						var result = {projectName: pname.trim(), id: data.row_id, company_id: companyService.getId(), Liveservers: liveserverdata, servers:serverdata};
						var companydata = $rootScope.companies;
						for(var x in companydata){
							var projects = companydata[x].projects;
							if(result.company_id == companydata[x].id){
								projects.push(result);
								companydata[x].projects = projects;
							}
						}
		 				$rootScope.companies = companydata;
                                                $scope.projects.push(result);
                                                $rootScope.visible_project = $rootScope.visible_project ? false : true;
						body.removeClass("overflowHidden");
						$rootScope.modal_class = "";
					}else if(data.success == 0){
						$rootScope.project_err_msg = "Internal Error!";
					}
					else if(data.success == 2){
						$rootScope.project_err_msg = data.err_desc;
					}
			   });
			}
		}else if(value == "edit_project_ok"){
			var pname = "";
                        var pid = "";
                        var liveserverdata = [];
                        var serverdata = [];
			$rootScope.errName = false;
			pname = $rootScope.projectName;
                        pid = $rootScope.projectId;
                        liveserverdata = $rootScope.liveserverdata;
                        serverdata = $rootScope.serverdata;
			if(pname == undefined || pname.trim().length <= 0){
				$rootScope.errName = true;
				return;
			}else{
				$scope.errName = false;
				$http({
					method : "POST",
					url : "/editProject",
					data : {pname : pname.trim(), cid : companyService.getId(),pid:pid},
					headers : {"Content-Type" : "application/json"}
				}).
				success(function(data){
					if(data.success == 1){
						var result = {projectName: pname.trim(), id: pid, company_id: companyService.getId(), Liveservers: liveserverdata, servers:serverdata};
						var companydata = $rootScope.companies;
						for(var x in companydata){
							var projects = companydata[x].projects;
							if(result.company_id == companydata[x].id){
								projects.push(result);
								companydata[x].projects = projects;
							}
						}
		 				$rootScope.companies = companydata;
                                                $scope.projects.splice($rootScope.projectIndex, 1, result);
                                                $rootScope.edit_project = $rootScope.edit_project ? false : true;
						body.removeClass("overflowHidden");
						$rootScope.modal_class = "";
					}else if(data.success == 0){
						$rootScope.project_err_msg = "Internal Error!";
					}
					else if(data.success == 2){
						$rootScope.project_err_msg = data.err_desc;
					}
			   });
			}
                        } else if (value == "delete_project_ok") {
                    var pid = "";
                    pid = $rootScope.projectId;
                    $http({
                        method: "POST",
                        url: "/deleteProject",
                        data: {pid: pid},
                        headers: {"Content-Type": "application/json"}
                    }).success(function (data) {
                        if (data.success == 1) {
                            $scope.projects.splice($rootScope.projectIndex, 1);
                            $rootScope.delete_project = $rootScope.delete_project ? false : true;
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        } else if (data.success == 0) {
                            $rootScope.project_err_msg = "Internal Error!";
                        } else if (data.success == 2) {
                            $rootScope.project_err_msg = data.err_desc;
                        }
                    });
                }
		else if(value == "project_cancel"){
			$rootScope.visible_project = $rootScope.visible_project ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "edit_project_cancel"){
			$rootScope.edit_project = $rootScope.edit_project ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "delete_project_cancel"){
			$rootScope.delete_project = $rootScope.delete_project ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "key_rotate_close"){
			$rootScope.key_rotate_msg = $rootScope.key_rotate_msg ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "scheduler_cancel"){
			$rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                }else if(value == "edit_scheduler_cancel"){
			$rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                }else if(value == "delete_scheduler_cancel"){
			$rootScope.delete_scheduler = $rootScope.delete_scheduler ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}else if(value == "instance_cancel"){
			$rootScope.start_stop_instance = $rootScope.start_stop_instance ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
                        if ($rootScope.schedulerData !=undefined){
                            if($rootScope.url=="startInstances"){
                                $('.instanceEdit').prop('checked', false);
                            } else {
                                $('.instanceEdit').prop('checked', true);
                            }
                        $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
                        $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            if($rootScope.url=="startInstances"){
                                $('.instanceCreate').prop('checked', false);
                            } else {
                                $('.instanceCreate').prop('checked', true);
                            }
                        $rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
                        $rootScope.modal_class = "modal-backdrop fade in";
                        }
		}else if(value=="scheduler_ok"){
                    $rootScope.modal_class = "";
                    $rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    var startDay = $rootScope.startInstanceDay;
                    var starttime = ($rootScope.startInstanceTime).split(":");
                    var startCron = "";
                    if(startDay =="Day"){
                         startCron = "cron(0 "+starttime[1]+" "+starttime[0]+" ? * * *)";
                    }else{
                        startCron = "cron(0 "+starttime[1]+" "+starttime[0]+" ? * "+startDay+" *)" ;
                    }
                    var stopDay = $rootScope.stopInstanceDay;
                    var stoptime = ($rootScope.stopInstanceTime).split(":");
                    var stopCron = "";
                    if(stopDay =="Day"){
                        stopCron = "cron(0 "+stoptime[1]+" "+stoptime[0]+" ? * * *)";
                    }else{
                        stopCron = "cron(0 "+stoptime[1]+" "+stoptime[0]+" ? * "+stopDay+" *)" ;
                    }
                    
                    $http({
                            method : "POST",
			    url : "/createScheduler",
                            data: {startCron : startCron,stopCron:stopCron,projectId :$rootScope.projectId,startDay:startDay,stopDay:stopDay,startTime :$rootScope.startInstanceTime,stopTime :$rootScope.stopInstanceTime},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been created successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }else if(value=="edit_scheduler_ok"){
                    $rootScope.modal_class = "";
                    $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    var startDay = $rootScope.startInstanceDay;
                    var starttime = ($rootScope.startInstanceTime).split(":");
                    var startCron = "";
                    if(startDay =="Day"){
                         startCron = "cron(0 "+starttime[1]+" "+starttime[0]+" ? * * *)";
                    }else{
                        startCron = "cron(0 "+starttime[1]+" "+starttime[0]+" ? * "+startDay+" *)" ;
                    }
                    var stopDay = $rootScope.stopInstanceDay;
                    var stoptime = ($rootScope.stopInstanceTime).split(":");
                    var stopCron = "";
                    if(stopDay =="Day"){
                        stopCron = "cron(0 "+stoptime[1]+" "+stoptime[0]+" ? * * *)";
                    }else{
                        stopCron = "cron(0 "+stoptime[1]+" "+stoptime[0]+" ? * "+stopDay+" *)" ;
                    }
                    
                    $http({
                            method : "POST",
			    url : "/editScheduler",
                            data: {startCron : startCron,stopCron:stopCron,projectId :$rootScope.projectId,startDay:startDay,stopDay:stopDay,startTime :$rootScope.startInstanceTime,stopTime :$rootScope.stopInstanceTime,mw1:$rootScope.mw1,mw2:$rootScope.mw2},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been edited successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }else if(value=="delete_scheduler_ok"){
                    $rootScope.modal_class = "";
                    $rootScope.delete_scheduler = $rootScope.delete_scheduler ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    $http({
                            method : "POST",
			    url : "/deleteScheduler",
                            data: {mw1 : $rootScope.mw1,mw2:$rootScope.mw2,projectId :$rootScope.projectId,sc1:$rootScope.sc1,sc2:$rootScope.sc2},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been deleted successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }else if(value=="instance_ok"){
                        $rootScope.captchError = false;
                        var string1 = removeSpaces(document.getElementById('mainCaptcha').value);
                        var string2 = removeSpaces(document.getElementById('CaptchaInput').value);
                        if(string1 != string2){
                           $rootScope.captchError =true;
                            return false; 
                        }else{
                                var serverId = [];
                                for (var x in $rootScope.servers){
                                    serverId[x] = $rootScope.servers[x].serverId;
                                }
                                serverId = serverId.toString();
                                $rootScope.start_stop_instance = $rootScope.start_stop_instance ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                                $rootScope.modal_class = "modal-backdrop fade in loader";
                                $http({
                                 method: "post",
                                 url: "/"+$rootScope.url,
                                 data: {serverIds:serverId},
                                 headers: {"Content-Type": "application/json"}
                              })
                                .success(function (data){
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "";
                                    if(data.flag==0){
                                        $('.instance').prop('checked', true);
                                    }else{
                                        $('.instance').prop('checked', false);
                                    }
                                    $rootScope.modal_class = "";
                                    if(data.success==1){
                                        alert($rootScope.success_msg);
                                    }else if (data.success==0){
                                        alert($rootScope.error_msg);
                                    }
                              });
                          }
                }else if(value=="schedule_task_ok"){
                     var startTimeValid = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test($rootScope.startInstanceTime);
                     var stopTimeValid = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test($rootScope.stopInstanceTime);
                     if(!startTimeValid){
                        alert("Please add valid start time");
                        return false;
                     }
                     if(!stopTimeValid) {
                        alert("Please add valid stop time");
                        return false;
                     }
                    $rootScope.modal_class = "";
                    $rootScope.scheduler_visible = $rootScope.scheduler_visible ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    var startDay = $rootScope.startInstanceDay;
                    var stopDay = $rootScope.stopInstanceDay;
                    $http({
                            method : "POST",
			    url : "/createSchedulerTask",
                            data: {projectId :$rootScope.projectId,startDay:startDay,stopDay:stopDay,startTime :$rootScope.startInstanceTime,stopTime :$rootScope.stopInstanceTime},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been created successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }else if(value=="edit_schedule_task_ok"){
                     var startTimeValid = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test($rootScope.startInstanceTime);
                     var stopTimeValid = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test($rootScope.stopInstanceTime);
                     if(!startTimeValid){
                        alert("Please add valid start time");
                        return false;
                     }
                     if(!stopTimeValid) {
                        alert("Please add valid stop time");
                        return false;
                     }
                    $rootScope.modal_class = "";
                    $rootScope.scheduler_editable = $rootScope.scheduler_editable ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    var startDay = $rootScope.startInstanceDay;
                    var stopDay = $rootScope.stopInstanceDay;
                    $http({
                            method : "POST",
			    url : "/editSchedulerTask",
                            data: {projectId :$rootScope.projectId,startDay:startDay,stopDay:stopDay,startTime :$rootScope.startInstanceTime,stopTime :$rootScope.stopInstanceTime,sc1:$rootScope.sc1,sc2:$rootScope.sc2},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been edited successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }else if(value="delete_schedule_task_ok"){
                    $rootScope.modal_class = "";
                    $rootScope.delete_scheduler = $rootScope.delete_scheduler ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                    $http({
                            method : "POST",
			    url : "/deleteScheduleTask",
                            data: {sc1:$rootScope.sc1,sc2:$rootScope.sc2},
			    headers : {"Content-Type" : "application/json"}
		    }).
		    success(function(data){
                        $rootScope.modal_class = "";
                        if(data.success=="1"){
                            alert("Scheduler has been deleted successfully.");
                        }else{
                            alert("some error has been occured. Please try again.");
                        }            
                    });
                }
		
	};

	$scope.showOptions = function(index) {
		if(local_index != index){
			$scope.visible = false;
		}
		local_index = index;
		$scope.visible = $scope.visible ? false : true;
	};

	$scope.showProjectModal = function() {
		$rootScope.visible_project = $rootScope.visible_project ? false : true;
		$rootScope.errName = false;
		$rootScope.projectName = "";
		$rootScope.project_err_msg = "";
		if ($rootScope.visible_project) {
			body.addClass("overflowHidden");
			$rootScope.modal_class = "modal-backdrop fade in";
		} else {
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
		}
	};

	$scope.showPopup = function(mode, projectId, projectName, projectIndex) {
		if (mode == "createProject") {
			$rootScope.visible_project = $rootScope.visible_project ? false : true;
			$rootScope.errName = false;
			$rootScope.projectName = "";
			$rootScope.project_err_msg = "";
			if ($rootScope.visible_project) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}else if (mode == "editProject") {
			$rootScope.edit_project = $rootScope.edit_project ? false : true;
			$rootScope.errName = false;
			$rootScope.projectName = projectName;
                        $rootScope.projectId = projectId;
                        $rootScope.projectIndex = projectIndex;
			$rootScope.project_err_msg = "";
                        $rootScope.liveServerdata = [];
                        $rootScope.serverdata = [];
                        var projectdata = $rootScope.projectdata;
                        for (var x in projectdata){
                            if (projectdata[x].id == projectId){
                                $rootScope.liveserverdata = projectdata[x].Liveservers;
                                $rootScope.serverdata = projectdata[x].servers;
                            }
                        }
			if ($rootScope.edit_project) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}else if (mode == "deleteProject") {
			$rootScope.delete_project = $rootScope.delete_project ? false : true;
                        $rootScope.projectId = projectId;
                        $rootScope.projectIndex = projectIndex;
			$rootScope.project_err_msg = "";
			if ($rootScope.delete_project) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}else if (mode == "startKeyAutoRotation"){
			$rootScope.projectId = projectId;
			$rootScope.startServerKeyRotation = $rootScope.startServerKeyRotation ? false : true;
                        if ($rootScope.startServerKeyRotation) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}else if (mode == "stopKeyAutoRotation") {
			$rootScope.projectId = projectId;
			$rootScope.stopServerKeyRotation = $rootScope.stopServerKeyRotation ? false : true;
                        if ($rootScope.stopServerKeyRotation) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}else if (mode == "updateServerKey") {
			$rootScope.projectId = projectId;
                        $('#sendUpdateServerKey').prop('checked',true);
			$rootScope.updateServerKey = $rootScope.updateServerKey ? false : true;
                        if ($rootScope.updateServerKey) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		}
    };

    $rootScope.popupClose = function(value) {
    	if(value == "startServerKeyRotation"){
			$rootScope.startServerKeyRotation = $rootScope.startServerKeyRotation ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
			$rootScope.projectId = "";
		} else if(value == "stopServerKeyRotation"){
			$rootScope.stopServerKeyRotation = $rootScope.stopServerKeyRotation ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
			$rootScope.projectId = "";
		} else if(value == "updateServerKey"){
			$rootScope.updateServerKey = $rootScope.updateServerKey ? false : true;
			body.removeClass("overflowHidden");
			$rootScope.modal_class = "";
			$rootScope.projectId = "";
		} 

    };

    $rootScope.popupOk = function(value) {
    	if(value == "startServerKeyRotation"){

    		$http({
			url: "/startServerKeyRotation",
			method: "POST",
			data: {projectId : $rootScope.projectId},
			headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
				if(data.success==1){
				 $rootScope.startServerKeyRotation = $rootScope.startServerKeyRotation ? false : true;
			     body.removeClass("overflowHidden");
			     $rootScope.modal_class = "";
				 $rootScope.projectId = "";
				}
			});
			
		} else if(value == "stopServerKeyRotation"){
			$http({
			url: "/stopServerKeyRotation",
			method: "POST",
			data: {projectId : $rootScope.projectId},
			headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
				console.log("data = : "+JSON.stringify(data));
				if(data.success==1){
				 $rootScope.stopServerKeyRotation = $rootScope.stopServerKeyRotation ? false : true;
				 body.removeClass("overflowHidden");
				 $rootScope.modal_class = "";
				 $rootScope.projectId = "";
				}
				
			});
		
		} else if(value == "updateServerKey"){
                        var sendEmailStatus = $('#sendUpdateServerKey').prop('checked');
                        $rootScope.updateServerKey = $rootScope.updateServerKey ? false : true;
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
			url: "/updateServerKeyForProject",
			method: "POST",
			data: {projectId : $rootScope.projectId, sendEmailStatus: sendEmailStatus},
			headers: {"Content-Type": "application/json"}
			})
			.success(function(data){
			});
		}
    };
    
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
});