/**
 * This is a very simple module that uses a default file naming convention for applications based
 * on log4js. Simply place a file called app-logging.json in the root folder of your application using
 * log4js' format and add the following snippet of code to all the modules where logging is used:
 *
 * var log = require("../lib/logger").get("com.company.some.log.name")
 *
 */
var log4js = require("log4js"),
    fs = require("fs"),
    _ = require("underscore");

/**
 * Private function that returns the default name of the config file
 *
 * @return {string}
 */
function defaultConfigFileName() {
    return("app-logging.json");
}

/**
 * Private function that returns an array that contains all folders where the logging config
 * file could be located
 *
 * @return {Array}
 */
function defaultSearchPath() {
    return([ "./", "./config"]);
}

/**
 * This is the default function that locates the configuration file, which should be in the root
 * of the application folder structure, be called app-loggin.js and follow log4js' configuration
 * file structure.
 *
 * This function is not exposed by the module so it is a private function.
 *
 * @return {*}
 */
function defaultConfigFileLocator() {
    // allow the environment to override our logic, as per standard log4js
    if (process.env.LOG4JS_CONFIG)
        return(process.env.LOG4JS_CONFIG);

    var foundPath = _(defaultSearchPath()).find(function(path) {
        return(fs.existsSync(path + "/" + defaultConfigFileName()))
    })

    if(foundPath)
        return(foundPath + "/" + defaultConfigFileName())
    else {
        console.error("Can't locate default log4js config file " + defaultConfigFileName() +
            " in any of the pre-defined paths: " + defaultSearchPath());
        return(undefined);
    }
}

/**
 * Exports a single function that configures the logging system using the default values: log file
 * must be called app-logging.json and must always be located in the root folder of the application
 * or in the config/ folder
 *
 * If default values are not sufficient, initialize the logger and then call the init() method providing
 * a function that can be used to locate the configuration file.
 */
module.exports = (function(locateConfigFileFn) {
    var initialized = false;

    return({
        /**
         * Main method that configures log4js using the default log file, if found
         * in any of the standard folders, and returns a logger
         */
        get: function(categoryName) {
            if(!initialized)
                this.init(locateConfigFileFn);

            return(log4js.getLogger(categoryName));
        },

        /**
         * This alternative method can be used to configure log4js with a .json file that is not
         * located in one of the standard folders or that uses a non-standard name. Please note that
         * initialization only needs to happen once, and that log4js remains configured across
         * all subsequent imports of this module.
         *
         * In normal circumstances the default settings should be sufficient.
         */
        init: function(locateConfigFileFn) {
            if(locateConfigFileFn != undefined)
                log4js.configure(locateConfigFileFn());
            else
                log4js.configure(arguments[0]());

            initialized = true;

            return(this);
        },

        // Expose the log4js object in case it's needed
        log4js: log4js
    })
})(defaultConfigFileLocator);