angular.module("automationController", []).controller("automationController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            $rootScope.projectArray = [];
            $rootScope.projectServerArray = [];
            $('.search_value').val('');
            $rootScope.showCreateScriptModel = function () {
                $rootScope.create_script = $rootScope.create_script ? false : true;
                $rootScope.scriptName = "";
                $rootScope.scriptDesc = "";
                $rootScope.script = "";
                $rootScope.errName = false;
                $rootScope.errDesc = false;
                $rootScope.errScript = false;
                $rootScope.create_script_err_msg = "";
                $rootScope.parameters = [];
                if ($rootScope.create_script) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.editScriptModel = function (script_id,script_name,script_desc,script){
                $rootScope.edit_script = $rootScope.edit_script ? false : true;
                $rootScope.scriptId = script_id;
                $rootScope.scriptName = script_name;
                $rootScope.scriptDesc = script_desc;
                $rootScope.script = script;
                $rootScope.errName = false;
                $rootScope.errDesc = false;
                $rootScope.errScript = false;
                $rootScope.edit_script_err_msg = "";
                $rootScope.showParameter = true;
                $rootScope.parameters = [];
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
                });
                if ($rootScope.edit_script) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.deleteScriptModel = function (script_id,index,script_name){
                $rootScope.delete_script = $rootScope.delete_script ? false : true;
                $rootScope.scriptId = script_id;
                $rootScope.scriptIndex =index;
                $rootScope.scriptName = script_name;
                if ($rootScope.delete_script){
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
           /* $rootScope.addParameter = function () {
                var text = $('#textArea').val();
                var lines = text.split(/\r|\r\n|\n/);
                var count = lines.length;
                if ($rootScope.scriptName != "" && $rootScope.scriptDesc != "" && $rootScope.script != "") {
                    if (count == 1) {
                        $rootScope.showParameter = true;
                        $rootScope.parameters.push({});
                        $rootScope.create_script_err_msg = "";
                        $rootScope.edit_script_err_msg = "";
                    } else {
                        $rootScope.parameters.splice(0);
                        $rootScope.create_script_err_msg = "Parameters allowed only for one line script";
                        $rootScope.edit_script_err_msg = "Parameters allowed only for one line script";
                    }
                } else {
                    $rootScope.create_script_err_msg = "Please fill all the details";
                    $rootScope.edit_script_err_msg = "Please fill all the details";
                }
            };
            $rootScope.deleteParameter = function (parIndex) {
                $rootScope.parameters.splice(parIndex, 1);
            }; */
            $rootScope.assignProjectandServer = function (script_id){
                $rootScope.assign_project_server = $rootScope.assign_project_server ? false : true;
                $rootScope.scriptId = script_id;
                $rootScope.proj= [];
                $rootScope.serv= [];
                $http({
                     method: "POST",
                     url: "/getScriptData",
                     data: {script_id: script_id},
                     headers: {"Content-Type": "application/json"}
                 }).success(function (data){
                      var grpro =[];
                      $rootScope.serv = [];
                      for(var i = 0, l = data.length; i < l; i++) {
                            var idx = $rootScope.projectArray.indexOf(data[i].project_id);
                            if(idx == -1){
                                $rootScope.projectArray.push(data[i].project_id);
                            }
                            $rootScope.serv[i.toString()] = data[i].server_id;
                            $(".server_"+data[i].project_id).css("display","block");
                            if(data[i].project_id !=old_id){
                                    $rootScope.projectServerArray[old_id]=squash(grpro);
                                    grpro = [];
                            }
                            grpro[i.toString()] = data[i].server_id;
                            var old_id = data[i].project_id;
                      }
                      $rootScope.projectServerArray[old_id]=squash(grpro);
                 });
                if ($rootScope.assign_project_server){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                }else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.assign_project = function (project_id,servers){
                var serverids =[];
                for(var x in servers){
                    serverids[x]=servers[x].id;
                }
                $rootScope.projectServerArray[project_id]= serverids;
                var idx = $rootScope.projectArray.indexOf(project_id);
                if(idx == -1){
                    $rootScope.projectArray.push(project_id);
                    $(".server_check_"+project_id).prop("checked", true);
                    $(".server_"+project_id).css("display","block");
                }else{
                    $rootScope.projectArray.splice(idx, 1);
                    $(".server_"+project_id).css("display","none");
                }
            };
            $rootScope.assign_server = function (server_id,project_id){
                var idx = $rootScope.projectServerArray[project_id].indexOf(server_id);
                if(idx == -1){
                    $rootScope.projectServerArray[project_id].push(server_id);
                }else{
                    $rootScope.projectServerArray[project_id].splice(idx, 1);
                }
            };
            $rootScope.setScriptId = function(id, script){
                companyService.setId(id);    
                $rootScope.showPassword = false;
                $rootScope.Output = false;
                $rootScope.scriptId = id;
                $rootScope.script = script;
                $rootScope.commands = "";
                $rootScope.parameters = [];
                var lines = script.split(/\r|\r\n|\n/);
                var countScriptLine = lines.length;
                $http({
                    method: "POST",
                    url: "/getParameter",
                    data: {scriptId: id},
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
                        if (data.length > 0 && countScriptLine == 1){
                        $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                        $rootScope.singleScript = $rootScope.script;
                        if ($rootScope.assign_parameter) {
                            body.addClass("overflowHidden");
                            $rootScope.modal_class = "modal-backdrop fade in";
                        } else {
                            body.removeClass("overflowHidden");
                            $rootScope.modal_class = "";
                        }
                        }else {
                            window.location = '/#runScript';
                        }
                        });
	    };
            $rootScope.close = function (value) {
                if (value == "create_script_cancel") {
                    $rootScope.create_script = $rootScope.create_script ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_script_cancel") {
                    $rootScope.edit_script = $rootScope.edit_script ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_script_cancel") {
                    $rootScope.delete_script = $rootScope.delete_script ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "assign_parameter_cancel") {
                    $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "create_script_ok") {
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
                   /* } else if (countScriptLine > 1 && parameter.length > 0) {
                        $rootScope.parameters.splice(0);
                        $rootScope.create_script_err_msg = "Parameters allowed only for one line script";
                        return false; */
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errDesc = false;
                        $rootScope.errScript = false;
                        $http({
                            method: "POST",
                            url: "/createScript",
                            data: {script_name: script_name, script_desc: script_desc, script: script,  parameter:parameter},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {script_name: script_name, script_desc: script_desc.trim(), id: data.row_id, script: script};
                                $rootScope.automationScripts.push(result_data);
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
                }else if (value == "edit_script_ok") {
                    var script_name = $rootScope.scriptName;
                    var script_desc = $rootScope.scriptDesc;
                    var script = $rootScope.script;
                    var script_id  = $rootScope.scriptId;
                    var parameter_name = $rootScope.parameterName;
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
                   /* } else if (countScriptLine > 1 && parameter.length > 0) {
                        $rootScope.parameters.splice(0);
                        $rootScope.edit_script_err_msg = "Parameters allowed only for one line script";
                        return false; */
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errDesc = false;
                        $rootScope.errScript = false;
                        $http({
                            method: "POST",
                            url: "/editScript",
                            data: {script_id:script_id, script_desc: script_desc, script: script, parameter: parameter, parameter_name: parameter_name},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                location.reload();
                                $rootScope.edit_script = $rootScope.edit_script ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.edit_script_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.edit_script_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if(value == "delete_script_ok"){
                    var scriptId  = $rootScope.scriptId;
                     $http({
                            method: "POST",
                            url: "/deleteScript",
                            data: {scriptId:scriptId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.delete_script = $rootScope.delete_script ? false : true;
                                $rootScope.automationScripts.splice($rootScope.scriptIndex , 1);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.delete_script_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.delete_script_err_msg = data.err_desc;
                            }
                        });
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
                        window.location = '/#runScript';
                        $rootScope.assign_parameter = $rootScope.assign_parameter ? false : true;
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                }else if (value == "assign_project_server_cancel") {
                    $rootScope.assign_project_server = $rootScope.assign_project_server ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if(value=="assign_project_server_ok"){
                     $http({
                            method: "POST",
                            url: "/assignProjectServer",
                            data: {script_id:$rootScope.scriptId, project_array:$rootScope.projectArray,project_server:$rootScope.projectServerArray},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                location.reload();
                                $rootScope.assign_project_server = $rootScope.assign_project_server ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.assign_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.assign_err_msg = data.err_desc;
                            }
                        });
                }
            };
            $rootScope.removePid = function() {
			$rootScope.pid='';
		};
            $http({
                method: "post",
                url: "/getAutomationScripts",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.automationScripts = data;
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
                url: "/getGroupData",
                method: "GET"
            })
                    .success(function (data) {
                        for (var x in data.companydata) {
                            var projects = [];

                            data.companydata[x].projects = [];

                            for (var y in data.projectdata){
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
                    
                    function squash(arr){
                var tmp = [];
                for (var i = 0; i < arr.length; i++) {
                    if (tmp.indexOf(arr[i]) == -1) {
                        tmp.push(arr[i]);
                    }
                }
                return tmp;
            }
        });