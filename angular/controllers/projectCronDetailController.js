angular.module("projectCronDetailController", []).controller("projectCronDetailController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            if (id == undefined || id == null) {
                id = $window.localStorage.getItem('projectId');
            }
            $window.localStorage.setItem('projectId', id);
            $rootScope.showServerDetailModel = function (cron_id) {
                $http({
                    method: "post",
                    url: "/getServersByCron",
                    headers: {"Content-Type": "application/json"},
                    data: {cron_id: cron_id}
                })
                        .success(function (data) {
                            $rootScope.serverCrons = data;
                            $rootScope.cron_server_details = $rootScope.cron_server_details ? false : true;
                            if ($rootScope.cron_server_details) {
                                body.addClass("overflowHidden");
                                $rootScope.modal_class = "modal-backdrop fade in";
                            } else {
                                body.removeClass("overflowHidden");
                                $rootScope.modal_class = "";
                            }
                        });

            };
            $rootScope.DeleteCronFromAllServerModel = function (cron_id) {
                $rootScope.cron_id = cron_id;
                $rootScope.delete_cron_from_all_server = $rootScope.delete_cron_from_all_server ? false : true;
                if ($rootScope.delete_cron_from_all_server) {
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.close = function (value) {
                if (value == "cron_server_details") {
                    $rootScope.cron_server_details = $rootScope.cron_server_details ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "delete_cron_cancel") {
                    $rootScope.delete_cron_from_all_server = $rootScope.delete_cron_from_all_server ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                } else if (value == "delete_cron_ok") {
                    var cron_id = $rootScope.cron_id;
                    $http({
                        method: "post",
                        url: "/deleteCronFromAllServers",
                        headers: {"Content-Type": "application/json"},
                        data: {cron_id: cron_id}
                    })
                            .success(function (data) {
                                if (data.success == 1) {
                                    $rootScope.delete_cron_from_all_server = $rootScope.delete_cron_from_all_server ? false : true;
                                    body.removeClass("overflowHidden");
                                    $rootScope.modal_class = "";
                                    location.reload();
                                } else if (data.success == 0) {
                                    $rootScope.cron_delete_err_msg = "Internal Error!";
                                } else if (data.success == 2) {
                                    $rootScope.cron_delete_err_msg = data.err_desc;
                                }
                            });
                }
            };
            $http({
                method: "post",
                url: "/getProjectCrons",
                headers: {"Content-Type": "application/json"},
                data: {id: id}
            })
                    .success(function (data) {
                        $rootScope.ProjectCrons = data;
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