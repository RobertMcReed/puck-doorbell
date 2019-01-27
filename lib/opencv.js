const cv2 = require('opencv4nodejs');
const autobind = require('auto-bind');

const blep = () => {};

class Webcam {
  constructor({
    src,
    show = true,
    breaker,
    handleFrame,
    handleDetect,
  } = {}) {
    this.src = src || 0;
    this.done = false;
    this.show = show;
    this.handleFrame = handleFrame || blep;
    this.handleDetect = handleDetect || blep;
    this.breaker = breaker;
    autobind(this);
  }

  start() {
    this.done = false;
    const delay = 10;
    const wCap = new cv2.VideoCapture(this.src);

    while (!this.done) {
      const frame = wCap.read();
      this.handleFrame(frame);

      if (this.show) {
        cv2.imshow('WEBCAM', frame);
        const key = cv2.waitKey(delay);
        this.done = key === 113;
      }

      this.done = this.breaker();
    }

    cv2.destroyAllWindows();
  }

  stop() {
    this.done = true;
  }
}

module.exports = { Webcam };
