angular.module("mfaPageController", []).controller("mfaPageController",
function($scope, $http , $window, $rootScope, $document){

   $rootScope.visibleEMFA = false;
   $rootScope.visibleDMFA = false;
   $rootScope.showBackupCode = false;
   $rootScope.visibleEnableMFA = false;
   $scope.animate = false;

   var secretObj = {};
   var body = angular.element($document[0].body);

    $http({
		url : "/mfaPageData",
		method : "POST"
	})
	.success(function(data){
     $scope.data = data;
     secretObj = data.secret;
     $rootScope.name = data.name;
	});


	$rootScope.displayBackupCode = function(type) {
		$rootScope.showBackupCode = $rootScope.showBackupCode ? false : true;
	};

	$rootScope.whatisMFA = function(type) {
		$scope.animate = !$scope.animate;
	};

	$rootScope.showPopup = function(type) {
		
        if (type == "disable") {
			$rootScope.visibleDMFA = $rootScope.visibleDMFA ? false : true;
			body.addClass("overflowHidden");
			$rootScope.modal_class = "modal-backdrop fade in";
		} else if(type == "enable"){
			$rootScope.visibleEMFA = $rootScope.visibleEMFA ? false : true;
			body.addClass("overflowHidden");
			$rootScope.modal_class = "modal-backdrop fade in";
		}
	};

	$rootScope.closePopup = function(type) {
       if(type == "enableMFAclose"){
			$rootScope.visibleEMFA = $rootScope.visibleEMFA ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
		}else if(type == "disableMFAclose"){
			$rootScope.visibleDMFA = $rootScope.visibleDMFA ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
		}
	};

    $rootScope.enableMFA = function(){

        $http({
			url : "/enableMFA",
			method : "POST",
			data : secretObj,
			headers: {"Content-Type": "application/json"}
		})
		.success(function(data){
			if(data.success==1){
				$scope.data.mfaEnabled = 1;
				$rootScope.visibleEMFA = $rootScope.visibleEMFA ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
        });
    };

    $rootScope.disableMFA = function(){

        $http({
			url : "/disableMFA",
			method : "POST",
			data : secretObj,
			headers: {"Content-Type": "application/json"}
		})
		.success(function(data){
           if(data.success==1){
				$scope.data.mfaEnabled = 0;
				$rootScope.visibleDMFA = $rootScope.visibleDMFA ? false : true;
				body.removeClass("overflowHidden");
				$rootScope.modal_class = "";
			}
		});
    };

    
});