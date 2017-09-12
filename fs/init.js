/*
 * Copyright (c) 2014-2017 Cesanta Software Limited
 * All rights reserved
 *
 * This example demonstrates how to use mJS Arduino DHT library API
 * to get data from DHTxx temperature and humidity sensors.
 * Datasheet: https://cdn-shop.adafruit.com/datasheets/
 *            Digital+humidity+and+temperature+sensor+AM2302.pdf
 */

// Load Mongoose OS API

load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_arduino_dht.js');
load("api_http.js");

// GPIO pin which has a DHT sensor data wire connected
let pin = 16;

// MQTT topic
let topic = 'myremotesensor/topic';

// Device ID
let deviceID = Cfg.get('device.id');

// Initialize Adafruit DHT library
let dht = DHT.create(pin, DHT.DHT11);

// Initialize a device
dht.begin();

MQTT.sub('brownstone/bedroom/switch/stat/POWER', function(conn, topic, msg) {
  print('Topic:', topic, 'message:', msg);
}, null);

// This function reads data from the DHT sensor every 2 second
Timer.set(60000 /* milliseconds */, true /* repeat */, function() {
  let t = dht.readTemperature(0, 0);
  let h = dht.readHumidity(0);
  let hidx = dht.computeHeatIndex(t, h, 0);

  let JSONStr = JSON.stringify({ deviceid: deviceID, temp: t, humidity: h, heatidx: hidx });
  print('Temperature:', t, '*C');
  print('Humidity:', h, '%');
  print('Heat index:', hidx, '*C');
  print (JSONStr);
  
  let res = MQTT.pub(topic, JSONStr, 1);
  //let res = MQTT.pub(topic, 'hello', 0);
  print('Published:', res ? 'yes' : 'no');
  
  let urlstr = 'https://script.google.com/macros/s/AKfycbzFupgUPO-oAj0jbHXxhHig9A72K216Sz79kZ2pmgIg9fUlvqgX/exec?data1=SHAREDKEY&data2=' + JSONStr;
  // send to google sheet
  HTTP.query({
    url: urlstr,
    //headers: { 'X-Foo': 'bar' },     // Optional - headers
    //data: {foo: 1, bar: 'baz'},      // Optional. If set, JSON-encoded and POST-ed
    success: function(body, full_http_msg) { print(body); },
    error: function(err) { print(err); },  // Optional
  })
  
}, null);

