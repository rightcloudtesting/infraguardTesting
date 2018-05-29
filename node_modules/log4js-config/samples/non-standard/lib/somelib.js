/**
 * This demonstrates how when using non-standard configuration settings, configuration only needs to be applied
 * once and it is used/inherited by all subsequent calls to the module code.
 */
var log = require("../../../lib/logger.js").get("net.renalias.log4js.sample.somelib");

module.exports = function() {
    log.info("This is logged with INFO priority from the somelib module");
    log.warn("This is logged with WARN priority from the somelib module");
    log.error("This is logged with ERROR priority from the somelib module");
    log.debug("This is logged with DEBUG priority from the somelib module");
}