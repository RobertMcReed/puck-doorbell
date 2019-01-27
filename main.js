require('dotenv').load();
const Puck = require('./lib/puck');
const Pusher = require('./lib/pushover');

const { log } = require('./lib/util');
const { initHueProm } = require('./lib/hue');

const state = {
  last: null,
};

const main = async () => {
  const { PUCKS, HUE_USERNAME, TIMEOUT } = process.env;
  let run = true;

  if (!PUCKS) {
    log.err('You must have a comma separated list of PUCKS in a .env file at the root of the project.\n');
    log.info('Run "node discoverPucks.js" with your Puck nearby and powered on to automatically discover and add it to your .env.\n');
    run = false;
  }

  if (!HUE_USERNAME) {
    log.err('You must have a Hue HUE_USERNAME in a .env file at the root of the project.\n');
    log.info('Press the link button on your Hue Bridge and then run "node registerDevice.js" to automatically register your device and add it to your .env.\n');
    run = false;
  }

  if (run) {
    const hue = await initHueProm();

    const handleClick = (lastAdvert, currentAdvert) => {
      if (!lastAdvert) return;

      const { last } = state;
      if (!last || Date.now() - last > (TIMEOUT || 20) * 1000) {
        state.last = Date.now();
        hue.handlePuckClick(lastAdvert, currentAdvert);
        Pusher.send(lastAdvert);
        console.log('Ding Dong!');
      } else {
        console.log('*too soon*');
      }
    };

    return new Puck({ handleClick });
  }
};

if (!module.parent) main().catch(log.err);
