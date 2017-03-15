'use strict';

const exec = require('child_process').execFile;
const PubNub = require('pubnub');

class PiPubNub {
    constructor(deviceId, pubKey, subKey) {
        this.deviceId = deviceId;
        this.pubKey = pubKey;
        this.subKey = subKey;

        this.initPubNub();
    }

    initPubNub() {
        this.pubnub = new PubNub({
            //publishKey: 'pub-c-86adf03f-7f5d-4570-a225-c275c74936f0',
            //subscribeKey: 'sub-c-3aeccb10-0519-11e7-91d0-02ee2ddab7fe',
            publishKey: this.pubKey,
            subscribeKey: this.subKey,
            uuid: this.deviceId, // MSISDN
            ssl: false // true to make requests over HTTPS
        });

        this.addPubNubListeners();
        this.subscribe();
    }

    subscribe() {
        this.pubnub.subscribe({
            channels: ['PiPubNubListener']
        });
    }

    addPubNubListeners() {
        this.pubnub.addListener({
            status: (statusEvent) => {
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log("Listening to channel events.");
                }
            },
            message: (message) => {
                console.log("New Message: ", message);
            },
            presence: (presenceEvent) => {
                // monitor when someone joins/leaves a channel
                // presenceEvent - join, leave timeout or state-change
                console.log('presense: ', presenceEvent);
                // onLeave, remove the event handlers
            }
        });
    }

    publish(msg, channel) {
        const publishConfig = {
            channel: channel, // required. only one channel at a time
            message: msg,
        };

        this.pubnub.publish(publishConfig, (status, response) => {
            console.log('publish success: ', status, response);
        });
    }
};

// scan CPU temprature
class PiCpu {
  constructor(pubNubClient, channel) {
      this.pubNubClient = pubNubClient;
      this.channel = channel;
  }

  scan() {
    exec('cat', ['/sys/class/thermal/thermal_zone0/temp'], (error, stdout, stderr) => {
      if (error) {
        throw error;
      }

      const cpuTemp = stdout.toString().trim();

      this.pubNubClient.publish({cpuTemp: cpuTemp, ts: new Date().getTime(), deviceId: this.pubNubClient.deviceId}, this.channel);
    });
  }
}

class PiSms {
  findModem() {
    exec('mmcli', ['-L'], (error, stdout, stderr) => {
      if (error) {
        throw error;
      }

      const str = stdout.toString();
      const matched = str.match(/Modem\/\d+/);
      const modem = (matched[0].split(/\//))[1];

      this.readLatest(modem);
      //return modem;
    });
  }


  readLatest(modem) {
    exec('mmcli', ['-m',modem,'--messaging-list-sms'], (error, stdout, stderr) => {
      if (error) {
        throw error;
      }

      const str = stdout.toString();
      const matched = str.match(/\/org\/freedesktop\/ModemManager1\/SMS\/\d+/g);
      const tokens = matched[matched.length - 1].split(/\//);
      const found = tokens[tokens.length - 1];

      if (found > 0) {
        // Read SMS
        const smsReader = exec('mmcli', ['-s', found],
          (error, stdout, stderr) => {
            if (error) {
              throw error;
            }

            const msgProps = stdout.toString();
            const msgText = msgProps.match(/text:\s\'.*\'/);

            const smsText = msgText[0].substring("text:".length + 2, msgText[0].length - 1);
            console.log(smsText);

            const keys = smsText.split(',');
            
            // Initialize PubNub
            const pubNubClient = new PiPubNub(keys[0].trim(), keys[1].trim(), keys[2].trim());

            // Read CPU temp
            const piCpu = new PiCpu(pubNubClient, "PiCpuChannel");
            piCpu.scan();
        });
      }

    });
  }
}

const piSms = new PiSms();
var modem = piSms.findModem();

