angular.module("projectInstanceController", []).controller("projectInstanceController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            if (id == undefined) {
                id = $window.localStorage.getItem('customerId');
            }
            $window.localStorage.setItem('customerId', id);
            $rootScope.pages = [];
            $rootScope.numPerPage = 50;
            $rootScope.noOfPages = 0;
            $rootScope.currentPage = 1;
            $rootScope.servers = [];
            $rootScope.sortType     = 'serverName'; 
            $rootScope.sortReverse  = false; 
            $rootScope.searchServer   = ''; 
            $rootScope.remove = '';
            $rootScope.instanceState = 'running';
            $rootScope.searchBarAllowed = 0;
            instanceDetails(id);
            $rootScope.begin = ($rootScope.currentPage-1)*$rootScope.numPerPage;
            $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
            $scope.search = function (rows) {
                return (angular.lowercase(rows.serverName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
                        angular.lowercase(rows.instanceId).indexOf(angular.lowercase($scope.query) || '') !== -1);
            };
            $rootScope.backKey = function(){
              $rootScope.count1 = 1;
            };
            $rootScope.changeState= function(state){
                $rootScope.selectPage(1);
                var data =  $rootScope.instanceData;
                var rcount=0;var hcount = 0;
                for (var i = 0; i < data.length; i++){
                    if(data[i].raw_data != null){
                        var array = JSON.parse(data[i].raw_data);
                        $rootScope.instanceData[i].instanceState = array.State.Name;
                        if ($rootScope.instanceData[i].instanceState == "running") {
                            rcount++;
                        }
                    }else{
                        var instanceId = $rootScope.instanceData[i].instanceId;
                        if(instanceId.indexOf("mi-") !== -1) {
                            hcount++;
                        }
                    }
                }
                $rootScope.pages = [];
                if(state==""){
                    $rootScope.noOfPages = Math.ceil(data.length / $rootScope.numPerPage);
                    $rootScope.runningCount = data.length;
                }else if(state==="hybrid"){
                    $rootScope.noOfPages = Math.ceil(hcount / $rootScope.numPerPage);
                    $rootScope.runningCount = hcount;
                }else if(state==="stopped"){
                    var scount = data.length-(hcount+rcount);
                    $rootScope.noOfPages = Math.ceil(scount / $rootScope.numPerPage);
                    $rootScope.runningCount = scount;
                }else{
                    $rootScope.noOfPages = Math.ceil(rcount / $rootScope.numPerPage);
                    $rootScope.runningCount = rcount;
                }
                for(var j=1 ; j <=$rootScope.noOfPages;j++){
                     $rootScope.pages.push(j);
                }
            };
            $rootScope.noPrevious = function() {
                return $rootScope.currentPage === 1;
              };
              $rootScope.noNext = function() {
                return $rootScope.currentPage === $rootScope.noOfPages;
              };
              $rootScope.isActive = function(page) {
                return $rootScope.currentPage === page;
              };

              $rootScope.selectPage = function(page) {
                $rootScope.begin = (page-1)*$rootScope.numPerPage;
                $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                if ( ! $rootScope.isActive(page) ) {
                  $rootScope.currentPage = page;
                }
              };

              $rootScope.selectPrevious = function() {
                if ( !$rootScope.noPrevious() ) {
                  $rootScope.selectPage($rootScope.currentPage-1);
                  $rootScope.begin = ($rootScope.currentPage-1)*$rootScope.numPerPage;
                  $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                }
              };
              $rootScope.selectNext = function() {
                if ( !$rootScope.noNext() ) {
                  $rootScope.begin = ($rootScope.currentPage+1)*$rootScope.numPerPage;
                  $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                  $rootScope.selectPage($rootScope.currentPage+1);
                }
              };
              $rootScope.removeProject = function(){
                    $rootScope.projectId = "";
                    $rootScope.companyId = "";
                    $rootScope.remove =1;
              };
              
            
            $rootScope.modal_class = "modal-backdrop fade in loader";
            $window.localStorage.setItem('customerId', id);
            $rootScope.instanceList = [];
            $rootScope.syncInstanceData = function (regionArray){
                $rootScope.modal_class = "modal-backdrop fade in loader";
                 $http({
                        method: "post",
                        url: "/syncInstanceList",
                        headers: {"Content-Type": "application/json"},
                        data : {id : id,regionArray:regionArray}
                  })
                    .success(function (data){
                        if(data.success==1){
                            instanceDetails(id);
                            $rootScope.modal_class="";
                        }else{
                            $rootScope.modal_class="";
                        }
                    });
            };
            $rootScope.showInstanceDetails = function (data,serverName){
                if(data == null){
                    alert("No instance detail is available for this server.");
                    return false;
                }
                $rootScope.instance_details = $rootScope.instance_details ? false : true;
                $rootScope.instanceDetails = JSON.parse(data);
                var group_name='';
                var group_id='';
                for(var i=0 ; i < $rootScope.instanceDetails.SecurityGroups.length ; i++){
                    group_name += $rootScope.instanceDetails.SecurityGroups[i].GroupName+" , ";
                    group_id += $rootScope.instanceDetails.SecurityGroups[i].GroupId+" , ";
                }
                $rootScope.groupName = group_name.replace(/,\s*$/, "");
                $rootScope.groupId = group_id.replace(/,\s*$/, "");
                $rootScope.serverName = serverName;
                if ($rootScope.instance_details){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.instanceStatusDetails = function (data,serverName,status){
                if(data == null){
                    alert("No instance status detail is available for this server.");
                    return false;
                }
                $rootScope.instance_status_details = $rootScope.instance_status_details ? false : true;
                $rootScope.serverName = serverName;
                $rootScope.status = status;
                if(status=="Stop"){
                    $rootScope.instanceStatusDetail = data;
                }else{
                    $rootScope.instanceStatusDetail = JSON.parse(data);
                }
                if ($rootScope.instance_status_details){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                }else{
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.selectedProjectId= function (value) {  
                $rootScope.projectId = value;
            };
            $rootScope.collectServerIds= function (server_id){  
                var idx = $rootScope.servers.indexOf(server_id);
                if (idx == -1){
                    $rootScope.servers.push(server_id);
                } else {
                    $rootScope.servers.splice(idx, 1);
                }
            };
            $rootScope.close = function (value) {
                if (value == "instance_details_ok") {
                    $rootScope.instance_details = $rootScope.instance_details ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "cancel_assign_project") {
                    $rootScope.assign_projects = $rootScope.assign_projects ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "instance_status_details_ok") {
                    $rootScope.instance_status_details = $rootScope.instance_status_details ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "assign_porject_ok") {
                    var project_id = $rootScope.projectId;
                    var server_id = $rootScope.serverId;
                    if((project_id==undefined || project_id == "") && $rootScope.remove !="1"){
                        $rootScope.errDesc = true;
                    }else{
                        $rootScope.errDesc = false;
                        $http({
                            method: "POST",
                            url: "/assignProject",
                            data: {project_id: project_id, server_id: server_id,customer_id:id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.assign_projects = $rootScope.assign_projects ? false : true;
                                $rootScope.instanceData = data.response;
                                location.reload();
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.assign_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.assign_err_msg = data.err_desc;
                            }
                        });
                    }
                }
            };
            $rootScope.assignProject = function (server_id){
                $rootScope.errDesc = false;
                $rootScope.serverId = server_id;
                $rootScope.projectId = "";
                $rootScope.companyId = "";
                $rootScope.remove = "";
                $rootScope.assign_projects = $rootScope.assign_projects ? false : true;
                if ($rootScope.assign_projects){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.assignMultiProjects = function (){
                if($rootScope.servers == ""){
                    alert("Please select at least one Server.");
                    return false;
                }
                $rootScope.errDesc = false;
                $rootScope.serverId = $rootScope.servers;
                $rootScope.projectId = "";
                $rootScope.companyId = "";
                $rootScope.remove = "";
                $rootScope.assign_projects = $rootScope.assign_projects ? false : true;
                if ($rootScope.assign_projects){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.changeProject = function (server_id,project_id,company_id){
                $rootScope.errDesc = false;
                $rootScope.serverId = server_id;
                $rootScope.projectId = project_id;
                $rootScope.companyId = company_id;
                $rootScope.remove = "";
                for(var j=0; j<$rootScope.companies.length;j++){
                    if($rootScope.companies[j].id==company_id){
                        $rootScope.ProjectDetails= $rootScope.companies[j].projects;
                    }
                }
                $rootScope.assign_projects = $rootScope.assign_projects ? false : true;
                if ($rootScope.assign_projects){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.fillProjects = function (projects){
                var ProjectDetails =  $('.projectDetails').val();
                $rootScope.ProjectDetails =eval( ProjectDetails );
            };
             $rootScope.checkInstancesStatus = function(customer_id){
                $('.refresh_whole').attr("src","../images/refresh.gif");
                $http({
                    method: "post",
                    url: "/CheckSSMStatusBycustomer",
                    data: {customer_id:customer_id},
                    headers: {"Content-Type": "application/json"}
                })
                .success(function (data) {
                    if(data.success==1){
                        $('.refresh_whole').attr("src","../images/refresh_icon.png");
                        $rootScope.instanceData = data.projectInstance;
                        for (var i = 0; i < data.projectInstance.length; i++){
                            if(data.projectInstance[i].raw_data != null){
                               var array= JSON.parse(data.projectInstance[i].raw_data);
                                $rootScope.instanceData[i].instanceState = array.State.Name;
                                for(var k =0 ; k < array.Tags.length ;k++ ){
                                     if(array.Tags[k]['Key']=="Environment"){
                                            $rootScope.instanceData[i].environmentValue =  array.Tags[k]['Value'];
                                      }
                                 }
                            }else{
                                var instanceId = $rootScope.instanceData[i].instanceId;
                                if(instanceId.indexOf("mi-") !== -1){
                                    $rootScope.instanceData[i].instanceState = "hybrid";
                                }
                            }
                        }
                    }
                 });
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
                        $('.checkSSMStatus_'+server_id).attr("src","../images/refresh_icon.png");
                        $rootScope.instanceData = data.projectInstance;
                        for (var i = 0; i < data.projectInstance.length; i++){
                            if(data.projectInstance[i].raw_data != null){
                               var array= JSON.parse(data.projectInstance[i].raw_data);
                                $rootScope.instanceData[i].instanceState = array.State.Name;
                                for(var k =0 ; k < array.Tags.length ;k++ ){
                                     if(array.Tags[k]['Key']=="Environment"){
                                            $rootScope.instanceData[i].environmentValue =  array.Tags[k]['Value'];
                                      }
                                 }
                            }else{
                                var instanceId = $rootScope.instanceData[i].instanceId;
                                if(instanceId.indexOf("mi-") !== -1){
                                    $rootScope.instanceData[i].instanceState = "hybrid";
                                }
                            }
                        }
                    }
                 });
            };
            $rootScope.displayRawData = function (){
                var value = $('.displayRawData').html();
                if(value == "See Raw Data"){
                    $('.rawdata').css("display","block");
                    $('.displayRawData').html("Hide Row Data");
                }else{
                    $('.rawdata').css("display","none"); 
                    $('.displayRawData').html("See Raw Data")
                }
            };
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
                url: "/getRegions",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        var region_array = [];
                        for(var i=0;i<data.length;i++){
                            region_array[i]=data[i].region;
                        }
                        $rootScope.regionArray =region_array;
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
                                if (data.projectdata[y].company_id == data.companydata[x].id) {
                                    projects.push(data.projectdata[y]);
                                    data.companydata[x].projects = projects;
                                }
                            }
                        }
                        $rootScope.companies = data.companydata;
                    });
         function instanceDetails(id){
             $http({
                method: "post",
                url: "/syncInstanceListDetails",
                data : {id : id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.pages = [];
                        $rootScope.modal_class="";
                        $rootScope.instanceData = data;
                        var runningCount = 0;
                        
                         for (var i = 0; i < data.length; i++){
                            if(data[i].raw_data != null){
                               var array= JSON.parse(data[i].raw_data);
                                $rootScope.instanceData[i].instanceState = array.State.Name;
                                if($rootScope.instanceData[i].instanceState=="running"){
                                    runningCount++;
                                }
                                for(var k =0 ; k < array.Tags.length ;k++ ){
                                     if(array.Tags[k]['Key']=="Environment"){
                                            $rootScope.instanceData[i].environmentValue =  array.Tags[k]['Value'];
                                      }
                                 }
                            }else{
                                var instanceId = $rootScope.instanceData[i].instanceId;
                                if(instanceId.indexOf("mi-") !== -1){
                                    $rootScope.instanceData[i].instanceState = "hybrid";
                                }
                            }
                        }
                        $rootScope.runningCount = runningCount;
                        $rootScope.noOfPages = Math.ceil(runningCount / $rootScope.numPerPage);
                        for(var j=1 ; j <=$rootScope.noOfPages;j++){
                            $rootScope.pages.push(j);
                       }
                    });
         }
        });