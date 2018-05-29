var app = angular.module("runScriptController", [])
        app.config(['$compileProvider', function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
        }]);
    app.controller("runScriptController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            $rootScope.searchBarAllowed = 0;
            if (id == undefined) {
                id = $window.localStorage.getItem('scriptId');
            }
            $window.localStorage.setItem('scriptId', id);
            $rootScope.assignServerModel = function () {
                $rootScope.assign_script = $rootScope.assign_script ? false : true;
                if ($rootScope.assign_script) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.check_compnay_script = function (value){
                    $(".project").css("display","none");
                    $(".project_"+value).css("display","block");
            };
            $rootScope.check_project_script = function (value){
                    $(".server").css("display","none");
                    $(".server_"+value).css("display","block");
            };
            $rootScope.check_server_script = function (value,serverIp,serverName){
                    $rootScope.serverId = value ;
                    $rootScope.serverIp = serverIp;
                    $rootScope.serverName = serverName;
            };
            $rootScope.runScriptModel = function (script_id,script_name,script,script_desc){
//                if(script.indexOf("rm") >=0){
//                    alert("Automation contain rm command is not allow to run.");
//                    return false;
//                }
                var run=[];
                for (var i = 0; i < $rootScope.runCommandName.length; i++) {
                  run = $rootScope.runCommandName[i];
                  if(new RegExp('\\b' + run + '\\b').test(script)){
                     alert( run+" command is not allowed to run.");
                     return false;
                  }
                }
                var serverIp = $rootScope.serverIp;
                var serverId = $rootScope.serverId;
                if(serverIp == "" || serverIp == undefined){
                    alert("Please assign server to run the script.");
                    return;
                }body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in loader";
                 $http({
                    method: "post",
                    url: "/runScript",
                    data: {script_id:script_id,script_name: script_name,script:script,serverIp:serverIp,serverId:serverId,script_desc:script_desc},
                    headers: {"Content-Type": "application/json"}
                 })
                    .success(function (data) {
                        $rootScope.Output = true;
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                        if(data.success==1){
                            $('.output_window').text(data.response);
                            $rootScope.scriptOutput = data.response;
                        }else if (data.success==0){
                            $('.output_window').text(data.err_desc);
                            $rootScope.scriptOutput = data.err_desc;
                        }
                    });
            };
            $rootScope.downloadOutput = function (){
                var blob = new Blob([$rootScope.scriptOutput], {type: 'text/plain'}),
                url = $window.URL || $window.webkitURL;
                $rootScope.fileUrl = url.createObjectURL(blob);  
            };
            $rootScope.close = function (value) {
                if(value == "assign_script_cancel"){
                    $rootScope.assign_script = $rootScope.assign_script ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value=="assign_script_ok"){
                    if($rootScope.serverId=="" || $rootScope.serverId==undefined){
                        $rootScope.errMessage=true;
                        return;
                    }else{
                      $('.server_details').text(" "+$rootScope.serverName+ " " +$rootScope.serverIp);
                      $('.assign_server').text("Reassign Server");
                      $rootScope.errMessage=false;  
                      $rootScope.assign_script = $rootScope.assign_script ? false : true;
                      body.removeClass("overflowHidden");
                      $rootScope.modal_class = "";
                    }
                }
            };
            $http({
                method: "post",
                url: "/getScriptsById",
                data: {script_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.singleScript = data[0];
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
            