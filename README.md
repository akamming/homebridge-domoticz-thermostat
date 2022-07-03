# homebridge-domoticz-thermostat
Homebride thermostat created from domoticz devices

## Why
i built this plugin to publish my own heating solution in domoticz (https://github.com/akamming/Domoticz_Thermostate_Plugin) to homekit to have a nice interface

But i decided to make it generic, so i can reuse, or anyone can reuse it

## how it works

### configure domoticz (if you use the plugin above, it will create these devices. But if you have any other system):
Make sure you have 4 devices in domoticz representing your heating/cooling system:
- a setpoint device stating the target room temperature
- a temperature device stating your current room temperature 
- a selector switch which indicates your current heating/cooling state (use level 0 for off, level 10 for heating, level 20 for cooling).
- a selector switch which indicates if your target heating/cooling state (use lovel 0 for off, level 10 for only heating, level 20 for only cooling, level 30 to have your system decide wheter to cool or heat).

### install the plugin
- install homebridge using the manuals on homebridge.io
- login to homebridge
- go to the plugins tab
- in the search bar: enter "domoticz thermostat"  and press enter
- install this plugin (it is called Homebridge Domoticz Thermostat)
- Enter your domoticz api adress and port, and the 4 device numbers of the domoticz devices mentioned above
- Restart homebridge


And you are in business!!
