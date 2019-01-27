const cv2 = require('opencv4nodejs');

const port = 0;
const wCap = new cv2.VideoCapture(port);

// loop through the capture
const delay = 10;
let done = false;
while (!done) {
  const frame = wCap.read();
  cv2.imshow('WEBCAM', frame);

  const key = cv2.waitKey(delay);
  done = key === 113;
}
