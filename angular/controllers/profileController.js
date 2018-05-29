angular.module("profileController", []).controller("profileController",
	function($scope, $location,$http, $rootScope, companyService, $document, $timeout){
     	$scope.edit = true;
     	$scope.uploadSuccess = false;
     	$scope.keySuccess = false;
     	$scope.ssh_err_display = false;
     	$scope.ssh_err_msg = "";
     	$scope.infoSuccess = false;
     	$scope.shell = "/bin/bash";
     	$scope.visible = false;
     	$rootScope.visible_help = false;
     	$rootScope.visible_company = false;
     	$rootScope.visible_project = false;
     	$rootScope.company_err_msg = "";
     	$rootScope.modal_class = "";
        $rootScope.pid = "";
        if($location.path()=="/profile"){
            $('.search_value').val('');
        }
        $rootScope.modal_class = "modal-backdrop fade in loader";
     	var local_index = -1;
     	var body = angular.element($document[0].body);
     	$scope.createStyle={display:'none'};
		$scope.mfaStyle={display:'none'};
     	
     	$http({
			url : "/getUserData",
			method : "GET"
		})
		.success(function(data){
                                $rootScope.companydata = data.companydata;
				$scope.userId = data.userdata.id;
				$scope.name = data.userdata.uname;
				$scope.email = data.userdata.email;
                                $rootScope.roleId = data.userdata.roleId;
                                $rootScope.roleNames = data.userdata.roleName;
				$rootScope.name=data.userdata.uname;
				$scope.ssh_key = data.userdata.ssh_key;
				
				if(data.userdata.mfaEnabled == 0){
					$scope.mfaStyle={display:'block'};
				}
				if(data.companydata == null){
					$scope.createStyle={display:'block'};
				}
				for(var x in data.companydata){
					var projects = [];
                                        var servers = [];
                                        var liveservers = [];
                                        data.companydata[x].servers = [];
                                        data.companydata[x].Liveservers = [];
					data.companydata[x].projects = [];
					for(var y in data.projectdata){
						if(data.projectdata[y].company_id == data.companydata[x].id){
							projects.push(data.projectdata[y]);
							data.companydata[x].projects = projects;
						}
					
                                        for(var z in data.serverdata){
                                            if(data.serverdata[z].company_id == data.companydata[x].id && data.serverdata[z].project_id ==data.projectdata[y].project_id){
                                                if(data.serverdata[z].ssm_status=='Alive' || data.serverdata[z].ssm_status=='Online'){
                                                       liveservers.push(data.serverdata[z]);
                                                 }
                                                    servers.push(data.serverdata[z]);
                                            }
                                            data.companydata[x].servers = servers;
                                            data.companydata[x].Liveservers = liveservers;
                                        }
                                      }
                                         
				}
                                $rootScope.modal_class="";
				$rootScope.compnaies = data.companydata;	
				
				if (typeof data.userdata.shell !== "undefined" && data.userdata.shell != "" && data.userdata.shell != null) {
                   $scope.shell = data.userdata.shell;
                }
				
				if (typeof data.userdata.linuxName !== "undefined" && data.userdata.linuxName != "" && data.userdata.linuxName != null) {
                    $scope.linuxName=data.userdata.linuxName;
                }else{
                	$scope.linuxName=data.userdata.uname;
                }
        });

		$scope.editUser = function() {
			$scope.edit = false;
		};
                $rootScope.setServerId = function(id,ssm_status){
                        if(ssm_status!="Alive"){
                            alert("SSM is not running. Please start SSM to acess server details.")
                            return false;
                        }
                        window.location ="#/serverDetails";
                        companyService.setId(id);
                };
                $rootScope.clearSearch= function(){
                    $rootScope.search = "";
                    $rootScope.searchData = "";
                    $('.search_value').val('');
                };
                $scope.changePassword = function(id, password) {
                    $rootScope.change_password = $rootScope.change_password ? false : true;
                    $rootScope.oldPassword = true;
                    $rootScope.uid = id;
                    $rootScope.passw = password;
                    $rootScope.oldPass = "";
                    $rootScope.newPass ="";
                    $rootScope.renewPass = "";
		    if($rootScope.change_password) {
			 body.addClass("overflowHidden");
			 $rootScope.modal_class = "modal-backdrop fade in";
		    }else{
			 body.removeClass("overflowHidden");
		         $rootScope.modal_class = "";
		    }
                };
		$scope.saveUser = function() {
			$scope.edit = true;
			$http({
				method : "POST",
				url : "/save_profile_info",
				data : {shell : $scope.shell, linux_uname : $scope.linuxName},
				headers : {"Content-Type" : "application/json"}
			})
			.success(function(data) {
				if (data.success == 1) {
					$scope.infoSuccess = true;
				} else {
					$scope.infoSuccess = false;
				}
			});
		};

		$scope.upload = function() {
			var file = $scope.user_image;
			var formData = new FormData();
			formData.append("file", file);
			$http({
				method : "post",
				url : "/uploadImage",
				data : formData,
				transformRequest : angular.identity,
				headers: {"Content-Type" : undefined}
			})
			.success(function(data) {
				if(data.success == 1){
					$scope.uploadSuccess = true;
				}
				else{
					$scope.uploadSuccess = false;
				}
			});
		};

		$scope.saveKey = function() {
			var sshKey = $scope.ssh_key;
			$scope.ssh_err_display = false;
     		$scope.ssh_err_msg = "";
     		if(sshKey == "" || sshKey == null){
				$scope.ssh_err_display = true;
				$scope.ssh_err_msg = "SSH Public Key must be filled.";
				return;
			}
			$http({
				method : "POST",
				url : "/updateSSHKey",
				data : {sshKey : sshKey},
				headers : {"Content-Type" : "application/json"}
			})
			.success(function(data) {
				if (data.success == 1) {
					$scope.keySuccess = true;
				} else {
					$scope.keySuccess = false;
				}
			});
		};

		$rootScope.setCompanyId = function(id) {
			companyService.setId(id);
		};

		$rootScope.setProjectId = function(id) {
			companyService.setId(id);
		};
                $rootScope.removePid = function() {
			$rootScope.pid='';
		};
                $rootScope.showProjects = function(company_id) {
                    var src = $('.img_'+company_id).attr("src");
                    $('.hideDetails').attr("src","images/plus.png");
                    $('.hiderow').css("display","none");
                    if(src=="images/minus.png"){
                        $('.img_'+company_id).attr("src","images/plus.png");
                        $('.'+company_id).css("display","none");
                    }else{
                        $('.img_'+company_id).attr("src","images/minus.png");
                        $('.'+company_id).css("display","block");
                    }
		};

		$scope.showOptions = function(index) {
			if(local_index != index){
				$scope.visible = false;
			}
			local_index = index;
			$scope.visible = $scope.visible ? false : true;
		};

		$scope.showHelpModal = function() {
			$rootScope.visible_help = $rootScope.visible_help ? false : true;
			if ($rootScope.visible_help) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		};
		$scope.showCompanyModal = function() {
			$rootScope.visible_company = $rootScope.visible_company ? false : true;
			$rootScope.errName = false;
			$rootScope.companyName = "";
			$rootScope.company_err_msg = "";
			if ($rootScope.visible_company) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		};
                
                $scope.showCompanyEditModal = function(id, name, companyIndex) {
			$rootScope.edit_company = $rootScope.edit_company ? false : true;
			$rootScope.errName = false;
                        $rootScope.companyId = id;
			$rootScope.companyName = name;
                        $rootScope.companyIndex = companyIndex;
			$rootScope.company_err_msg = "";
                        $rootScope.liveServerdata = [];
                        $rootScope.serverdata = [];
                        var companydata = $rootScope.companydata;
                        for (var x in companydata){
                            if (companydata[x].id == id){
                                $rootScope.liveserverdata = companydata[x].Liveservers;
                                $rootScope.serverdata = companydata[x].servers;
                            }
                        }
			if ($rootScope.edit_company) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		};
                
                $scope.DeleteCompanyModal = function(id, companyIndex) {
			$rootScope.delete_company = $rootScope.delete_company ? false : true;
			$rootScope.errName = false;
                        $rootScope.companyId = id;
                        $rootScope.companyIndex = companyIndex;
			$rootScope.company_err_msg = "";
			if ($rootScope.delete_company) {
				body.addClass("overflowHidden");
				$rootScope.modal_class = "modal-backdrop fade in";
			} else {
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		};
		
		$rootScope.close = function(value) {
			if(value == "help"){
				$rootScope.visible_help = $rootScope.visible_help ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
			else if(value == "company_cancel"){
				$rootScope.visible_company = $rootScope.visible_company ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
                        else if(value == "edit_company_cancel"){
				$rootScope.edit_company = $rootScope.edit_company ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
                        else if(value == "delete_company_cancel"){
				$rootScope.delete_company = $rootScope.delete_company ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
                        else if(value == "change_password_cancel"){
				$rootScope.change_password = $rootScope.change_password ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
			else if(value == "company_ok"){
					var cname = "";
                                        var liveserverdata = [];
                                        var serverdata = [];
					$rootScope.errName = false;
					cname = $rootScope.companyName;
					if(cname == undefined || cname.trim().length <= 0){
						$rootScope.errName = true;
						return;
					}else{
						$rootScope.errName = false;
						$http({
							method : "POST",
							url : "/createCompany",
							data : {cname : cname.trim()},
							headers : {"Content-Type" : "application/json"}
						}).success(function(data){
							if(data.success == 1){
								var result_data = {companyCreator: data.creator, companyName: cname.trim(), id: data.row_id, projects: [], Liveservers: liveserverdata, servers:serverdata};
								if ($rootScope.compnaies == null) {
									$rootScope.compnaies = [];
								}
								$rootScope.compnaies.push(result_data);
								$rootScope.visible_company = $rootScope.visible_company ? false : true;
								body.removeClass("overflowHidden");
								$rootScope.modal_class = "";
							}
							else if(data.success == 0){
								$rootScope.company_err_msg = "Internal Error!";
							}
							else if(data.success == 2){
								$rootScope.company_err_msg = data.err_desc;
							}
						});
				    }
			}
                        else if(value == "edit_company_ok"){
					var cname = "";
                                        var cid="";
                                        var liveserverdata = [];
                                        var serverdata = [];
					$rootScope.errName = false;
					cname = $rootScope.companyName;
                                        cid = $rootScope.companyId;
                                        liveserverdata = $rootScope.liveserverdata;
                                        serverdata = $rootScope.serverdata;
					if(cname == undefined || cname.trim().length <= 0){
						$rootScope.errName = true;
						return;
					}else{
						$rootScope.errName = false;
						$http({
							method : "POST",
							url : "/editCompany",
							data : {cname : cname.trim(),cid : cid},
							headers : {"Content-Type" : "application/json"}
						}).success(function(data){
							if(data.success == 1){
								var result_data = {companyCreator: data.creator, companyName: cname.trim(), id: cid, projects: [], Liveservers: liveserverdata, servers:serverdata};
								if ($rootScope.compnaies == null) {
									$rootScope.compnaies = [];
								}
                                                                $scope.update = function(cid, result_data) {
                                                                var objects = $rootScope.compnaies;

                                                                for (var i = 0; i < objects.length; i++) {
                                                                    if (objects[i].id === cid) {
                                                                        objects[i] = result_data;
                                                                        break;
                                                                    }
                                                                }
                                                            };
                                                                $rootScope.compnaies.splice($rootScope.companyIndex, 1, result_data);
								$rootScope.edit_company = $rootScope.edit_company ? false : true;
								body.removeClass("overflowHidden");
								$rootScope.modal_class = "";
							}
							else if(data.success == 0){
								$rootScope.company_err_msg = "Internal Error!";
							}
							else if(data.success == 2){
								$rootScope.company_err_msg = data.err_desc;
							}
						});
				    }
			}
                     else if(value == "delete_company_ok"){
                                        var cid="";
					$rootScope.errName = false;
                                        cid = $rootScope.companyId;
					if(cid == undefined){
						$rootScope.errName = true;
						return;
					}else{
						$rootScope.errName = false;
						$http({
							method : "POST",
							url : "/deleteCompany",
							data : {cid : cid},
							headers : {"Content-Type" : "application/json"}
						}).success(function(data){
							if(data.success == 1){
								if ($rootScope.compnaies == null) {
									$rootScope.compnaies = [];
								}
								$rootScope.compnaies.splice($rootScope.companyIndex, 1);
								$rootScope.delete_company = $rootScope.delete_company ? false : true;
								body.removeClass("overflowHidden");
								$rootScope.modal_class = "";
							}
							else if(data.success == 0){
								$rootScope.company_err_msg = "Internal Error!";
							}
							else if(data.success == 2){
								$rootScope.company_err_msg = data.err_desc;
							}
						});
				    }
			}else if(value=="change_password_ok"){
                            $rootScope.errOldP = false;
                            $rootScope.errNewP = false;
                            $rootScope.errNewR = false;
                            var uid = $rootScope.uid;
                            var passw = $rootScope.passw;
                            var oldP = $rootScope.oldPass;
                            var newP = $rootScope.newPass;
                            var renewP = $rootScope.renewPass;
                            if(oldP==undefined || oldP==""){
                                $rootScope.errOldP = true;
                                return ;
                            }else if(newP==undefined || newP==""){
                                $rootScope.errNewP = true;
                                return ;
                            }else if(renewP==undefined || renewP==""){
                                $rootScope.errNewR = true;
                                return ;
                            }else if(newP!=renewP){
                                $rootScope.error_msg = "Password not Match";
                                return ;
                            }else if (newP.length < 6 || newP.length > 12) {
                                $rootScope.error_msg = "Password must be of min 6 characters and max 12 characters";
                                return;
                            }else {
                                $rootScope.error_msg = "";
                                $rootScope.modal_class = "modal-backdrop fade in loader";
                                $rootScope.change_password = $rootScope.change_password ? false : true;
                                $http({
				    method : "POST",
				    url : "/changePassword",
				    data : {oldP : oldP,newP:newP,uid: uid,passw: passw},
				    headers : {"Content-Type" : "application/json"}
				}).success(function(data){
                                    if(data.success == 1){
                                        alert("Password has been changed successfully.");
                                        body.removeClass("overflowHidden");
                                        $rootScope.modal_class = "";
				    }else{
					$rootScope.error_msg = data.err_msg;
			            }         
                                });
                            }
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

		// $timeout(function() {
		//     $scope.createStyle={display:'none'};
		//     $scope.mfaStyle={display:'none'};
		// }, 5000);

});