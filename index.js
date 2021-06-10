'using strict';
const fs = require("fs");
const path = require('path');

function _retrieveConfigurationOverrides(argv, profileNameDefault, configLocationDefault) {
    let temp;
    let profileNameFinal = profileNameDefault;
    let configLocationFinal = configLocationDefault;
    ret = {
    }
    for (let j = 0; j < argv.length; j++) {
        switch(j) {
            case 0:
            case 1:
                break;
            case 2:
                temp = "" + argv[j];
                if (temp) {
                    profileNameFinal = temp;
                }
                break;
            case 3:
                temp = "" + argv[j];
                if (temp) {
                    configLocationFinal = temp;
                }
                break;
        }
    }
    return {
        "profileName":profileNameFinal,
        "configLocation":configLocationFinal
    }
}

function _normalizeConfigLocation(baseDirectory, configLocation) {
    return path.isAbsolute(configLocation) ? configLocation : path.normalize(path.join(baseDirectory,configLocation));
}

function _mergeProps(source, target) {
    if (!source || !target) {
        return;
    }
    //var visibleFound = false;
    for (var key in source) {
        if (source.hasOwnProperty(key))
            target[key] = source[key];
    }
}

function _mergeCommonConfiguration(source, target) {
    if (source.hasOwnProperty("static")) {
        let staticConfiguration = source["static"];
        if (typeof(staticConfiguration) === 'object') {
            _mergeProps(staticConfiguration,target);
        } else {
            throw new Error("Configuration section 'static' is not an object.");
        }
    } else {
        throw new Error("Cannot locate configuration section 'static'.");
    }
}

function _mergeProfileConfiguration(source, target, profileName) {
    if (source.hasOwnProperty("profiles")) {
        let profilesConfiguration = source["profiles"];
        if (typeof(profilesConfiguration) === 'object') {
            if (profilesConfiguration.hasOwnProperty(profileName)) {
                let profileConfiguration = profilesConfiguration[profileName];
                if (typeof(profileConfiguration) === 'object') {
                    _mergeProps(profileConfiguration,target);
                }
            } else {
                throw new Error("Cannot locate configuration profile. profileName:" + profileName);
            }
        } else {
            throw new Error("Configuration section 'profiles' is not an object.");
        }
    } else {
        throw new Error("Cannot locate configuration section 'profiles'.");
    }
}

class ConfigurationHelper {
    
    constructor(profileNameDefault, baseDirectory, configLocationDefault) {
        this._configuration = {};
        this._baseDirectory = baseDirectory
        this._profileNameDefault = profileNameDefault;
        this._configLocationDefault = configLocationDefault;
    }

    load() {
        let objOverrides = _retrieveConfigurationOverrides(process.argv,  this._profileNameDefault, this._configLocationDefault,);
        this._profileName = objOverrides["profileName"];
        this._configLocation = objOverrides["configLocation"];
        this._configuration = {};

        let normalizedConfigLocation = _normalizeConfigLocation(this._baseDirectory, this._configLocation)
        let fileText;
        try {
            fileText = fs.readFileSync(normalizedConfigLocation);
        }
        catch(e) {
            //console.error(e);
            throw new Error("Cannot read configuration file.  location:" + normalizedConfigLocation + " details:" + e);
        }
        if (!fileText) {
            throw new Error("Configuration file is empty.  location:" + normalizedConfigLocation);
        }
        let configSource = {};
        try {
            configSource = JSON.parse(fileText);
        }
        catch(e) {
            //console.error(e);
            throw new Error("Cannot parse configuration file.  location:" + normalizedConfigLocation + " details:" + e);
        }
        _mergeCommonConfiguration(configSource,this._configuration);
        _mergeProfileConfiguration(configSource, this._configuration, this._profileName);
        //console.dir(this._configuration);
    } 

    read(key) {
        return this._configuration.hasOwnProperty(key) ? this._configuration[key] : (arguments.length > 1 ? arguments[1] : null);
    }
    
}

module.exports = {
    'Configuration':ConfigurationHelper,
};
