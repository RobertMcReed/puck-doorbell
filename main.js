require('dotenv').load();
const Puck = require('./lib/puck');
const Webcam = require('./lib/opencv');
const Pusher = require('./lib/pushover');

const { log } = require('./lib/util');
const { initHueProm } = require('./lib/hue');

const main = async () => {
  let run = true;
  const {
    PUCKS,
    HUE_USERNAME,
    PUSH_DELAY = 30,
    FLASH_DELAY = 15,
  } = process.env;

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
    let lastClick = null;
    let lastDetection = Date.now();

    const pushOk = () => (Date.now() - lastDetection > PUSH_DELAY * 1000);
    const clickOk = () => (!lastClick || Date.now() - lastClick > FLASH_DELAY * 1000);

    const sendPicture = (image) => {
      log.info('Sending picture...');
      const buff = Buffer.isBuffer(image) ? image : Webcam.frameToBuff(image);
      Pusher.send(buff);
    };

    const handleFrame = (frame, numDetections) => {
      if (numDetections && pushOk()) {
        lastDetection = Date.now();
        sendPicture(frame);
      }
    };

    const hue = await initHueProm();
    const cam = new Webcam({ handleFrame });

    const handleClick = (lastAdvert, currentAdvert) => {
      if (!lastAdvert) return;

      if (clickOk()) {
        log.info('Ding Dong! Someone is at the door.');
        lastClick = Date.now();
        hue.handlePuckClick(lastAdvert, currentAdvert);

        if (pushOk()) {
          const buff = cam.getFrameBuff();
          sendPicture(buff);
        }
      } else {
        log.err('Stop clicking so quickly!');
      }
    };

    cam.start();

    return (new Puck({ handleClick }));
  }
};

if (!module.parent) main().catch(log.err);
