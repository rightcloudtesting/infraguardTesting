module.exports = {
    testConfiguration: function(test) {
        var logger = require("../lib/logger.js");
        test.ok(true);
        test.done();
    },

    testConfigFile: function(test) {
        // Create a new logger with the initial configuration, that is not
        // the default one (we'll use test-logging-config.json instead)
        var logger = require("../lib/logger.js").init(function() {
            return("./test/test-logging-config.json");
        });

        // Test that the logger configuration is as per our config file
        var log1 = logger.get("net.renalias.test.1");
        var log2 = logger.get("net.renalias.test.2");
        test.equals(log1.level.levelStr, "ERROR");
        test.equals(log2.level.levelStr, "INFO");

        // And verify that if we create a new logger object, configuration is
        // cached and there is no need to reload the config file
        var logger2 = require("../lib/logger.js");
        var log1 = logger.get("net.renalias.test.1");
        var log2 = logger.get("net.renalias.test.2");
        test.equals(log1.level.levelStr, "ERROR");
        test.equals(log2.level.levelStr, "INFO");

        test.done();
    }
}