# homebridge-domoticz-thermostat
Homebride thermostat created from domoticz devices

## Why
I built this plugin to publish my own heating solution in domoticz (https://github.com/akamming/Domoticz_Thermostate_Plugin) to homekit to have a nice interface, but i decided to make it generic, so i can reuse, or anyone can reuse it.  (e.g. it  also works on Spirit Zwave Plus or Fibaro heat controller)

## How it works

This plugin retrieves the status from 4 domoticz devices (of which 3 mandatory) and publishes this as 1 thermostat device in homekit. There is no heating/cooling logic in this plugin, it is only the interface from domoticz to homekit

## Installation

### Requisites
This plugin requires domoticz 2023.2 or higher

### Domoticz Configuration :
Make sure you have the following devices in domoticz to represent your heating/cooling system:
- a setpoint device stating the target room temperature
- a temperature device stating your current room temperature 
- (optional): a selector switch which indicates your current heating/cooling state, configure the selector options like below:
![image](https://user-images.githubusercontent.com/30364409/177097461-f883e006-4e57-4bb7-a68a-4a2dfdec5a4a.png). If you don;t have this device, configure as 0.
- a selector switch which indicates if your target heating/cooling state, configure the selector options like below:
![image](https://user-images.githubusercontent.com/30364409/177097341-ca534b92-17bd-4fcf-8ead-f136ed32a307.png)
- make sure you have some mechanisme in domoticz which controls your heating/cooling based on these 4 devices. 

If you use the domoticz plugin mentioned above, or if you are using a fibaro heat controller, or a eurotronic spirit zwaveplus, these devices will automatically be created for you in domoticz)

### Plugin installation
- if you are new to homebdrige, follow the instructions on https://homebridge.io/ to install a homebridge instance 
- login to homebridge
- go to the plugins tab
- in the search bar: enter "domoticz thermostat"  and press enter
- install this plugin (it is called Homebridge-Domoticz-Thermostat)
- Enter your domoticz api adress and port, a domoticz user and password and the 4 device numbers of the domoticz devices representing your heating system
- Restart homebridge
And you are in business!!

### Advanced Config (Multiple thermostats)
If you want configure more than one thermostat in homebridge: this can be achieved by
- Enable the [childbridge feature of homebridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) for this thermostat plugin
- Manually configure the 2nd (or 3rd, etc..) thermostat directly in the json in the homebridge config in the accessories section. Here is a smple config (note that all usernames must be the same or it will not work) :
```
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
```
