const colorMap = {
  red: LED1, // eslint-disable-line
  green: LED2, // eslint-disable-line
  blue: LED3, // eslint-disable-line
};

let state = 0;

const setAdvertisement = () => {
  state = state < 10 ? state + 1 : 0;

  NRF.setAdvertising( // eslint-disable-line
    {},
    { manufacturer: 0x0590, manufacturerData: [state] } // eslint-disable-line
  );
};

const handlePress = () => {
  colorMap.red.write(1);
  colorMap.blue.write(1);
  setAdvertisement();
};

const handleRelease = () => {
  colorMap.red.write(0);
  colorMap.blue.write(0);
};

setAdvertisement(); // eslint-disable-next-line
setWatch(handlePress, BTN, { edge: 'rising', repeat: true, debounce: 50 }); 
// eslint-disable-next-line
setWatch(handleRelease, BTN, { edge: 'falling', repeat: true, debounce: 50 });
