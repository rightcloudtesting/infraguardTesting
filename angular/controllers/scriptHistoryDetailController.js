angular.module("scriptHistoryDetailController", []).controller("scriptHistoryDetailController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            if (id == undefined) {
                id = $window.localStorage.getItem('historyId');
            }
            $rootScope.searchBarAllowed = 0;
            $window.localStorage.setItem('historyId', id);
            $http({
                method: "post",
                url: "/getAgentActivityDetails",
                data: {history_id: id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data){
                        $rootScope.historyDetail  = data[0];
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
            