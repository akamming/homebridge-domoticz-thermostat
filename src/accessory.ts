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
  private TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

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
    log.info("config = "+JSON.stringify(config));

    this.ThermostatService = new hap.Service.Thermostat(this.name);

    this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.CurrentHeatingStateIDX;
        log.info("Getting Current Heating Enabled State from %s",url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
               log.info('response success');
              json = JSON.parse(body);
              log.info('Current Heating Status is %s', json.result[0].Status);
              if (json.result[0].Status=="On"){
                return callback(null, Characteristic.CurrentHeatingCoolingState.HEAT);
              } else {
                return callback(null, Characteristic.CurrentHeatingCoolingState.OFF);
              }
          } else {
            log.info('Error getting current heating state: %s', err);
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.TargetHeatingStateIDX;
        log.info("Getting target  Heating Enabled State from %s",url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
               log.info('response success');
              json = JSON.parse(body);
              log.info('Target Heating Status is %s', json.result[0].Status);
              if (json.result[0].Status=="On"){
                return callback(null, Characteristic.TargetHeatingCoolingState.HEAT);
              } else {
                return callback(null, Characteristic.TargetHeatingCoolingState.OFF);
              }
          } else {
            log.info('Error getting target heating state: %s', err);
          }
        }).bind(this));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        log.info ("Value is "+value);
        var url="";
        if (value==Characteristic.TargetHeatingCoolingState.HEAT || value==Characteristic.TargetHeatingCoolingState.AUTO) {
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=On";
        } else {
          url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=switchlight&idx="+this.TargetHeatingStateIDX+"&switchcmd=Off";
        }
        log.info("Target Target Heating Cooling State set to : " + value + ",using url "+url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
              log.info('response success');
              return callback(null);
          } else {
            log.info('Error setting target heating stat: %s', err);
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.CurrentTemperatureIDX;
        log.info("Getting Current Temperature from %s",url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
               log.info('response success');
              json = JSON.parse(body);
              log.info('Current Temperature in ℃ is %.2f', json.result[0].Temp);
              return callback(null, json.result[0].Temp);
          } else {
            log.info('Error getting current current temp: %s', err);
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TargetTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url=this.ApiAddress+":"+this.port+"/json.htm?type=devices&rid="+this.TargetTemperatureIDX
        log.info("Getting Target Temperature from %s",url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
               log.info('response success');
              json = JSON.parse(body);
              log.info('Target Temperature in ℃ is %.2f', parseFloat(json.result[0].SetPoint));
              return callback(null, parseFloat(json.result[0].SetPoint));
          } else {
            log.info('Error getting current target temp: %s', err);
          }
        }).bind(this));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        var url = this.ApiAddress+":"+this.port+"/json.htm?type=command&param=setsetpoint&idx="+this.TargetTemperatureIDX+"&setpoint="+value;
        log.info("Target Temperature set to: " + value + ",using url "+url);
        return request.get({
          url: url,
          auth: {
            user: this.username,
            pass: this.password
          }
        }, (function (err: string, response: IncomingMessage, body: string) {
          var json;
          if (!err && response.statusCode === 200) {
              log.info('response success');
              return callback(null);
          } else {
            log.info('Error setting  target temp: %s', err);
          }
        }).bind(this));
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TemperatureDisplayUnits)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Getting Temperature Display Units ");
        callback(undefined, this.TemperatureDisplayUnits);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.TemperatureDisplayUnits = value as number;
        log.info("Temperature Display Units was set to: " + this.TemperatureDisplayUnits);
        callback();
      });

      this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(hap.Characteristic.Model, "Custom Model");

    log.info("Thermostat finished initializing!");
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
