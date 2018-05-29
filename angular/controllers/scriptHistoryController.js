angular.module("scriptHistoryController", []).controller("scriptHistoryController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            if (id == undefined) {
                id = $window.localStorage.getItem('scriptId');
            }
            $rootScope.searchBarAllowed = 0;
            $window.localStorage.setItem('scriptId', id);
            $rootScope.setHistoryId = function(history_id){
                  companyService.setId(history_id);
	    };
            $rootScope.setScriptId = function(id){
			companyService.setId(id);
	    };
            $http({
                method: "post",
                url: "/getScriptHistory",
                data: {script_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data){
                        $rootScope.scriptHistory = data;
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
            