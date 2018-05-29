angular.module("roleController", []).controller("roleController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var emailPattern = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
            var mailUserCredentialsUrl="";
            var role_id = companyService.getId();
            $rootScope.pages = [];
            $rootScope.numPerPage = 10;
            $rootScope.noOfPages = 0;
            $rootScope.currentPage = 1;
            $rootScope.begin = ($rootScope.currentPage - 1) * $rootScope.numPerPage;
            $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
            $rootScope.noPrevious = function () {
                return $rootScope.currentPage === 1;
            };
            $rootScope.noNext = function () {
                return $rootScope.currentPage === $rootScope.noOfPages;
            };
            $rootScope.isActive = function (page) {
                return $rootScope.currentPage === page;
            };
            $rootScope.selectPage = function (page) {
                $rootScope.begin = (page - 1) * $rootScope.numPerPage;
                $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                if (!$rootScope.isActive(page)) {
                    $rootScope.currentPage = page;
                }
            };

            $rootScope.selectPrevious = function () {
                if (!$rootScope.noPrevious()) {
                    $rootScope.selectPage($rootScope.currentPage - 1);
                    $rootScope.begin = ($rootScope.currentPage - 1) * $rootScope.numPerPage;
                    $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                }
            };
            $rootScope.selectNext = function () {
                if (!$rootScope.noNext()) {
                    $rootScope.begin = ($rootScope.currentPage + 1) * $rootScope.numPerPage;
                    $rootScope.end = ($rootScope.begin + $rootScope.numPerPage);
                    $rootScope.selectPage($rootScope.currentPage + 1);
                }
            };
            $scope.search = function (user) {
                return (angular.lowercase(user.uname).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
                        angular.lowercase(user.email).indexOf(angular.lowercase($scope.query) || '') !== -1);
            };
            $rootScope.tab='';
            if(($rootScope.selectedTab==4 || $rootScope.selectedTab == undefined)  && $rootScope.count1 == 1){
                $(".leftnav>li").eq(4).addClass("add");
                $(".rightnav>li").hide().eq(4).show();
                $rootScope.count1 = 0;
            }else if($rootScope.roleNames=='Manager' && $rootScope.roleIds !=1){
                $(".leftnav>li").eq(4).addClass("add");
                $(".rightnav>li").hide().eq(4).show();
                $rootScope.user = true;
                $rootScope.role = true;
                $rootScope.policy = true;
                $rootScope.group = true;
            }else{
                $(".leftnav>li").eq(0).addClass("add");
                $(".rightnav>li").hide().eq(0).show();
            }
            $rootScope.policyElements = [];
            $rootScope.companiesId = [];
            $rootScope.companyProjects = [];
            $rootScope.managerIdList = [];
            $('.search_value').val('');
            $rootScope.change = function (value){
                var idx = $rootScope.policyElements.indexOf(value);
                if (idx == -1){
                    $rootScope.policyElements.push(value);
                } else {
                    $rootScope.policyElements.splice(idx, 1);
                }
            };
            $http.get('environment.properties').then(function (response){
                 mailUserCredentialsUrl = response.data.mailUserCredentialsUrl;
            });
            $rootScope.changeTab= function (n){
                $rootScope.selectedTab = n;
                $(".leftnav>li").removeClass("add").eq(n).addClass("add");
                $(".rightnav>li").hide().eq(n).show();
                $rootScope.selectPage(1);
                $rootScope.pages = [];
                if($rootScope.selectedTab==0){
                    $rootScope.noOfPages = Math.ceil($rootScope.usersdata.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==1){
                    $rootScope.noOfPages = Math.ceil($rootScope.roles.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==2){
                    $rootScope.noOfPages = Math.ceil($rootScope.policiesdata.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==3){
                    $rootScope.noOfPages = Math.ceil($rootScope.groupsdata.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==4){
                    $rootScope.noOfPages = Math.ceil($rootScope.customersData.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==5){
                    $rootScope.noOfPages = Math.ceil($rootScope.tagsData.length / $rootScope.numPerPage);
                }else if($rootScope.selectedTab==6){
                    $rootScope.noOfPages = Math.ceil($rootScope.commands.length / $rootScope.numPerPage);
                }
                for(var j=1 ; j <=$rootScope.noOfPages;j++){
                     $rootScope.pages.push(j);
                }
            };
            $rootScope.check_compnay = function (value,project){
                var projectids =[];
                for(var x in project){
                    projectids[x]=project[x].id;
                }
                $rootScope.companyProjects[value]=projectids;
                var idx = $rootScope.companiesId.indexOf(value);
                if (idx == -1){
                    $(".project_"+value).css("display","block");
                    $rootScope.companiesId.push(value);
                } else {
                    $(".project_"+value).css("display","none");
                    $rootScope.companiesId.splice(idx, 1);
                }
            };
            $rootScope.check_project = function (value,company){
                var idx = $rootScope.companyProjects[company].indexOf(value);
                if (idx == -1){
                    $rootScope.companyProjects[company].push(value);
                } else {
                    $rootScope.companyProjects[company].splice(idx, 1);
                } 
            };
            $rootScope.check_manager = function (value){
                var idx = $rootScope.managerIdList.indexOf(value);
                if (idx == -1){
                    $rootScope.managerIdList.push(value);
                } else {
                    $rootScope.managerIdList.splice(idx, 1);
                }
            };
             $rootScope.setUserId = function(id){
			companyService.setId(id);
	    };
            $rootScope.setRoleId = function(role_id){
                   companyService.setId(role_id);
	    };
             $rootScope.selectedPolicy= function (value) {  
                $rootScope.rolePolicy=value;
            };
            $rootScope.selectedUserRole= function (value){  
                $rootScope.userRole=value;
            };
            $rootScope.selectedUserGroup= function (value){  
                $rootScope.userGroup=value;
            };
            $scope.editTagModel = function (tag_id,tag_name,tag_desc,tag_index){
                $rootScope.tagId = tag_id;
                $rootScope.tagName = tag_name;
                $rootScope.tagDesc = tag_desc;
                $rootScope.tagIndex = tag_index;
                $rootScope.errName = false;
                $rootScope.errDesc = false;
                $rootScope.edit_tag = $rootScope.edit_tag ? false : true;
                if($rootScope.edit_tag){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                }else{
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $scope.deleteTagModel = function (tag_id,tag_index){
                $rootScope.tagId = tag_id;
                $rootScope.tagIndex = tag_index;
                $rootScope.delete_tag = $rootScope.delete_tag ? false : true;
                if($rootScope.delete_tag){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                }else{
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.assignManager = function (customer_id) {
                $rootScope.customerId = customer_id;
                $rootScope.visibleAssignManager = $rootScope.visibleAssignManager ? false : true;
                $rootScope.mgr_err_msg = "";
                $(".manager").prop("checked", false);
                $http({
                    method: "POST",
                    url: "/getcustomerManager",
                    data: {customerId: customer_id},
                    headers: {"Content-Type": "application/json"}
                }).success(function (data) {
                    $rootScope.managersById = [];
                    for (var i = 0, l = data.length; i < l; i++) {
                        $rootScope.managersById[i.toString()] = data[i].manager_id;
                        $rootScope.managerById = data[i].manager_id;
                        $(".checkbox-manager_" + data[i].manager_id).prop("checked", true);
                    }
                    $rootScope.managerIdList = $rootScope.managersById;
                });
                if ($rootScope.visibleAssignManager) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $scope.changePassword = function (id, password) {
                $rootScope.change_password = $rootScope.change_password ? false : true;
                $rootScope.oldPassword = false;
                $rootScope.userId = id;
                $rootScope.passw = password;
                $rootScope.oldPass = "";
                $rootScope.newPass = "";
                $rootScope.renewPass = "";
                if ($rootScope.change_password) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $scope.showPopup = function (mode, role_id, role_name, role_desc,role_policy_id,role_index,policy_id,policy_name,policy_desc,policy_index,user_id,user_name,user_email,user_roleid,user_index,user_group_id,group_id,group_index,group_name,group_desc,customer_id,customer_name,customer_arn,customer_external_id,customer_index, command_id, command_name, command_desc, command_index,customer_service_arn) {
                if (mode == "createRole") {
                    $rootScope.visible_role = $rootScope.visible_role ? false : true;
                    $rootScope.errName = false;
                    $rootScope.roleName = "";
                    $rootScope.roleDesc = "";
                    $rootScope.rolePolicy = "";
                    $rootScope.errNameDesc = "";
                    $rootScope.role_err_msg = "";
                    if ($rootScope.visible_role) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                } else if (mode == "editRole") {
                    $rootScope.edit_role = $rootScope.edit_role ? false : true;
                    $rootScope.errName = false;
                    $rootScope.roleName = role_name;
                    $rootScope.roleDesc = role_desc;
                    $rootScope.roleIds = role_id;
                    $rootScope.rolePolicy = role_policy_id;
                    $rootScope.roleIndex = role_index;
                    $rootScope.errNameDesc = "";
                    $rootScope.role_err_msg = "";
                    if ($rootScope.edit_role) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                } else if (mode == "deleteRole") {
                    $rootScope.delete_role = $rootScope.delete_role ? false : true;
                    $rootScope.roleIds = role_id;
                    $rootScope.roleIndex = role_index;
                    $rootScope.count = 0;
                    if ($rootScope.delete_role) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                } else if (mode == "createPolicy") {
                    $rootScope.visible_policy = $rootScope.visible_policy ? false : true;
                    $rootScope.errName = "";
                    $rootScope.errNameDesc = "";
                    $rootScope.policyName = "";
                    $rootScope.policyDesc ="";
                    $rootScope.policyElements = [];
                    $(".policyCheckbox").prop("checked", false);
                    $(".policyCheckbox").prop("checked", false);
                    $(".policyCheckbox").prop("checked", false);
                    $rootScope.policy_err_msg = "";
                    if ($rootScope.visible_policy) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                } else if (mode == "editPolicy") {
                    $rootScope.edit_policy = $rootScope.edit_policy ? false : true;
                    $rootScope.errName = false;
                    $rootScope.policyName = policy_name;
                    $rootScope.policyDesc = policy_desc;
                    $rootScope.policyId = policy_id;
                    $rootScope.policyIndex = policy_index;
                    $rootScope.errNameDesc = "";
                    $rootScope.policy_err_msg = "";
                    $http({
                            method: "POST",
                            url: "/getPolicyElements",
                            data: {polid: policy_id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            $rootScope.policyElementsbyId = [];
                            for (var i = 0, l = data.length; i < l; i++) {
                              $rootScope.policyElementsbyId[i.toString()] = data[i].policy_element_id;
                            }
                            $rootScope.policyElements=$rootScope.policyElementsbyId;
                        });
                    if ($rootScope.edit_policy) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }
                else if (mode == "deletePolicy") {
                    $rootScope.delete_policy = $rootScope.delete_policy ? false : true;
                    $rootScope.policyId = policy_id;
                    $rootScope.policyIndex = policy_index;
                    if ($rootScope.delete_policy) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }
                else if (mode == "addUser") {
                    $rootScope.visible_add_user_ = $rootScope.visible_add_user_ ? false : true;
                    $rootScope.userName  = "";
                    $rootScope.userEmail = "";
                    $rootScope.userPass = "";
                    $rootScope.userRole = "";
                    $rootScope.userGroup = "";
                    $rootScope.userId = "";
                    $rootScope.errName  = "";
                    $rootScope.errEmail  = "";
                    $rootScope.errPass  = "";
                    if ($rootScope.visible_add_user_) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }
                else if (mode == "editUser") {
                    $rootScope.visible_edit_user_ = $rootScope.visible_edit_user_ ? false : true;
                    $rootScope.userName  = user_name ;
                    $rootScope.userEmail = user_email;
                    $rootScope.userRole = user_roleid;
                    $rootScope.userGroup = user_group_id;
                    $rootScope.userId = user_id;
                    $http({
                            method: "POST",
                            url: "/getUserGroups",
                            data: {userid: user_id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            $rootScope.userGroups = [];
                            for (var i = 0, l = data.length; i < l; i++) {
                              $rootScope.userGroups[i.toString()] = data[i].group_id;
                            }
                            $rootScope.userGroup=$rootScope.userGroups;
                      });
                    if ($rootScope.visible_edit_user_) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                } else if (mode == "deleteUser") {
                    $rootScope.visible_delete_user_ = $rootScope.visible_delete_user_ ? false : true;
                    $rootScope.userId = user_id;
                    $rootScope.deleteuserIndex = user_index;
                    if ($rootScope.visible_delete_user_) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "createGroup") {
                    $rootScope.visible_group = $rootScope.visible_group ? false : true;
                    $rootScope.groupName  = "" ;
                    $rootScope.groupDesc = "";
                    $rootScope.errName = "";
                    $rootScope.errDesc = "";
                    $rootScope.group_err_msg = "";
                    $(".companyCheckbox").prop("checked", false);
                    $(".projectCheckbox").prop("checked", true);
                    $(".project").css("display", "none");
                    $rootScope.companiesId.length = 0;
                    if ($rootScope.visible_group) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                 }
                else if (mode == "editGroup") {
                    $rootScope.edit_group = $rootScope.edit_group ? false : true;
                    $rootScope.groupName  = group_name ;
                    $rootScope.groupDesc = group_desc;
                    $rootScope.groupId = group_id;
                    $rootScope.groupIndex = group_index;
                    $rootScope.errName = "";
                    $rootScope.errDesc = "";
                    $rootScope.group_err_msg = "";
                    $(".companyCheckbox").prop("checked", false);
                    $(".projectCheckbox").prop("checked", false);
                    $(".project").css("display", "none");
                    $http({
                            method: "POST",
                            url: "/getGroupElements",
                            data: {groupId: group_id},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            $rootScope.groupCompaies = [];
                            $rootScope.groupProjects = [];
                            var grpro =[];
                            var old_id = '';
                            for (var i = 0, l = data.length; i < l; i++) {
                                $rootScope.groupCompaies[i.toString()] = data[i].compnay_id;
                                $(".project_"+data[i].compnay_id).css("display","block");
                                $(".checkbox-company_"+data[i].compnay_id).prop("checked", true);
                                $rootScope.groupProjects[i.toString()] = data[i].project_id;
                                $(".checkbox-project_"+data[i].project_id).prop("checked", true);
                                if(data[i].compnay_id !=old_id){
                                    $rootScope.companyProjects[old_id]=grpro;
                                    grpro = [];
                                }
                                grpro[i.toString()] = data[i].project_id;
                                var old_id = data[i].compnay_id;
                               
                            }
                            $rootScope.companyProjects[old_id]=grpro;
                            $rootScope.companiesId=squash($rootScope.groupCompaies);
                        });
                    if ($rootScope.edit_group) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "deleteGroup") {
                    $rootScope.delete_group = $rootScope.delete_group ? false : true;
                    $rootScope.groupId = group_id;
                    $rootScope.groupIndex = group_index;
                    if ($rootScope.delete_group) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "addCustomer") {
                    $rootScope.visible_customer = $rootScope.visible_customer ? false : true;
                    $rootScope.custExternalID = "";
                    $rootScope.custName = "";
                    $rootScope.custARN = "";
                    $rootScope.custserviceARN = "";
                    $rootScope.errName = "";
                    $rootScope.errARN = "";
                    $rootScope.errExternalId = "";
                    if ($rootScope.visible_customer) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                 }else if (mode == "editCustomer"){
                    $rootScope.edit_customer = $rootScope.edit_customer ? false : true;
                    $rootScope.errName = false;
                    $rootScope.custId = customer_id;
                    $rootScope.custName = customer_name;
                    $rootScope.custARN = customer_arn;
                    $rootScope.custserviceARN = customer_service_arn;
                    $rootScope.custExternalID = customer_external_id;
                    $rootScope.custIndex = customer_index;
                    $rootScope.errARN = "";
                    $rootScope.errExternalId = "";
                    $rootScope.cust_err_msg = "";
                    if ($rootScope.edit_customer) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "deleteCustomer"){
                    $rootScope.delete_customer = $rootScope.delete_customer ? false : true;
                    $rootScope.custId = customer_id;
                    $rootScope.custIndex = customer_index;
                    if ($rootScope.delete_customer) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "addTag") {
                    $rootScope.visible_tag = $rootScope.visible_tag ? false : true;
                    $rootScope.tagName  = "" ;
                    $rootScope.tagDesc = "";
                    $rootScope.errName  = "" ;
                    $rootScope.errDesc  = "" ;
                    $rootScope.tag_err_msg = "";
                    if ($rootScope.visible_tag) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                 }else if (mode == "addCommand") {
                    $rootScope.visible_command = $rootScope.visible_command ? false : true;
                    $rootScope.errName = "";
                    $rootScope.commandName = "";
                    $rootScope.commandDesc = "";
                    $rootScope.errDesc = "";
                    if ($rootScope.visible_command) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
		}else if (mode == "editCommand"){
                    $rootScope.edit_command = $rootScope.edit_command ? false : true;
                    $rootScope.errName = false;
                    $rootScope.commandId = command_id;
                    $rootScope.commandName = command_name;
                    $rootScope.commandDesc = command_desc;
					$rootScope.commandIndex = command_index;
                    $rootScope.errName = "";
                    $rootScope.errDesc = "";
                    $rootScope.command_err_msg = "";
                    if ($rootScope.edit_command) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }else if (mode == "deleteCommand") {
                    $rootScope.delete_command = $rootScope.delete_command ? false : true;
                    $rootScope.commandId = command_id;
                    $rootScope.commandIndex = command_index;
                    if ($rootScope.delete_command) {
                        body.addClass("overflowHidden");
                        $rootScope.modal_class = "modal-backdrop fade in";
                    } else {
                        body.removeClass("overflowHidden");
                        $rootScope.modal_class = "";
                    }
                }
            };

            $rootScope.close = function (value) {
                if (value == "role_cancel") {
                    $rootScope.visible_role = $rootScope.visible_role ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "edit_role_cancel") {
                    $rootScope.edit_role = $rootScope.edit_role ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "delete_role_cancel") {
                    $rootScope.delete_role = $rootScope.delete_role ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "policy_cancel") {
                    $rootScope.visible_policy = $rootScope.visible_policy ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_policy_cancel") {
                    $rootScope.edit_policy = $rootScope.edit_policy ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "delete_policy_cancel") {
                    $rootScope.delete_policy = $rootScope.delete_policy ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "user_cancel") {
                    $rootScope.visible_add_user_ = $rootScope.visible_add_user_ ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_user_cancel") {
                    $rootScope.visible_edit_user_ = $rootScope.visible_edit_user_ ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_user_cancel") {
                    $rootScope.visible_delete_user_ = $rootScope.visible_delete_user_ ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "group_cancel") {
                    $rootScope.visible_group = $rootScope.visible_group ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_group_cancel") {
                    $rootScope.edit_group = $rootScope.edit_group ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_group_cancel") {
                    $rootScope.delete_group = $rootScope.delete_group ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "customer_cancel") {
                    $rootScope.visible_customer = $rootScope.visible_customer ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_customer_cancel") {
                    $rootScope.edit_customer = $rootScope.edit_customer ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_customer_cancel") {
                    $rootScope.delete_customer = $rootScope.delete_customer ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "tag_cancel") {
                    $rootScope.visible_tag = $rootScope.visible_tag ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_tag_cancel") {
                    $rootScope.edit_tag = $rootScope.edit_tag ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_tag_cancel") {
                    $rootScope.delete_tag = $rootScope.delete_tag ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "command_cancel") {
                    $rootScope.visible_command = $rootScope.visible_command ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "delete_command_cancel") {
                    $rootScope.delete_command = $rootScope.delete_command ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "edit_command_cancel") {
                    $rootScope.edit_command = $rootScope.edit_command ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "assign_manager_cancel") {
                    $rootScope.visibleAssignManager = $rootScope.visibleAssignManager ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if(value == "change_password_cancel"){
                    $rootScope.change_password = $rootScope.change_password ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }else if (value == "role_ok") {
                    var rname = "";
                    var rdesc = "";
                    var rpolicy = "";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    rname = $rootScope.roleName;
                    rdesc = $rootScope.roleDesc;
                    rpolicy =$rootScope.rolePolicy;
                    if (rname == undefined || rname=="") {
                        $rootScope.errName = true;
                        return;
                    } else if (rdesc == undefined || rdesc=="") {
                        $rootScope.errNameDesc = true;
                        return;
                    } else {
                        if ($rootScope.roles.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.roles.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/createRole",
                            data: {rname: rname, rdesc: rdesc,rpolicy:rpolicy},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {roleName: rname.trim(), id: data.row_id, roleDesc: rdesc ,policyId:rpolicy};
                                $rootScope.visible_role = $rootScope.visible_role ? false : true;
                                $rootScope.selectPage($rootScope.noOfPages);
                                $rootScope.roles.push(result_data);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.role_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.role_err_msg = data.err_desc;
                            }
                        });
                    }
                } else if (value == "edit_role_ok") {
                    var rname = "";
                    var rdesc = "";
                    var rid = "";
                    var rpolicy = "";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    rname = $rootScope.roleName;
                    rdesc = $rootScope.roleDesc;
                    rid = $rootScope.roleIds;
                    rpolicy =$rootScope.rolePolicy;
                    if (rname == undefined || rname==""){
                        $rootScope.errName = true;
                        return;
                    } else if (rdesc == undefined || rdesc==""){
                        $rootScope.errNameDesc = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $http({
                            method: "POST",
                            url: "/editRole",
                            data: {rname: rname, rdesc: rdesc, rid: rid,rpolicy:rpolicy},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {roleName: rname.trim(), id: rid, roleDesc: rdesc ,policyId:rpolicy};
                                $rootScope.roles.splice($rootScope.roleIndex, 1, result_data);
                                $rootScope.edit_role = $rootScope.edit_role ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.role_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.role_err_msg = data.err_desc;
                            }
                        });
                    }
                } else if (value == "delete_role_ok") {
                    var rid = "";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    rname = $rootScope.roleName;
                    rdesc = $rootScope.roleDesc;
                    rid = $rootScope.roleIds;
                    if (rid == undefined) {
                        $rootScope.errName = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $http({
                            method: "POST",
                            url: "/deleteRole",
                            data: {rid: rid},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.roles.splice($rootScope.roleIndex , 1);
                                if ($rootScope.roles.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.roles.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_role = $rootScope.delete_role ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.role_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.role_err_msg = data.err_desc;
                            }
                        });
                    }
                } else if (value == "policy_ok") {
                    var polname = "";
                    var poldesc = "";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    polname = $rootScope.policyName;
                    poldesc = $rootScope.policyDesc;
                    if (polname == undefined || polname=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (poldesc == undefined || poldesc=="") {
                        $rootScope.errNameDesc = true;
                        return;
                    }  else if($rootScope.policyElements.length < 1){
                        $rootScope.policy_err_msg = "Please select the policy";
                    }else {
                        if ($rootScope.policiesdata.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.policiesdata.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/createPolicy",
                            data: {polname: polname,poldesc:poldesc, elements: $rootScope.policyElements},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {policyName: polname.trim(), id: data.row_id, policyDesc: poldesc};
                                $rootScope.visible_policy = $rootScope.visible_policy ? false : true;
                                $rootScope.policiesdata.push(result_data);
                                $rootScope.selectPage($rootScope.noOfPages);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.policy_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.policy_err_msg = data.err_desc;
                            }
                        });
                    }
                }
                else if (value == "edit_policy_ok") {
                    var polname = "";
                    var poldesc = "";
                    var polid = "";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    polid = $rootScope.policyId;
                    polname = $rootScope.policyName;
                    poldesc = $rootScope.policyDesc;
                    if (polname == undefined || polname=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (poldesc == undefined || poldesc=="") {
                        $rootScope.errNameDesc = true;
                        return;
                    }  else {
                        $rootScope.errName = false;
                        $http({
                            method: "POST",
                            url: "/editPolicy",
                            data: {polid:polid,polname: polname,poldesc:poldesc, elements: $rootScope.policyElements},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {policyName: polname.trim(), id:polid, policyDesc: poldesc};
                                $rootScope.policiesdata.splice($rootScope.policyIndex, 1, result_data);
                                $rootScope.edit_policy = $rootScope.edit_policy ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.policy_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.policy_err_msg = data.err_desc;
                            }
                        });
                    }
                }
                 else if (value == "delete_policy_ok") {
                    var polid ="";
                    $rootScope.errName = false;
                    $rootScope.errNameDesc = false;
                    polid = $rootScope.policyId;
                    if (polid == undefined) {
                        $rootScope.errName = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $http({
                            method: "POST",
                            url: "/deletePolicy",
                            data: {polid: polid},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.policiesdata.splice($rootScope.policyIndex, 1);
                                if ($rootScope.policiesdata.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.policiesdata.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_policy = $rootScope.delete_policy ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.policy_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.policy_err_msg = data.err_desc;
                            }
                        });
                    }
                }
                else if (value == "user_ok") {
                    $rootScope.errName = false;
                    $rootScope.errEmail = false;
                    $rootScope.errPass = false;
                    var uName = "";
                    var uEmail = "";
                    var uPass = "";
                    var uRole = "";
                    var uGroup = "";
                    uName = $rootScope.userName;
                    uEmail = $rootScope.userEmail;
                    uPass =$rootScope.userPass;
                    uRole =$rootScope.userRole;
                    uGroup = $rootScope.userGroup;
                    if (uName == undefined || uName=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (/\s/.test(uName)) {
                        $rootScope.errSpace = true;
                        return;
                    } else if (uEmail == undefined || !emailPattern.test($rootScope.userEmail)) {
                        $rootScope.errName = false;
                        $rootScope.errSpace = false;
                        $rootScope.errEmail = true;
                        return;
                    }else if (uPass == undefined || uPass=="") {
                        $rootScope.errPass = true;
                        return;
                    }else if (uRole == undefined || uRole=="") {
                        $rootScope.errRole = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errEmail = false;
                        $rootScope.errPass = false;
                        $rootScope.errSpace = false;
                        $http({
                            method: "POST",
                            url: "/createUser",
                            data: {uName: uName, uEmail: uEmail,uPass:uPass,uRole:uRole,uGroup:uGroup},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var userCredentials = {uname : uName, passw : uPass,key:data.key,email : uEmail};
				$http({
			 	url : mailUserCredentialsUrl,
			 	data : userCredentials,
			 	method : "post",
			 	headers: {'Content-Type': 'application/json'},
                                }).success(function(data){
                                });
                                //var result_data = {email: uEmail, id: data.row_id, uname: uName ,roleId:uRole};
                                $rootScope.visible_add_user_ = $rootScope.visible_add_user_ ? false : true;
                                //$rootScope.usersdata.push(result_data);
                                location.reload();
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.user_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.user_err_msg = data.err_desc;
                            }
                        });
                    }
                } 
                else if (value == "edit_user_ok") {
                    $rootScope.errName = false;
                    $rootScope.errEmail = false;
                    $rootScope.errPass = false;
                    var uName = "";
                    var uRole = "";
                    var uId = "";
                    var uGroup = "";
                    uName = $rootScope.userName;
                    uRole =$rootScope.userRole;
                    uId =$rootScope.userId;
                    uGroup = $rootScope.userGroup;
                    if (uName == undefined || uName=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (/\s/.test(uName)) {
                        $rootScope.errSpace = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errSpace = false;
                        $http({
                            method: "POST",
                            url: "/editUser",
                            data: {uName: uName,uRole:uRole,uId:uId,uGroup:uGroup},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                location.reload();
                                $rootScope.visible_edit_user_ = $rootScope.visible_edit_user_ ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.user_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.user_err_msg = data.err_desc;
                            }
                        });
                    }
                } 
                 else if (value == "delete_user_ok") {
                    var uId = "";
                    uId =$rootScope.userId;
                        $http({
                            method: "POST",
                            url: "/deleteUser",
                            data: {uId:uId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.usersdata.splice($rootScope.deleteuserIndex , 1);
                                if ($rootScope.usersdata.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.usersdata.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.visible_delete_user_ = $rootScope.visible_delete_user_ ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.user_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.user_err_msg = data.err_desc;
                            }
                        });
                } else if (value == "group_ok") {
                    var groupname = "";
                    var groupdesc = "";
                    $rootScope.errName = false;
                    $rootScope.errDesc = false;
                    $rootScope.group_err_msg = "";
                    groupname = $rootScope.groupName;
                    groupdesc = $rootScope.groupDesc;
                    if (groupname == undefined || groupname=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (groupdesc == undefined || groupdesc=="") {
                        $rootScope.errDesc = true;
                        return;
                    }else if($rootScope.companiesId.length < 1){
                        $rootScope.group_err_msg = "Please select the company";
                    }else {
                        if ($rootScope.groupsdata.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.groupsdata.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/createGroup",
                            data: {groupname: groupname,groupdesc:groupdesc, companyIds: $rootScope.companiesId,compnayProjects: $rootScope.companyProjects},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {groupName: groupname.trim(), id: data.row_id, groupDesc: groupdesc};
                                $rootScope.visible_group = $rootScope.visible_group ? false : true;
                                $rootScope.groupsdata.push(result_data);
                                $rootScope.selectPage($rootScope.noOfPages);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.group_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.group_err_msg = data.err_desc;
                            }
                        });
                    }
                }
                else if (value == "edit_group_ok") {
                    var groupname = "";
                    var groupdesc = "";
                    var gid = "";
                    $rootScope.errName = false;
                    $rootScope.errDesc = false;
                    groupname = $rootScope.groupName;
                    groupdesc = $rootScope.groupDesc;
                    gid = $rootScope.groupId;
                    if (groupname == undefined || groupname=="") {
                        $rootScope.errName = true;
                        return;
                    }else if (groupdesc == undefined || groupdesc=="") {
                        $rootScope.errDesc = true;
                        return;
                    }  else {
                        $rootScope.errName = false;
                        $rootScope.errDesc = false;
                        $http({
                            method: "POST",
                            url: "/editGroup",
                            data: {gid:gid,groupname: groupname,groupdesc:groupdesc, companyIds: $rootScope.companiesId,compnayProjects: $rootScope.companyProjects},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {groupName: groupname.trim(), id: gid, groupDesc: groupdesc};
                                $rootScope.edit_group = $rootScope.edit_group ? false : true;
                                $rootScope.groupsdata.splice($rootScope.groupIndex , 1, result_data);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.group_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.group_err_msg = data.err_desc;
                            }
                        });
                    }
                }
                 else if (value == "delete_group_ok") {
                    var groupId = "";
                    groupId =$rootScope.groupId;
                        $http({
                            method: "POST",
                            url: "/deleteGroup",
                            data: {groupId:groupId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.groupsdata.splice($rootScope.groupIndex , 1);
                                if ($rootScope.groupsdata.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.groupsdata.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_group = $rootScope.delete_group ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.user_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.user_err_msg = data.err_desc;
                            }
                        });
                }
                  else if (value == "customer_ok") {
                    $rootScope.errName = false;
                    $rootScope.errARN = false;
                    $rootScope.errExternalId = false;
                    $rootScope.cust_err_msg = "";
                    var custName = "";
                    var custARN = "";
                    var custServiceARN = "";
                    var custExternalID = "";
                    custName = $rootScope.custName;
                    custARN = $rootScope.custARN;
                    custExternalID =$rootScope.custExternalID;
                    custServiceARN = $rootScope.custserviceARN;
                    if (custName == undefined || custName=='') {
                        $rootScope.errName = true;
                        return;
                    } else if (custARN == undefined || custARN=='') {
                        $rootScope.errARN = true;
                        return;
                    }else if (custExternalID == undefined || custExternalID=='') {
                        $rootScope.errExternalId = true;
                        return;
                    } else {
                        if ($rootScope.customersData.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.customersData.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/createCustomer",
                            data: {custName: custName, custARN: custARN,custExternalID:custExternalID,custServiceARN:custServiceARN},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {customer_name: custName, id: data.row_id, arn: custARN ,external_id:custExternalID, service_arn:custServiceARN};
                                $rootScope.visible_customer = $rootScope.visible_customer ? false : true;
                                $rootScope.customersData.push(result_data);
                                $rootScope.selectPage($rootScope.noOfPages);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.cust_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.cust_err_msg = data.err_desc;
                            }
                        });
                    }
                } else if (value == "edit_customer_ok") {
                    $rootScope.errName = false;
                    $rootScope.errARN = false;
                    $rootScope.errExternalId = false;
                    var custId = "";
                    var custName = "";
                    var custARN = "";
                    var custServiceARN = "";
                    var custExternalID = "";
                    custId = $rootScope.custId;;
                    custName = $rootScope.custName;
                    custARN = $rootScope.custARN;
                    custExternalID =$rootScope.custExternalID;
                    custServiceARN = $rootScope.custserviceARN;
                    if (custName == undefined || custName=='') {
                        $rootScope.errName = true;
                        return;
                    } else if (custARN == undefined || custARN=='') {
                        $rootScope.errARN = true;
                        return;
                    }else if (custExternalID == undefined || custExternalID=='') {
                        $rootScope.errExternalId = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errARN = false;
                        $rootScope.errExternalId = false;
                        $http({
                            method: "POST",
                            url: "/editCustomer",
                            data: {custId:custId,custName: custName, custARN: custARN,custExternalID:custExternalID,custServiceARN:custServiceARN},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {customer_name: custName, id: data.row_id, arn: custARN ,external_id:custExternalID,service_arn:custServiceARN};
                                $rootScope.customersData.splice($rootScope.custIndex , 1, result_data);
                                $rootScope.edit_customer = $rootScope.edit_customer ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.cust_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.cust_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if (value == "delete_customer_ok") {
                    var custId = "";
                    custId =$rootScope.custId;
                        $http({
                            method: "POST",
                            url: "/deleteCustomer",
                            data: {custId:custId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.customersData.splice($rootScope.custIndex , 1);
                                if ($rootScope.customersData.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.customersData.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_customer = $rootScope.delete_customer ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.cust_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.cust_err_msg = data.err_desc;
                            }
                        });
                }else if (value == "tag_ok") {
                    var tagName = $rootScope.tagName;
                    var tagDesc = $rootScope.tagDesc;
                    if (tagName == undefined || tagName=='') {
                        $rootScope.errName = true;
                        return;
                    } else if (tagDesc == undefined || tagDesc==''){
                        $rootScope.errDesc = true;
                        return;
                    } else {
                        if ($rootScope.tagsData.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.tagsData.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/createTag",
                            data: {tagName: tagName, tagDesc: tagDesc},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {tag_name: tagName, id: data.row_id, tag_desc: tagDesc};
                                $rootScope.visible_tag = $rootScope.visible_tag ? false : true;
                                $rootScope.tagsData.push(result_data);
                                $rootScope.selectPage($rootScope.noOfPages);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.tag_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.tag_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if (value == "edit_tag_ok") {
                    $rootScope.errName = false;
                    $rootScope.errDesc = false;
                    var tagName = $rootScope.tagName;
                    var tagDesc = $rootScope.tagDesc;
                    var tagId = $rootScope.tagId;
                    if (tagName == undefined || tagName=='') {
                        $rootScope.errName = true;
                        return;
                    } else if (tagDesc == undefined || tagDesc==''){
                        $rootScope.errDesc = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errDesc = false;
                        $http({
                            method: "POST",
                            url: "/editTag",
                            data: {tagName: tagName, tagDesc: tagDesc,tagId: tagId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {tag_name: tagName, id: tagId, tag_desc: tagDesc};
                                $rootScope.tagsData.splice($rootScope.tagIndex, 1, result_data);
                                $rootScope.edit_tag = $rootScope.edit_tag ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.edit_tag_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.edit_tag_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if (value == "delete_tag_ok"){
                    var tagId = $rootScope.tagId;
                        $http({
                            method: "POST",
                            url: "/deleteTag",
                            data: {tagId:tagId},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.tagsData.splice($rootScope.tagIndex, 1);
                                if ($rootScope.tagsData.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.tagsData.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_tag = $rootScope.delete_tag ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.tag_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.tag_err_msg = data.err_desc;
                            }
                        });
                }else if (value == "command_ok") {
                    var cname = "";
                    var cdesc = "";
                    $rootScope.errName = false;
                    $rootScope.errDesc = false;
                    cname = $rootScope.commandName;
                    cdesc = $rootScope.commandDesc;
                    if (cname == undefined || cname=="") {
                        $rootScope.errName = true;
                        return;
                    } else if (cdesc == undefined || cdesc=="") {
                        $rootScope.errDesc = true;
                        return;
                    } else {
                        if ($rootScope.commands.length % 10 == 0){
                            $rootScope.pages = [];
                            $rootScope.noOfPages = Math.ceil($rootScope.commands.length / $rootScope.numPerPage) + 1;
                            for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                $rootScope.pages.push(j);
                            }   
                        }
                        $http({
                            method: "POST",
                            url: "/addCommand",
                            data: {cname: cname, cdesc: cdesc},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {commandName: cname.trim(), id: data.row_id, commandDesc: cdesc};
                                $rootScope.visible_command = $rootScope.visible_command ? false : true;
                                $rootScope.commands.push(result_data);
                                $rootScope.selectPage($rootScope.noOfPages);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.command_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.command_err_msg = data.err_desc;
                            }
                        });
					}
                   } else if (value == "edit_command_ok") {
                    $rootScope.errName = false;
                    $rootScope.errDesc = false;
                    var commandId = "";
                    var commandName = "";
                    var commandDesc = "";
                    commandId = $rootScope.commandId;;
                    commandName = $rootScope.commandName;
                    commandDesc = $rootScope.commandDesc;
                    if (commandName == undefined || commandName=='') {
                        $rootScope.errName = true;
                        return;
                    } else if (commandDesc == undefined || commandDesc=='') {
                        $rootScope.errDesc = true;
                        return;
                    } else {
                        $rootScope.errName = false;
                        $rootScope.errDesc = false;
                        $http({
                            method: "POST",
                            url: "/editCommand",
                            data: {commandId:commandId , commandName: commandName, commandDesc: commandDesc},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                var result_data = {commandName: commandName.trim(), id: commandId, commandDesc: commandDesc};
                                $rootScope.edit_command = $rootScope.edit_command ? false : true;
                                $rootScope.commands.splice($rootScope.commandIndex, 1, result_data);
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.command_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.command_err_msg = data.err_desc;
                            }
                        });
                    }
                }else if (value == "delete_command_ok") {
                    var comid ="";
                    comid = $rootScope.commandId;
                    if (comid == undefined) {
                        return;
                    } else {
                        $http({
                            method: "POST",
                            url: "/deleteCommand",
                            data: {comid: comid},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                $rootScope.commands.splice($rootScope.commandIndex, 1);
                                if ($rootScope.commands.length % 10 == 0) {
                                $rootScope.pages = [];
                                $rootScope.noOfPages = Math.ceil($rootScope.commands.length / $rootScope.numPerPage);
                                    for (var j = 1; j <= $rootScope.noOfPages; j++) {
                                        $rootScope.pages.push(j);
                                    }
                                    if ($rootScope.currentPage > $rootScope.noOfPages) {
                                        $rootScope.selectPage($rootScope.noOfPages);
                                    } else {
                                        $rootScope.selectPage($rootScope.currentPage);
                                    }
                                }
                                $rootScope.delete_command = $rootScope.delete_command ? false : true;
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else if (data.success == 0) {
                                $rootScope.command_err_msg = "Internal Error!";
                            } else if (data.success == 2) {
                                $rootScope.command_err_msg = data.err_desc;
                            }
                        });
                    }
	     }else if (value == "assign_manager_ok"){
                    var custId = "";
                    var mgrId = "";
                    var mgrIdList = [];
                    custId = $rootScope.customerId;
                    mgrIdList = $rootScope.managerIdList;
                    mgrId = $rootScope.managerIdList.toString();

                    $http({
                            method: "POST",
                            url: "/addcustomerManager",
                            data: {custId:custId, mgrId:mgrId, mgrIdList:mgrIdList},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                                if (data.success == 1){
                                    $rootScope.visibleAssignManager = $rootScope.visibleAssignManager ? false : true;
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "";
                                } else if (data.success == 2){
                                    $rootScope.mgr_err_msg = "Internal Error!";
                                }
                    });
             }else if (value == "change_password_ok") {
                    $rootScope.errNewP = false;
                    $rootScope.errNewR = false;
                    var oldP = "abc";
                    var newP = $rootScope.newPass;
                    var renewP = $rootScope.renewPass;
                    var userId = $rootScope.userId;
                    var passw = $rootScope.passw;
                    if (newP == undefined || newP == "") {
                        $rootScope.errNewP = true;
                        return;
                    } else if (renewP == undefined || renewP == "") {
                        $rootScope.errNewR = true;
                        return;
                    } else if (newP != renewP) {
                        $rootScope.error_msg = "Password not Match";
                        return;
                    } else if (newP.length < 6 || newP.length > 12) {
                        $rootScope.error_msg = "Password must be of min 6 characters and max 12 characters";
                        return;
                    } else {
                        $rootScope.error_msg = "";
                        $rootScope.modal_class = "modal-backdrop fade in loader";
                        $rootScope.change_password = $rootScope.change_password ? false : true;
                        $http({
                            method: "POST",
                            url: "/changePassword",
                            data: {oldP: oldP, newP: newP, uid: userId, passw: passw},
                            headers: {"Content-Type": "application/json"}
                        }).success(function (data) {
                            if (data.success == 1) {
                                alert("Password has been changed successfully.");
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            } else {
                                $rootScope.error_msg = data.err_msg;
                            }
                        });
                    }
                }
            };
            
             $rootScope.setCustomerId = function(id){
			companyService.setId(id);
            };

            $http({
                method: "post",
                url: "/getRole",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.roles = data;
                    });

            $http({
                method: "post",
                url: "/getPoliceElements",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.policeelements = data;
                    });
                    
              $http({
                method: "post",
                url: "/getPolicies",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.policiesdata = data;
                    });
             $http({
                method: "post",
                url: "/getUsers",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.usersdata = data;
                        $rootScope.pages = [];
                        $rootScope.noOfPages = Math.ceil(data.length / $rootScope.numPerPage);
                        for(var j=1 ; j <=$rootScope.noOfPages;j++){
                        $rootScope.pages.push(j);
                        }
                    });
                    
                    $http({
                method: "post",
                url: "/getUserAcessElements",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.userElements = [];
                        for (var i = 0, l = data.length; i < l; i++) {
                            $rootScope.userElements[i.toString()] = data[i].policy_element_id;
                            $rootScope.roleId = data[i].roleId;
                            $rootScope.roleNames = data[i].roleName;
                            if($rootScope.roleId!=1 && $rootScope.roleNames!='Manager'){
                                window.location = "/";
                            }
                        }
                    });
                    
                    
                    $http({
			url : "/getGroupData",
			method : "GET"
		})
		.success(function(data){
				for(var x in data.companydata){
					var projects = [];
					data.companydata[x].projects = [];
					for(var y in data.projectdata){
						if(data.projectdata[y].company_id == data.companydata[x].id){
							projects.push(data.projectdata[y]);
							data.companydata[x].projects = projects;
						}
					}
				}
				$rootScope.companies = data.companydata;
                            });
                            
                              $http({
                method: "post",
                url: "/getGroups",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.groupsdata = data;
                    });
                    
            $http({
                method: "post",
                url: "/getCustomers",
                data:{roleId:$rootScope.roleId},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.customersData = data;
                    });
            $http({
                method: "post",
                url: "/getTags",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.tagsData = data;
                    });
             $http({
                method: "post",
                url: "/getCommands",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.commands = data;
                    });
            $http({
                method: "post",
                url: "/getManagers",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.managers = data;
                    });
            $http({
                method: "post",
                url: "/getLoginUserDetails",
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.uId = data[0].id;
                        $rootScope.password = data[0].passw;
                        $rootScope.name = data[0].uname;
                        $rootScope.roleId = data[0].roleId;
                        $rootScope.roleNames = data[0].roleName;
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