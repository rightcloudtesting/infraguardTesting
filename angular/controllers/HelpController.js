angular.module("HelpController", []).controller("helpCtrl", 
function($scope, close){
$scope.close = function(result) {
	close(result, 500);
}
});