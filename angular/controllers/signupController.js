angular.module("signupController", []).controller("signupCtrl", 
	function($scope, $http, $window, $rootScope){
		var regex_num = /^([0-9]+)$/; //numerics pattern
		var regex_alphanum = /^([a-zA-Z0-9]+)$/; //alphanumerics pattern
		var regex_alpha = /^([a-zA-Z]+)$/; //alpha pattern
		var register_return = true;
		var email = $scope.txtEmail;
		var passw = $scope.txtPassw;
		var uname = $scope.txtUsername;
		var mailUserCredentialsUrl="";

		$http.get('environment.properties').then(function (response) {
        mailUserCredentialsUrl = response.data.mailUserCredentialsUrl;
        });

		var uname_validation = function (uname) {
			if(!regex_alphanum.test(uname)){
			$scope.registerMsg = "Special characters not allowed in Username Field.";
			register_return = false;
			return false;
			}

			else if(regex_num.test(uname)){
			$scope.registerMsg = "Only Numerics not allowed in Username Field.";
			register_return = false;
			return false;
			}
			else{
				return true;
			}
		};
		$rootScope.title = " - Signup";
		$scope.registerMsg = "";
		$scope.registerFailed = false;
		
		$scope.passw_blur = function() {
			$scope.registerFailed = false;
		};

		$scope.email_blur = function() {
			$scope.registerFailed = false;
			var required_cond = $scope.signupForm.txtEmail.$error.required;
			var invalid_con = $scope.signupForm.txtEmail.$error.email;
			if (required_cond == undefined && invalid_con == undefined) {
			$http({
				method : "post",
				url : "/checkEmail",
				data : {email : $scope.txtEmail},
				headers : "{Content-Type : application/json}"
			})
			.success(function(data) {
				if (data.found == 1) {
					$scope.registerMsg = "This email has already taken!";
					$scope.registerFailed = true;
					register_return = false;
				} else {
					$scope.registerMsg = "";
					register_return = true;
				}
			});
			}
		};

		$scope.register = function(){
		email = $scope.txtEmail;
		passw = $scope.txtPassw;
		uname = $scope.txtUsername;
		$scope.registerFailed = false;
		if($scope.signupForm.txtEmail.$error.email && email == undefined){
			$scope.registerMsg = "Email is invalid.";
			$scope.registerFailed = true;
			return;
		}

		if($scope.signupForm.txtPassw.$error.minlength == true || $scope.signupForm.txtPassw.$error.maxlength == true){ 
		// true means minlength is less than 8 and maxlength is 32
			$scope.registerMsg = "Password must be between 8-32 characters.";
			$scope.registerFailed = true;
			return;
		}

		if($scope.signupForm.txtPassw.$error.specialValidate == true){
			$scope.registerMsg = "Password should contain atleast one special character.";
			$scope.registerFailed = true;
			return;
		}

		if($scope.signupForm.txtPassw.$error.upperValidate == true){
			$scope.registerMsg = "Password should contain atleast one uppercase character.";
			$scope.registerFailed = true;
			return;
		}

		if(email == undefined || passw == undefined || uname == undefined){
			$scope.registerMsg = "All Fields are required.";
			$scope.registerFailed = true;
			return;
		}
		register_return = uname_validation(uname);
		if(register_return && !$scope.registerFailed){
		var userdata = {email : email, passw : passw, uname : uname};
		$http({
			url : "/signupAction",
			data : userdata,
			method : "post",
			headers: {'Content-Type': 'application/json'},
		})
		.success(function(data){
			if(data.success==1){
				var userCredentials = {uname : uname, passw : passw,key:data.key,email : email};
				$http({
			 	url : mailUserCredentialsUrl,
			 	data : userCredentials,
			 	method : "post",
			 	headers: {'Content-Type': 'application/json'},
			    }).success(function(data){
			 	     });
				var url =  "/#/login";
				$window.location.href = url;
			}else{
				$scope.registerMsg = "Email must be Unique.";
				$scope.registerFailed = true;
			}
		});
		}
	};
	
});