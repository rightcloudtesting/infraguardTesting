angular.module("dashBoard", ["ngRoute","profileController", "HelpController",
"companyDetailController","projectDetailController","createProjectController","fileUploadDirective",
"companyService","serverController","manageUsersController","mfaPageController","roleController",
"serverDetailsController","sshController","cronManagementController","cronDetailController","automationController",
"runScriptController","scriptHistoryController","scriptHistoryDetailController","projectCronController",
"projectCronDetailController","companyCronController","listInstancesController","projectInstanceController","userTrailController","searchServerController"]).config(
function($routeProvider){
	$routeProvider
	.when("/", {
        templateUrl : "pages/companyDetails.html",
        controller : "profileController"
    })
    .when("/project", {
        templateUrl : "pages/projectDetails.html",
        controller : "companyDetailController"
    })
    .when("/server", {
        templateUrl : "pages/serverDetails.html",
        controller : "serverController"
    })
    .when("/profile", {
        templateUrl : "pages/userProfile.html",
        controller : "profileController"
    })
    .when("/mfa", {
        templateUrl : "pages/mfaPage.html",
        controller : "mfaPageController"
    })
    .when("/users", {
        templateUrl : "pages/manageUsers.html",
        controller : "manageUsersController"
    })
    .when("/administration", {
        templateUrl : "pages/administration.html",
        controller : "roleController"
    })
    .when("/serverDetails", {
        templateUrl : "pages/eachServerDetails.html",
        controller : "serverDetailsController"
    })
    .when("/ssh", {
        templateUrl : "pages/ssh.html",
        controller : "sshController"
    })
    .when("/cron", {
        templateUrl : "pages/cronManagement.html",
        controller : "cronManagementController"
    })
    .when("/automation", {
        templateUrl : "pages/automation.html",
        controller : "automationController"
    })
    .when("/cronDetails", {
        templateUrl : "pages/cronDetails.html",
        controller : "cronDetailController"
    })
    .when("/runScript", {
        templateUrl : "pages/runScript.html",
        controller : "runScriptController"
    })
    .when("/scriptHistory", {
        templateUrl : "pages/scriptHistory.html",
        controller : "scriptHistoryController"
    })
    .when("/scriptHistoryDetails", {
        templateUrl : "pages/scriptHistoryDetails.html",
        controller : "scriptHistoryDetailController"
    })
//    .when("/projectCron", {
//        templateUrl : "pages/projectCrons.html",
//        controller : "projectCronController"
//    })
    .when("/projectCronDetails", {
        templateUrl : "pages/projectCronDetails.html",
        controller : "projectCronDetailController"
    })
//    .when("/companyCron", {
//        templateUrl : "pages/companyCron.html",
//        controller : "companyCronController"
//    })
//    .when("/listInstances", {
//        templateUrl : "pages/listInstances.html",
//        controller : "listInstancesController"
//    })
    .when("/projectInstances", {
        templateUrl : "pages/projectListInstances.html",
        controller : "projectInstanceController"
    })
    .when("/userTrail", {
        templateUrl : "pages/userTrail.html",
        controller : "userTrailController"
    })
    .when("/processes", {
        templateUrl : "pages/processes.html",
        controller : "serverDetailsController"
    })
    .when("/searchServer", {
        templateUrl : "pages/searchServer.html",
        controller : "searchServerController"
    })
    .otherwise({
        redirectTo : "/"
    });
});