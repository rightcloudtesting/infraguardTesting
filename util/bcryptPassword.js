var bcrypt = require("bcrypt-nodejs");
var salt = 10;

module.exports = {
	salt : salt,
	generateHash : function(password) {
		var saltVal = bcrypt.genSaltSync(salt);
		var hashVal = bcrypt.hashSync(password, saltVal);
		return hashVal;
	},
	compareHash : function(password, hash) {
		var result = bcrypt.compareSync(password, hash);
		return result;
	}
}