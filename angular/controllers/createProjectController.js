angular.module("createProjectController", []).controller("projectCtrl", 
function($scope, $rootScope, $http, $element, close, companyService) {
var pname = "";
		$scope.errName = false;
		$scope.close = function(result){
			pname = $scope.projectName;
			if(result == "ok" && pname == undefined){
				$scope.errName = true;
				return;
			}
			else if(result == "ok" && pname.trim().length <= 0){
				$scope.errName = true;
				return;
			}

			else if(result == "ok" && pname.trim().length > 0){
				$scope.errName = false;
				$http({
					method : "POST",
					url : "/createProject",
					data : {pname : pname.trim(), cid : companyService.getId()},
					headers : {"Content-Type" : "application/json"}
				}).success(function(data){
					if(data.success == 1){
						$element.modal('hide');
						var result_data = {projectName: pname.trim(), id: data.row_id, company_id: companyService.getId()};
						close(result_data, 500);
					}else{
						$element.modal('hide');
						close(result, 500);
					}
				});
				
			}
			
				
		}
});