angular.module("projectDetailController", []).controller("projectDetailController", 
function($scope, $http, $rootScope, companyService, $window) {
	
var id = companyService.getId();

if(id == undefined || id == null || id == ""){
$window.location.href = "/";
return;
}

$http({
	method : "post",
	url : "/getProject",
	data : {id : id},
	headers : {"Content-Type" : "application/json"}
})
.success(function(data){
	$scope.project_name = data.project.projectName;
	$scope.project_notes = data.project.projectNotes;
});

});