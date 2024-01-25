# homebridge-domoticz-thermostat
Homebride thermostat created from domoticz devices

## Why
i built this plugin to publish my own heating solution in domoticz (https://github.com/akamming/Domoticz_Thermostate_Plugin) to homekit to have a nice interface

But i decided to make it generic, so i can reuse, or anyone can reuse it. 

## how it works

this plugin gets the status from 4 domoticz devices and publishes this as 1 thermostat device in homekit. There is no heating/cooling logic in this plugin, it is only the interface to homekit, so any heating/cooling logic must be present in domotcz to make this work.

## how to install

### requisites
This plugin requires domoticz 2023.2 or higher

### configure domoticz (if you use the plugin above, it will create these devices. But if you have any other system):
Make sure you have 4 devices in domoticz representing your heating/cooling system:
- a setpoint device stating the target room temperature
- a temperature device stating your current room temperature 
- (optional): a selector switch which indicates your current heating/cooling state, configure the selector options like below:
![image](https://user-images.githubusercontent.com/30364409/177097461-f883e006-4e57-4bb7-a68a-4a2dfdec5a4a.png)
- a selector switch which indicates if your target heating/cooling state, configure the selector options like below:
![image](https://user-images.githubusercontent.com/30364409/177097341-ca534b92-17bd-4fcf-8ead-f136ed32a307.png)
- make sure you have some mechanisme in domoticz which controls your heating/cooling based on these 4 devices. 

### install the plugin
- if you are new to homebdrige, follow the instructions on https://homebridge.io/ to install a homebridge instance 
- login to homebridge
- go to the plugins tab
- in the search bar: enter "domoticz thermostat"  and press enter
- install this plugin (it is called Homebridge-Domoticz-Thermostat)
- Enter your domoticz api adress and port, a domoticz user and password and the 4 device numbers of the domoticz devices mentioned above
- Restart homebridge

### advanced
- If you want several instances: this can be achied by using the [childbridge functionality](the childbridge functionality). and manually confguring the json config e.g.:
 "accessories": [
        {
            "name": "DomoticzThermostat",
            "ApiAddress": "https://xxx.yyy.zzz.aaa",
            "port": 443,
            "username": "username",
            "password": "password",
            "CurrentHeatingCoolingStateIDX": xxx
            "TargetHeatingCoolingStateIDX": yyy,
            "TargetHeatingCoolingStateMaxValue": "HEAT",
            "CurrentTemperatureIDX": zzz,
            "TargetTemperatureIDX": aaa,
            "accessory": "DomoticzThermostat",
            "_bridge": {
                "username": "0E:B1:17:4E:86:E8",
                "port": 40783
            }
        },
        {
            "name": "DomotixzThermostat2",
            "ApiAddress": "https://xxx.yyy.zzz.aaa",
            "port": 443,
            "username": "username",
            "password": "password",
            "CurrentHeatingCoolingStateIDX": bbb,
            "TargetHeatingCoolingStateIDX": ccc,
            "TargetHeatingCoolingStateMaxValue": "HEAT",
            "CurrentTemperatureIDX": ddd,
            "TargetTemperatureIDX": eee,
            "accessory": "DomoticzThermostat",
            "_bridge": {
                "username": "0E:B1:17:4E:86:E8"
            }
        }
    ],

And you are in business!!
