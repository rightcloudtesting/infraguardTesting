angular.module("manageUsersController", []).controller("manageUsersController", 
function($scope, $http, $rootScope, companyService, $window) {

	$scope.visible = false;
	$scope.users = [{name:'User1'},{name:'User2'},{name:'User3'},{name:'User4'},{name:'User5'}];
    var local_index = -1;

	    $scope.showOptions = function(index) {
			console.log("showOptions.index: ", index, "--", local_index);
			if(local_index != index){
				$scope.visible = false;
			}
			local_index = index;
			$scope.visible = $scope.visible ? false : true;
		};
});