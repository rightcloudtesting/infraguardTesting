angular.module("companyService", []).service("companyService", function(){
var id = "";

this.getId = function(){
return this.id;
};	
this.setId = function(id) {
this.id = id;
};

});