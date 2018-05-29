angular.module("listInstancesController", []).controller("listInstancesController",
        function ($scope, $rootScope, $http, companyService, $window, $document, $timeout) {
            var body = angular.element($document[0].body);
            var id = companyService.getId();
            if (id == undefined) {
                id = $window.localStorage.getItem('customerId');
            }
            $window.localStorage.setItem('customerId', id);
            $rootScope.pages = [];
            $rootScope.numPerPage = 50;
            $rootScope.noOfPages = 0;
            $rootScope.currentPage = 1;
            $rootScope.sortType     = 'serverName'; 
            $rootScope.sortReverse  = false; 
            $rootScope.searchServer   = ''; 
            $rootScope.noPrevious = function() {
                return $rootScope.currentPage === 1;
              };
              $rootScope.noNext = function() {
                return $rootScope.currentPage === $rootScope.noOfPages;
              };
              $rootScope.isActive = function(page) {
                return $rootScope.currentPage === page;
              };

              $rootScope.selectPage = function(page) {
                if ( ! $rootScope.isActive(page) ) {
                  $rootScope.currentPage = page;
                  $rootScope.onSelectPage({ page: page });
                }
              };

              $rootScope.selectPrevious = function() {
                if ( !$rootScope.noPrevious() ) {
                  $rootScope.selectPage($rootScope.currentPage-1);
                }
              };
              
              $rootScope.selectNext = function() {
                if ( !$rootScope.noNext() ) {
                  $rootScope.selectPage($rootScope.currentPage+1);
                }
              };              

            $rootScope.setCustomerId = function(){
                  companyService.setId(id);
	    };
            $rootScope.modal_class = "modal-backdrop fade in loader";
            $window.localStorage.setItem('customerId', id);
            $rootScope.instanceList = [];
            $rootScope.showInstanceDetailsModel = function (data,serverName){
                if(data == null){
                    alert("No instance detail is available for this server.");
                    return false;
                }
                $rootScope.instance_details = $rootScope.instance_details ? false : true;
                $rootScope.instanceDetails = JSON.parse(data);
                var group_name='';
                var group_id='';
                for(var i=0 ; i < $rootScope.instanceDetails.SecurityGroups.length ; i++){
                    group_name += $rootScope.instanceDetails.SecurityGroups[i].GroupName+" , ";
                    group_id += $rootScope.instanceDetails.SecurityGroups[i].GroupId+" , ";
                }
                $rootScope.groupName = group_name.replace(/,\s*$/, "");
                $rootScope.groupId = group_id.replace(/,\s*$/, "");
                $rootScope.serverName = serverName;
                if ($rootScope.instance_details){
                    body.addClass("overflowHidden");
                    $rootScope.modal_class = "modal-backdrop fade in";
                } else {
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
            $rootScope.syncInstanceData = function (){
                $rootScope.modal_class = "modal-backdrop fade in loader";
                 $http({
                        method: "post",
                        url: "/syncInstanceList",
                        headers: {"Content-Type": "application/json"},
                        data : {id : id}
                  })
                    .success(function (data){
                        if(data.success==1){
                            $rootScope.modal_class="";
                        }
                    });
            };
            $rootScope.displayRawData = function (){
                var value = $('.displayRawData').html();
                if(value == "See Raw Data"){
                    $('.rawdata').css("display","block");
                    $('.displayRawData').html("Hide Row Data");
                }else{
                    $('.rawdata').css("display","none"); 
                    $('.displayRawData').html("See Raw Data")
                }
            };
            $rootScope.close = function (value) {
                if (value == "instance_details_ok") {
                    $rootScope.instance_details = $rootScope.instance_details ? false : true;
                    body.removeClass("overflowHidden");
                    $rootScope.modal_class = "";
                }
            };
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
             $http({
                method: "post",
                url: "/getInstanceList",
                data : {id : id},
                headers: {"Content-Type": "application/json"}
            })
                    .success(function (data) {
                        $rootScope.modal_class="";
                        $rootScope.instanceData = data;
                        $rootScope.noOfPages = Math.ceil(data.length / $rootScope.numPerPage);
                        for(var j=1 ; j <=$rootScope.noOfPages;j++){
                            $rootScope.pages.push(j);
                         }
                        for (var i = 0; i < data.length; i++){
                            if(data[i].raw_data != null){
                               var array= JSON.parse(data[i].raw_data);
                                for(var k =0 ; k < array.Tags.length ;k++ ){
                                     if(array.Tags[k]['Key']=="Environment"){
                                            $rootScope.instanceData[i].environment =  array.Tags[k]['Value'];
                                      }
                                 }
                            }
                        }
                    });
        });