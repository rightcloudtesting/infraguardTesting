angular.module("sshController", []).controller("sshController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var server_ip = companyService.getId();
            $('.ssh').focus();
            $rootScope.setCommand = function (ssh_command){
                $http({
                    method: "post",
                    url: "/sshlog",
                    data: {'ssh_command': ssh_command, 'serverIp': server_ip},
                    headers: {"Content-Type": "application/json"}
                })
                        .success(function (data) {
                            if (data.success == 1) {
                                $('.sshwork').append('ssh@IG:<input style="background:black" type="text" value="'+ssh_command+'"/><div style="white-space: pre;">$ '+data.response+'</div>');
                                $('.ssh').val('');
                            }
                            return;
                        });
            };

        });
