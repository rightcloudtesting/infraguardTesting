angular.module("searchServerController", []).controller("searchServerController",
	function($scope, $location,$http, $rootScope, companyService, $document, $timeout){
     	var local_index = -1;
     	var body = angular.element($document[0].body);
                $rootScope.searchServer = function(){
                    var search_keyword = $('.search_value').val();
                    $rootScope.search ="search_keyword";
                    $http({
				method : "POST",
				url : "/searchServer",
				data : {search_keyword : search_keyword},
				headers : {"Content-Type" : "application/json"}
			})
			.success(function(data) {
				$rootScope.modal_class="";
                                $rootScope.searchData = data;
                                for (var i = 0; i < data.length; i++){
                                    if(data[i].raw_data != null){  
                                       var array= JSON.parse(data[i].raw_data);
                                       $rootScope.searchData[i].instanceState = array.State.Name;
                                       for(var k =0 ; k < array.Tags.length ;k++ ){
                                             if(array.Tags[k]['Key']=="Environment"){
                                                    $rootScope.searchData[i].environmentValue =  array.Tags[k]['Value'];
                                              }
                                       }
                                    }else{
                                      var instanceId = $rootScope.searchData[i].instanceId;
                                      if(instanceId.indexOf("mi-") !== -1){
                                        $rootScope.searchData[i].instanceState = "hybrid";
                                      }
                                    }
                                     window.location = "/#searchServer";
                                }
                                if(data==""){
                                    window.location = "/#searchServer";
                                }
			});
		};
                $rootScope.setServerId = function(id,ssm_status){
                    if(ssm_status!="Alive" && ssm_status!="Online"){
                        alert("SSM is not running. Please start SSM to acess server details.")
                        return false;
                    }
                    window.location ="#/serverDetails";
                    companyService.setId(id);
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
});