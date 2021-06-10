

# service-config

This module was designed for use in NodeJS Raspberry Pi projects to be able to install NodeJS code as a 'systemctl' service using 'parameterized' systemctl service file where only a single parameter is allowed during service install.  Prior to development, I experimented with the 'commander' NPM module.  However, I found it to be overkill for what I needed.  I wanted a simple fly-weight approach to loading a set of named properties that are considered a "profile".

## Configuration

Runtime configuration achieved using is a JSON file defining all named profiles plus a 'static' or common profile.

#### **yahooWeatherRSS_Config.json**

```
{
	"static":{
		"appId":"<appid>",
		"key":"<apikey>",
		"secret":"<apisecret>",
		"debug":false
	},
	"profiles":{
		"8050":{
			"port":8050
		},
		"8060":{
			"port":8060
		},
		"8070":{
			"port":8070
		},
		"8080":{
			"port":8080
		},
		"8080_DEBUG":{
			"port":8080,
			"debug":true
		}
	}
}
```



## Example Usage

This module provides for the use of a single profile name such that it will load and assemble the necessary "options" for running the program.

Here's a snippet of code illustrating usage.

#### yahooWeatherRSS.js

```
#!/usr/bin/env node
'using strict';

const PROFILE_NAME_DEFAULT = "8080";
const CONFIG_LOCATION_DEFAULT = "yahooWeatherRSS_Config.json";
const CACHE_TTL_SECS_DEFAULT = 60;

//=======================================
// Other omitted for brevity.
//=======================================

var _yahooWeatherRssRequestOAuth;
var _debug = false;
var _server = null;
var _cache = null;


function main() {
    let config = new ServiceConfigModule.Configuration(PROFILE_NAME_DEFAULT, __dirname, CONFIG_LOCATION_DEFAULT);
    config.load();
    let requestHeaders = {
        "X-Yahoo-App-Id": config.read("appId","")
    };
    _yahooWeatherRssRequestOAuth = new OAuth.OAuth(
    null,
    null,
    config.read("key",""),
    config.read("secret",""),
    '1.0',
    null,
    'HMAC-SHA1',
    null,
    requestHeaders
    );
    //create a server object:
    _debug = config.read("debug",false);
    let cacheTTLSecs = config.read("cacheTTLSecs", CACHE_TTL_SECS_DEFAULT);
    let cacheCheckPeriod = config.read("cacheCheckPeriod", cacheTTLSecs * 2);
    let cacheUseClones = config.read("cacheUseClones", false);

    // code omitted for brevity    
    _server = Http.createServer(requestHandler);
    _server.listen(config.read("port", PORT_DEFAULT));
}

main();
```



This module uses process.argv[2] to determine the profile name to use.  Next, the object properties (fields) of the 'static' (or common) profile are added followed by any properties of the named profile.

So, using the above example, if profile '8080_DEBUG' is selected the following properties are assembled for use.

	{
		"appId":"<appid>",
		"key":"<apikey>",
		"secret":"<apisecret>",
		"debug":true,
		"port":8080
	},


## Creating the service file

The service file and install / removal template examples.

#### yahooWeatherRSS@.service

```
[Unit]
Description=Yahoo Weather RSS Service
After=network.target

[Service]
ExecStart=/home/pi/node/yahooWeatherRSS/yahooWeatherRSS.js %i
Restart=always
User=pi

# Note Debian/Ubuntu uses 'nogroup', RHEL/Fedora uses 'nobody'

Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/home/pi/node/yahooWeatherRSS
StandardOutput=null
StandardError=journal
#StandardOutput=inherit
#StandardError=inherit

[Install]
WantedBy=multi-user.target
```

#### install-service.sh

```
#!/bin/bash
sudo cp yahooWeatherRSS@.service /etc/systemd/system
sudo systemctl enable yahooWeatherRSS@$1.service
sudo systemctl start yahooWeatherRSS@$1.service
```



#### remove-service.sh

```
#!/bin/bash

sudo systemctl stop yahooWeatherRSS@$1.service
sudo systemctl disable yahooWeatherRSS@$1.service
#sudo rm /etc/systemd/system/yahooWeatherRSS@.service
sudo systemctl daemon-reload
```



### Service Management

From the linux BASH terminal shell you install and remove the service using the parameter name.

./install-service 8080_DEBUG

./remove-service 8080_DEBUG

#### Practical uses

I have multiple projects which I configure and deploy across various Raspberry Pi machines in my home.  I must admit that the use cases for installing multiple instances of a Yahoo Weather RSS Proxy service on a single machine on different ports likely does not exist, but the functionality provided by this module allows me to quickly create and deploy any project using a standardized service framework.  

### Other Notes

I'm sure there are other ways to do this but this worked quite well for my needs.  Here are some of the links I reviewed during R&D of this project.

##### Basic Concepts

https://fedoramagazine.org/systemd-template-unit-files/

##### Detailed linux man information about template units (from above link)

https://www.freedesktop.org/software/systemd/man/systemd.unit.html

##### Other links

https://askubuntu.com/questions/1077778/how-do-i-pass-flags-when-starting-a-systemd-service



