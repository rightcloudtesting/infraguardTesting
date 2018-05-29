var logger = require("../../lib/logger").init(function() {
    return("./conf/logging.json");
});

/**
 * Play with log levels in file app-logging.json to see how that affects logging
 */
var log = logger.get("net.renalias.log4js.sample");
log.info("This is logged with INFO priority from the main module");
log.warn("This is logged with WARN priority from the main module");
log.error("This is logged with ERROR priority from the main module");
log.debug("This is logged with DEBUG priority from the main module");

// use our dummy library to demonstrate how non-standard logging only needs to be initialized once
var somelib = require("./lib/somelib");
// This should log something
somelib();