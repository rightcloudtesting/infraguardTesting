angular.module('resetpwd', []).controller('resetpwdController', function($scope,$window,$http) {
    $scope.newpwd = "";
    $scope.cnfpwd = "";
    $scope.newpwdMsg = "";
    $scope.finalpwdMsg = "";
    $scope.pwdResetSuccess = false;
    $scope.loginUrl = "";

    $scope.resetPassword = function() {
    	$scope.finalpwdMsg = "";
    	var newpwd = $scope.newpwd;
        var cnfpwd = $scope.cnfpwd;
       
        if(newpwd.length==0 || cnfpwd.length==0){
             $scope.finalpwdMsg = "Fields can't be empty.";
        }

        if(newpwd.length!=cnfpwd.length || cnfpwd != newpwd){
             $scope.finalpwdMsg = "Passwords do not match.";
        }

        if(newpwd.length==cnfpwd.length && cnfpwd == newpwd){
             // update user password
             var userId = atob($window.location.href.split("data=")[1]).split("&")[0].split("id=")[1];
             
            $http({
			 	url : "/updatePassword",
			 	data : {userId : userId, pwd : newpwd},
			 	method : "post",
			 	headers: {'Content-Type': 'application/json'},
		    })
		    .success(function(data){
		    	$scope.loginUrl = "http://"+$window.location.host+"/#/login";
		    	$scope.pwdResetSuccess = true;
		    });
        }
    }

    $scope.checkPassValidity = function(modelName) {
    	
    	var passw = $scope.newpwd;
    	$scope.newpwdMsg = "" ;
    	$scope.finalpwdMsg = "";
    	var regex_special = /[*@!#%&()^~{}]+/;
        var regex_upper = /[A-Z]+/;

        if(passw.length<8){
        	$scope.newpwdMsg = "Password length must be between 8-32 characters.";
        }
        else{
        	$scope.newpwdMsg = "";
        }

		if(regex_special.test(passw)){
			$scope.newpwdMsg = $scope.newpwdMsg +"";
		}
		else{
			$scope.newpwdMsg = $scope.newpwdMsg +"Password should contain atleast 1 special symbol.";
		}

		if(regex_upper.test(passw)){
			$scope.newpwdMsg = $scope.newpwdMsg +"";
		}
		else{
			$scope.newpwdMsg = $scope.newpwdMsg +"Password should contain atleast 1 capital letter.";
		}
    }

});