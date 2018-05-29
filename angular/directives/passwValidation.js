angular.module("passwValidation", []).directive("passwValidation", 
function(){
	var passw = "";
	return {
		restrict : "A",
		require : "ngModel",
		link : function(scope, elem, attrs, ctrl){
		if(attrs.name == "txtPassw"){
			elem.on("keyup", function() {
				var regex_special = /[*@!#%&()^~{}]/;
				var regex_upper = /[A-Z]+/;
        		passw = elem.val();
        		if(regex_special.test(elem.val())){
        			ctrl.$setValidity("specialValidate", true);
        		}
        		else{
        			ctrl.$setValidity("specialValidate", false);
				}
        		if(regex_upper.test(elem.val())){
					ctrl.$setValidity("upperValidate", true);
				}
        		else{
        			ctrl.$setValidity("upperValidate", false);
				}
				
			});

		}

		if(attrs.name == "btnSubmit"){
			elem.on("click", function() {
				var regex_special = /[*@!#%&()^~{}]+/;
        		var regex_upper = /[A-Z]+/;
        		if(regex_special.test(passw)){
        			ctrl.$setValidity("specialValidate", true);
        		}
        		else{
        			ctrl.$setValidity("specialValidate", false);
				}
        		if(regex_upper.test(passw)){
					ctrl.$setValidity("upperValidate", true);
				}
        		else{
        			ctrl.$setValidity("upperValidate", false);
				}
				
			});
		}
			
		}
	};
});