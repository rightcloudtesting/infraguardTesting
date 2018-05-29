angular.module("cronDetailController", []).controller("cronDetailController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var local_index = -1;
            var id = companyService.getId();
            if(id =="" || id==undefined){
                window.location = "#/cron";
            }
            $rootScope.croncompanyProjects = [];
            $rootScope.croncompaniesId = [];
            $rootScope.cronProjectServers = [];
            $rootScope.serverArray = [];
            $rootScope.showAllocateServerModel = function () {
                $rootScope.allocate_server = $rootScope.allocate_server ? false : true;
                $rootScope.errMessage = false;
                $rootScope.cronJobId=id;
                $rootScope.croncompanyProjects = [];
                $rootScope.croncompaniesId = [];
                $rootScope.cronProjectServers = [];
                $rootScope.serverArray = [];
                $http({
                      method: "POST",
                      url: "/getAllocateServersData",
                      data: {cron_job_id: id},
                      headers: {"Content-Type": "application/json"}
                 }).success(function (data){
                     for (var i = 0, l = data.length; i < l; i++){
                         if($rootScope.croncompaniesId.indexOf(data[i].company_id) === -1){
                             $(".checkbox-project_"+data[i].company_id).prop("checked", true);
                             $(".project_"+data[i].company_id).css("display","block");
                             $rootScope.croncompaniesId.push(data[i].company_id); 
                         }
                         if($rootScope.croncompanyProjects.indexOf(data[i].project_id) === -1){
                             $(".checkbox-project_"+data[i].project_id).prop("checked", true);
                             $(".server_"+data[i].project_id).css("display","block");
                             $rootScope.croncompanyProjects.push(data[i].project_id);
                             $rootScope.cronProjectServers[data[i].project_id] = new Array ();
                         }
                         if($rootScope.serverArray.indexOf(data[i].server_id) === -1){
                            $rootScope.serverArray.push(data[i].server_id);
                         }
                         $rootScope.cronProjectServers[data[i].project_id].push(data[i].server_id);
                     }
                 });
                
                
                if ($rootScope.allocate_server) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.close = function (value) {
                if (value == "allocate_server_cancel") {
                    $rootScope.allocate_server = $rootScope.allocate_server ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value=="allocate_server_ok"){
                    $rootScope.errMessage = false;
                    var cron_job_id= $rootScope.cronJobId;
                    var servers_array = $rootScope.cronProjectServers.join().split(/\s|,/).filter(Boolean);
//                    if(servers_array=="" || servers_array==undefined){
//                        $rootScope.errMessage = true;
//                        return false;
//                    }else{
                        $rootScope.errMessage = false;
                        $http({
                            method: "POST",
                            url: "/allocateServer",
                            data: {cron_job_id: cron_job_id, servers_array: servers_array},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.cronJobServers = data.cronservers;
                                $rootScope.allocate_server = $rootScope.allocate_server ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.allocate_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.allocate_err_msg = data.err_desc;
                            }
                        });
                   // }
                }
            };
            $rootScope.check_compnay_job = function (value,project){
                var idx = $rootScope.croncompaniesId.indexOf(value);
                if (idx == -1){
                    $(".checkbox-project_"+value).prop("checked", true);
                    $(".project_"+value).css("display","block");
                    $rootScope.croncompaniesId.push(value);
                } else {
                    $(".project_"+value).css("display","none");
                    $rootScope.croncompaniesId.splice(idx, 1);
                }
            };
            $rootScope.check_project_job = function (value,company,server){
                var serverids =[];
                for(var x in server){
                    serverids[x]=server[x].id;
                }
                var idx = $rootScope.croncompanyProjects.indexOf(value);
                if (idx == -1){
                    if(server !=""){
                        $rootScope.cronProjectServers[value] = serverids;
                    }
                    $(".checkbox-project_"+value).prop("checked", true);
                    $(".server_"+value).css("display","block");
                    $(".server_check_"+value).prop("checked", true);
                    $rootScope.croncompanyProjects.push(value);
                } else {
                    $(".server_"+value).css("display","none");
                    $rootScope.croncompanyProjects.splice(idx, 1);
                    $rootScope.cronProjectServers[value] = "";
                }
            };
            $rootScope.check_server_job = function (value,project){
                var idx = $rootScope.cronProjectServers[project].indexOf(value);
                if(idx==-1){
                    $rootScope.cronProjectServers[project].push(value);
                }else{
                    $rootScope.cronProjectServers[project].splice(idx, 1);
                }
            };
            $http({
                method: "post",
                url: "/getCronjobbyId",
                data: {id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.cronJob = data.cronjobdata[0];
                        $rootScope.cronJobServers = data.cronjobservers;
                
                    });
            $http({
                url: "/getGroupData",
                method: "GET"
            })
                    .success(function (data) {
                        for (var x in data.companydata) {
                            var projects = [];
                            
                            data.companydata[x].projects = [];
                            
                            for (var y in data.projectdata) {
                                var servers = [];
                                data.projectdata[y].servers = [];
                                if (data.projectdata[y].company_id == data.companydata[x].id) {
                                    projects.push(data.projectdata[y]);
                                    data.companydata[x].projects = projects;
                                }
                                for (var z in data.serverdata) {
                                    if (data.serverdata[z].project_id == data.projectdata[y].id) {
                                        servers.push(data.serverdata[z]);
                                        data.projectdata[y].servers = servers;
                                    }
                                }
                            }
                        }
                        $rootScope.companies = data.companydata;
                    });
        });

