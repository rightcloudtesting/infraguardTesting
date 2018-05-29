angular.module("myApp", ["ngRoute", "loginController", "signupController", "homeController", 
"passwValidation"]).config(
function($routeProvider){
	$routeProvider
	.when("/", {
        templateUrl : "/pages/homePageContent.html",
        controller : "homeController"
    })
	.when("/login", {
	templateUrl : "/pages/login.html",
	controller : "loginCtrl"
	})
	.when("/signup", {
		templateUrl : "/pages/register.html",
		controller : "signupCtrl"
	})
	.otherwise({
		redirectTo : "/"
	});
});
