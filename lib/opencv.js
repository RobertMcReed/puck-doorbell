const cv2 = require('opencv4nodejs');
const autobind = require('auto-bind');
const { log } = require('./util');

const blep = () => {};

class Webcam {
  constructor({
    src = 0,
    show = true,
    detect = true,
    breaker = blep,
    handleFrame = blep,
    handleDetect = blep,
  } = {}) {
    this.src = src;
    this.show = show;
    this.done = false;
    this.detect = detect;
    this.handleFrame = handleFrame;
    this.handleDetect = handleDetect;
    this.breaker = breaker;
    this.cap = new cv2.VideoCapture(this.src);
    this.classifier = new cv2.CascadeClassifier(cv2.HAAR_FRONTALFACE_ALT2);
    autobind(this);
  }

  start() {
    log.info('Starting Webcam...');
    this.done = false;
    this.interval = setInterval(this.showFrame, 100);
  }

  async showFrame() {
    let key = -1;
    const frame = this.cap.read();
    if (frame.empty) return;

    const rects = await this.detectFaces(frame);
    const numDetections = rects.length;

    if (numDetections) Webcam.drawDetections(frame, rects);

    this.currFrame = frame;
    this.handleFrame(frame, numDetections);

    if (this.show) {
      cv2.imshow('Front Door', frame);
      key = cv2.waitKey(1);
      this.done = this.done || key === 113;
    }

    this.done = this.done || this.breaker();

    if (this.done) this.stop();
  }

  stop() {
    this.done = true;
    clearInterval(this.interval);
    log.info('Shutting down.');
    cv2.destroyAllWindows();
    process.exit(0);
  }

  async detectFaces(frame) {
    try {
      const gray = await frame.bgrToGrayAsync();
      const {
        numDetections,
        objects: rects,
      } = await this.classifier.detectMultiScaleAsync(gray);

      const filtered = rects.filter((rect, i) => numDetections[i] > 10);

      return filtered;
    } catch (e) {
      log.err('Could not detect faces');

      return [];
    }
  }

  getFrameBuff() {
    return this.currFrame ? Webcam.frameToBuff(this.currFrame) : null;
  }

  static frameToBuff(frame) {
    return Buffer
      .from(cv2
        .imencode('.jpg', frame)
        .toString('base64'),
      'base64');
  }

  static drawDetections(frame, rects) {
    rects.forEach((rect) => {
      const thickness = 2;
      frame.drawRectangle(
        rect,
        new cv2.Vec(0, 255, 0),
        thickness,
        cv2.LINE_8,
      );
    });
  }
}

module.exports = Webcam;
