const nodeHue = require('node-hue-api');
const autoBind = require('auto-bind');
const { log, json } = require('./util');

const { HueApi } = nodeHue;

// create a light state for hue api
const createState = () => nodeHue.lightState.create();

const pause = sec => new Promise((resolve) => {
  setTimeout(resolve, sec * 1000);
});

class Hue {
  constructor(ip) {
    this.ip = ip;
    this.username = process.env.HUE_USERNAME;
    const args = process.env.HUE_USERNAME ? [ip, process.env.HUE_USERNAME] : [];
    this.api = new HueApi(...args);
    this.groups = (process.env.GROUPS || '1').split(',');
    autoBind(this);
  }

  // register a new device with bridge
  async registerDevice(deviceDescription) {
    if (this.username) await this.api.pressLinkButton();

    const username = await this.api.registerUser(this.ip, deviceDescription);
    log.info('Device registered successfully.');
    log.info('Username:', username);

    return username;
  }

  // ensure that we can connect to HUE
  async login() {
    const { ipaddress: ip } = await this.api.config();

    if (ip !== this.ip) {
      log.err('Could not reach HUE.');
      log.info('Ensure that you have registered this device with HUE bridge and have set your HUE_USERNAME as an environment variable.');
      process.exit(1);
    } else log.info('Connected to HUE.');
  }

  // get the list of all groups connected to the bridge (including id for turning on/off)
  async getGroups(print = false) {
    const groups = await this.api.groups();

    return print ? json(groups) : groups;
  }

  // get the name and light status of a group
  async getGroupStatus(groupNum) {
    const groups = await this.getGroups();
    const group = groups[groupNum];
    const on = group.state.any_on;
    const { bri } = group.action;
    const brightness = Math.round(bri / 254 * 100);

    return { on, brightness };
  }

  async turnOnGroup(groupNum, brightness) {
    let state = createState().on();
    if (brightness) state = state.brightness(brightness);

    await this.api.setGroupLightState(groupNum, state);
  }

  async turnOffGroup(groupNum) {
    const state = createState().off();

    await this.api.setGroupLightState(groupNum, state);
  }

  async toggleGroup(groupNum) {
    const { on } = await this.getGroupStatus(groupNum);

    if (on) this.turnOffGroup(groupNum);
    else this.turnOnGroup(groupNum);
  }

  async manyToggleGroup(group) {
    const flashes = 4;

    const blep = async (numTimes) => {
      if (!numTimes) return;

      await this.toggleGroup(group);
      await pause(1);
      blep(numTimes - 1);
    };

    blep(flashes);
  }

  async handlePuckClick(lastAdvertising, currentAdvertising) {
    if (lastAdvertising && lastAdvertising !== currentAdvertising) {
      await Promise.all(this.groups.map(this.manyToggleGroup));
    }
  }
}

// get the ip of the first bridge found
const getBridgeIp = async () => {
  const bridges = await nodeHue.nupnpSearch();
  const { ipaddress: ip } = bridges[0];

  return ip;
};

// get the ip of the bridge and instantiate a Hue
const getHue = async () => {
  const ip = await getBridgeIp();
  const hue = new Hue(ip);

  return hue;
};

// instantiate a complete hue instance
const initHueProm = async () => {
  const hue = await getHue();
  await hue.login();

  return hue;
};

const registerDevice = async (deviceDescription) => {
  const hue = await getHue();
  const username = await hue.registerDevice(deviceDescription);

  return username;
};

module.exports = { initHueProm, registerDevice, Hue };
