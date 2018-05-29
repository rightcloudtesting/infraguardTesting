angular.module("companyCronController", []).controller("companyCronController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var local_index = -1;
            var id = companyService.getId();
            if(id == undefined || id == null){
	 	id = $window.localStorage.getItem('companyId');
	    }
 	    $window.localStorage.setItem('companyId', id);
            $rootScope.showjobModal = function () {
                $rootScope.visible_cronjob = $rootScope.visible_cronjob ? false : true;
                $rootScope.jobName = "";
                $rootScope.jobCommand = "";
                $rootScope.minute = "*";
                $rootScope.hour = "*";
                $rootScope.day_of_month = "*";
                $rootScope.month = "*";
                $rootScope.day_of_week = "*";
                if ($rootScope.visible_cronjob) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $scope.DeletejobModal = function(cron_job_id,cron_job_index){
               $rootScope.cron_job_id = cron_job_id;
               $rootScope.cron_job_index = cron_job_index;
               $http({
                    method: "post",
                    url: "/checkCronJobServers",
                    headers: {"Content-Type": "application/json"},
                    data: {cron_job_id:cron_job_id}
               }).success(function (data){
                   if(data.success==1){
                        $rootScope.delete_cron_job = $rootScope.delete_cron_job ? false : true;
                   }else{
                        $rootScope.delete_server_popup = $rootScope.delete_server_popup ? false : true;
                   }
                   if ($rootScope.delete_cron_job || $rootScope.delete_server_popup) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                   }else{
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                   }
                    
               });
            };
            $scope.showjobEditModal = function(id,name,command,minute,hour,day_of_month,month,day_of_week,server_job_name) {
			$rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
			$rootScope.errName = false;
                        $rootScope.errCommand = false;
                        $rootScope.cron_job_err_msg = "";
                        $rootScope.cronJobId = id;
			$rootScope.jobName = name;
                        $rootScope.jobCommand = command;
                        $rootScope.minute = minute;
                        $rootScope.hour = hour;
                        $rootScope.day_of_month = day_of_month;
                        $rootScope.month = month;
                        $rootScope.day_of_week = day_of_week;
                        $rootScope.server_job_name =server_job_name; 
			if ($rootScope.edit_cronjob){
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
            };
            $scope.showOptions = function (index) {
                if (local_index != index) {
                    $scope.visible = false;
                }
                local_index = index;
                $scope.visible = $scope.visible ? false : true;
            };
            $rootScope.close = function (value) {
                if (value == "cronjob_cancel") {
                    $rootScope.visible_cronjob = $rootScope.visible_cronjob ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_cronjob_cancel") {
                    $rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_server_popup") {
                    $rootScope.delete_server_popup = $rootScope.delete_server_popup ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_cronjob_cancel") {
                    $rootScope.delete_cron_job = $rootScope.delete_cron_job ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "cronjob_ok") {
                    var job_command = "";
                    var job_name = "";
                    var minute = $rootScope.minute;
                    var hour = $rootScope.hour;
                    var day_of_month = $rootScope.day_of_month;
                    var month = $rootScope.month;
                    var day_of_week = $rootScope.day_of_week;
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
                            url: "/createCronJob",
                            data: {job_name: job_name, job_command: job_command.trim(), minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {job_name: job_name, job_command: job_command.trim(), id: data.row_id, minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week};
                                $rootScope.cronJobs.push(result_data);
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
                } else if (value == "edit_cronjob_ok") {
                    var job_command = "";
                    var job_name = "";
                    var cron_job_id = "";
                    var minute = $rootScope.minute;
                    var hour = $rootScope.hour;
                    var day_of_month = $rootScope.day_of_month;
                    var month = $rootScope.month;
                    var day_of_week = $rootScope.day_of_week;
                    $rootScope.errName = false;
                    $rootScope.errCommand = false;
                    job_name = $rootScope.jobName;
                    job_command = $rootScope.jobCommand;
                    cron_job_id = $rootScope.cronJobId;
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
                            url: "/editCronJob",
                            data: {cron_job_id:cron_job_id, minute: minute, hour: hour, day_of_month: day_of_month, month: month, day_of_week: day_of_week,job_command:job_command,server_job_name:$rootScope.server_job_name},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.edit_cronjob = $rootScope.edit_cronjob ? false : true;
                                location.reload();
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.cron_job_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.cron_job_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if (value == "delete_cronjob_ok"){
                    var cron_job_id = $rootScope.cron_job_id;
                    $http({
                        method: "post",
                        url: "/deleteCronJob",
                        headers: {"Content-Type": "application/json"},
                        data: {cron_job_id:cron_job_id}
                    })
                    .success(function (data) {
                        if(data.success ==1){
                            $rootScope.delete_cron_job = $rootScope.delete_cron_job ? false : true;
                            $rootScope.cronJobs.splice($rootScope.cron_job_index , 1);
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }else if(data.success == 0){
                                $rootScope.cron_job_delete_err_msg = "Internal Error!";
                        }else if(data.success == 2){
                                $rootScope.cron_job_delete_err_msg = data.err_desc;
                        }
                    });
                }
            };
            $rootScope.setCronId = function(id) {
                    companyService.setId(id);
            };
            $http({
                method: "post",
                url: "/getCompanyCron",
                headers: {"Content-Type": "application/json"},
                data : {id : id}
            })
                    .success(function (data) {
                        $rootScope.companyCron = data;
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

