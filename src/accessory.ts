import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  PlatformConfig,
  PrimitiveTypes,
  Service,
} from "homebridge";
import { IncomingMessage } from "http";
import { Http2ServerRequest } from "http2";

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
let hap: HAP;
var request = require('request');
// var Characteristic: { CurrentHeatingCoolingState: { OFF: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; HEAT: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; COOL: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; }; TargetHeatingCoolingState: { OFF: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; HEAT: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; COOL: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; AUTO: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; }; TemperatureDisplayUnits: { CELSIUS: string | number | boolean | PrimitiveTypes[] | { [key: string]: PrimitiveTypes; } | null | undefined; }; };
/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("DomoticzThermostat", ThermostatAccessory);
};

class ThermostatAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private username="";
  private password="";
  private ApiAddress="";
  private port="";
  private CurrentHeatingStateIDX = 0;
  private TargetHeatingStateIDX = 0; 
  private CurrentTemperatureIDX = 0; 
  private TargetTemperatureIDX = 0; 
  private TargetHeatingCoolingStateMaxValue=hap.Characteristic.TargetHeatingCoolingState.HEAT;

  private readonly ThermostatService: Service;
  private readonly informationService: Service;


  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.ApiAddress = config.ApiAddress;
    this.port=config.port;
    if (config.username){
      this.username=config.username;
    }
    if (config.password) {
      this.password=config.password;
    }
    this.CurrentHeatingStateIDX=config.CurrentHeatingCoolingStateIDX;
    this.TargetHeatingStateIDX=config.TargetHeatingCoolingStateIDX;
    this.CurrentTemperatureIDX=config.CurrentTemperatureIDX;
    this.TargetTemperatureIDX=config.TargetTemperatureIDX;
    if (config.TargetHeatingCoolingStateMaxValue=="HEAT") {
      this.TargetHeatingCoolingStateMaxValue=hap.Characteristic.TargetHeatingCoolingState.HEAT;
    } else if (config.TargetHeatingCoolingStateMaxValue=="COOL") {
      this.TargetHeatingCoolingStateMaxValue=hap.Characteristic.TargetHeatingCoolingState.COOL;
    } else if (config.TargetHeatingCoolingStateMaxValue=="AUTO") {
      this.TargetHeatingCoolingStateMaxValue=hap.Characteristic.TargetHeatingCoolingState.AUTO;
    } else {
      this.TargetHeatingCoolingStateMaxValue=hap.Characteristic.TargetHeatingCoolingState.HEAT;
    }

    log.info("Target Heating Cooling State Max Value is "+this.TargetHeatingCoolingStateMaxValue);
 
    this.ThermostatService = new hap.Service.Thermostat(this.name);

    this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.CurrentHeatingStateIDX;
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err) {
            if (response.statusCode==200) {
              try {
                json = JSON.parse(body);
                if (json.result[0].Level==0){
                  return callback(null, hap.Characteristic.CurrentHeatingCoolingState.OFF);
                } else if (json.result[0].Level==10) {
                  return callback(null, hap.Characteristic.CurrentHeatingCoolingState.HEAT);
                } else if (json.result[0].Level==20) {
                  return callback(null, hap.Characteristic.CurrentHeatingCoolingState.COOL);
                } else {
                  log.error("Error: unknown currentheatingcoolingstate");
                  callback(new Error('unknown current heating cooling state'));
                }
              } catch(err) {
                log.error("Error reading domoticz response "+url+" (" + err+ "), is this a valid domotixz selector switch?")
                callback(new Error('invalid response from domoticz'));
              }
            } else {
              log.error("Error: Domoticz returned statuscode "+response.statusCode)
              callback(new Error('domoticz returned statuscode '+response.statusCode+'on '+url));
            }
          } else {
            log.error('Error getting current heating state: '+err);
            callback(new Error(' Error getting current heating state on '+url+', error: '+err));
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.TargetHeatingStateIDX;
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err) {
            if (response.statusCode === 200) {
              try {
                json = JSON.parse(body);
                if (json.result[0].Level==0){
                  return callback(null, hap.Characteristic.TargetHeatingCoolingState.OFF);
                } else if (json.result[0].Level==10){
                  return callback(null, hap.Characteristic.TargetHeatingCoolingState.HEAT);
                } else  if (json.result[0].Level==20){
                  return callback(null, hap.Characteristic.TargetHeatingCoolingState.COOL);
                } else  if (json.result[0].Level==30){
                  return callback(null, hap.Characteristic.TargetHeatingCoolingState.AUTO);
                } else {
                  log.error("Error: Unknown Target HeatingCooling State, check you domoticz switch configuration")
                  callback(new Error('Error: unknown Target Heating Cooling State'))
                }
              } catch (err) {
                log.error("Invalid domoticz reponse readomg Target Heating Cooling state: "+err+", is there a valid Domoticz selector switch at "+url+"?");
                callback(new Error('Invalid response'));
              }
            } else {
              log.error("invalid reponse code: "+response.statusCode+", on "+url)
              callback(new Error('Invalid domoticz respons'))
            }
          } else {
            log.error('Error getting target heating state: ' + err);
            callback(new Error('Error getting target heating state: '+err));
          }
        }).bind(this));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        var url="";
        if (value==hap.Characteristic.TargetHeatingCoolingState.OFF) {
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=Off";
        } else if (value==hap.Characteristic.TargetHeatingCoolingState.HEAT){
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=Set%20Level&level=10";
        } else if (value==hap.Characteristic.TargetHeatingCoolingState.COOL){
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=Set%20Level&level=20";
        } else if (value==hap.Characteristic.TargetHeatingCoolingState.AUTO){
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=Set%20Level&level=30";
        }
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err) {
            if (response.statusCode === 200) {
                return callback(null);
            } else {
              log.error('Invalid status code '+response.statusCode+' on '+url);
              callback (new Error('Invalid statuscode'))
            }
          } else {
            log.error('Error setting target heating state: %s', err);
            callback(new Error('Error setting target heating state '+err))
          }
        }).bind(this));
      }).setProps({
        minValue: hap.Characteristic.TargetHeatingCoolingState.OFF,
        maxValue: this.TargetHeatingCoolingStateMaxValue
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.CurrentTemperatureIDX;
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
              try {
                json = JSON.parse(body);
                return callback(null, json.result[0].Temp);
              } catch(err) {
                log.error("Invalid response reading current temperature: "+err+", is there a valid temperature domoticz sensor at "+url+"?");
                callback(new Error("invalid response"));
              }
          } else {
            log.error('Error getting current current temp: '+err);
            callback(new Error('Error getting current temp: '+err))
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TargetTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.TargetTemperatureIDX;
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
            try {
              json = JSON.parse(body);
             return callback(null, parseFloat(json.result[0].SetPoint));
            } catch (err) {
              log.error("Invalid response reading target temp from domoticz: "+err+", is there a valid demoticz setpoint device at "+url+"?");
              callback(new Error("invalid response"));
            }
          } else {
            log.error('Error getting current target temp: '+err);
            callback(new Error(' Error getting target temp: '+err))
          }
        }).bind(this));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        var url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=setsetpoint&idx="+this.TargetTemperatureIDX+"&setpoint="+value;
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
              return callback(null);
          } else {
            log.error('Error setting  target temp: %s', err);
            callback(new Error("error"));
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TemperatureDisplayUnits)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(null, hap.Characteristic.TemperatureDisplayUnits.CELSIUS);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        callback();
      });

      this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Domoticz")
      .setCharacteristic(hap.Characteristic.Model, "Thermostat");

    log.info("Domoticz Thermostat finished initializing!");
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log("Identify!");
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.ThermostatService,
    ];
  }

}
