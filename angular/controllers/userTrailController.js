angular.module("userTrailController", []).controller("userTrailController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
             var id = companyService.getId();
            if (id == undefined) {
                id = $window.localStorage.getItem('userId');
            }
            $rootScope.searchBarAllowed = 0;
            $window.localStorage.setItem('userId', id);
            companyService.setId(null);
            $rootScope.setScriptId = function(id){
			companyService.setId(id);
	    };
            $rootScope.showTrailOutputModel = function (script,script_output){
                $rootScope.trailScript = script;
                $rootScope.trailScriptOutput = script_output;
                $rootScope.trail_output = $rootScope.trail_output ? false : true;
                if($rootScope.trail_output){
                     body.addClass("overflowHidden");
                     $rootScope.modal_class = "modal-backdrop fade in";
                }else{
                     body.removeClass("overflowHidden");
                     $rootScope.modal_class = "";
                }
            };
            $rootScope.close = function (value) {
                if (value == "trail_output_ok") {
                    $rootScope.trail_output = $rootScope.trail_output ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
          
            $http({
                method: "post",
                url: "/getUserTrail",
                data: {user_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.userTrail = data;
                    });
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