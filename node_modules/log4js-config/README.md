log4js-common-config
====================
This module aims to standardize application logging configuration in Node.js with log4js (https://github.com/nomiddlename/log4js-node)
by providing a standard (configurable) naming convention and location for external log4js configuration files.

The advantage is that one single configuration file would be used to customize and control log4js, rather than different modules
providing their own log4js settings, configuration and files.

How to use
----------
Add the following dependency to your ```package.json```, and then run ```npm update```:

```
"dependencies": {
    ...
    "log4js-config": ">= 0.1.0",
    ...
}
```

The log4js-common-config dependency will automatically pull log4js for you so no further dependencies are
explicitly needed.

Logging
-------
Add the following module import statement at the top of the entry point of your application:

```
var logger = require("log4js-config");
```

This will automatically configure logging in your application using a file called ```app-logging.json```, which should
follow log4j's logging configuration file structure: https://github.com/nomiddlename/log4js-node#configuration. This
file can either be placed in the root folder of your application, or in a folder called ```config```.

In order to retrieve a logger, use the ```get``` method followed by a log category name:

```
var log = loger.get("some.log.category.name");
log.debug("debug message");
log.info("info message");
```

Log4js will be automatically configured according to the contents of your ```app-logging.json``` configuration file.

Using non-standard configuration
--------------------------------
If for some reason the default configuration is not sufficient, it is possible to provide the module with a function
that will return the correct name and location of the log4js configuration file using the module's ```init```
method:

```
var logger = require("log4js-config").init(function() {
    return("./settings/logging-config.json");
});
```

It is only necessary to do this once, preferably near or at the very top of the entry point to your application. Subsequent
calls to ```require("log4js-config")``` will use the non-standard configuration automatically.

Testing
-------
Basic unit testing is provided via Grunt and nodeunit:

```
grunt test
```