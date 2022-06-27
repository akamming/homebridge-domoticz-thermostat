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
  private CurrentHeatingCoolingState=Characteristic.CurrentHeatingCoolingState.OFF;
  private TargetHeatingCoolingState=Characteristic.TargetHeatingCoolingState.OFF;
  private CurrentTemperatureIDX = 935;
  private TargetTemperatureIDX = 969;
  private TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

  private readonly ThermostatService: Service;
  private readonly informationService: Service;


  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;

    this.ThermostatService = new hap.Service.Thermostat(this.name);

    this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Getting current heating coooling state ");
        callback(undefined, this.CurrentHeatingCoolingState);
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Getting target heating coooling state ");
        callback(undefined, this.TargetHeatingCoolingState);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.TargetHeatingCoolingState = value as number;
        log.info("Target Heating Cooling State was set to: " + this.TargetHeatingCoolingState);
        callback();
      });

      this.ThermostatService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        var url="http://192.168.2.9/json.htm?type=devices&rid="+this.CurrentTemperatureIDX;
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
        var url="http://192.168.2.9/json.htm?type=devices&rid="+this.TargetTemperatureIDX
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
        log.info("Target Temperature set to: " + value);
        callback();
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
