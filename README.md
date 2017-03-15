# A PubSub Client with Secure API Key Bootstrap
This NodeJs-based client uses PubNub to publish CPU temperature and wifi signal strength collected from a Raspberry Pi. The PubNub keys are bootstraped from a secure Aeris SMS.
## Prerequsite
* Raspberry Pi w/ Raspbian
* NodeJS 6.4 and above
* PubNub NodeJS SDK V4
* Aeris SIM
* Celluar Modem

## How to Run the Client
1. Follow all instructions from the [wiki](https://github.com/aerisiot/secure-pubsub/wiki) before running this client.

2. Boot the Raspberry Pi and start a termial console.

3. Download securePubNub.js to a directory on the Pi.

4. Login to your Aeris account at aerport.aeris.com. Find the SIM card by ICCD and then use the "Send SMS" menu in the Dashboard to send a SMS using the format '<device id\>,<PubNub Publish Key\>,<PubNub Subscribe key\>'.

5. On the Pi, run the command:
```sh
$ node securePubNub.js
```

See [wiki](https://github.com/aerisiot/secure-pubsub/wiki) for more information.
