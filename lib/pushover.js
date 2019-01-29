const Push = require('pushover-notifications');
const { log } = require('./util');

const { PUSHOVER_TOKEN: token, PUSHOVER_USER: user } = process.env;

const pusher = new Push({ user, token });

const msg = {
  title: 'Ding Dong!',
  message: 'Someone is at the door!',
  priority: 1,
};

const send = (buffer, filename) => {
  const message = { ...msg };

  if (buffer) {
    message.file = {
      name: filename || `file-${Math.random().toString().slice(2)}.jpg`,
      data: buffer,
    };
  }

  pusher.send(message, (err, res) => {
    const error = (err || JSON.parse(res).status !== 1);

    if (error) log.err('Notification failed to send.');
    else log.info('Notification sent successfully.');
  });
};

module.exports = { send };
