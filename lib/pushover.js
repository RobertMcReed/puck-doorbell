const Push = require('pushover-notifications');

const { PUSHOVER_TOKEN: token, PUSHOVER_USER: user } = process.env;

const pusher = new Push({
  user,
  token,
});

const msg = {
  title: 'Ding Dong!',
  message: 'Someone is at the door!',
  priority: 1,
};

const send = (sendIt) => {
  if (sendIt !== undefined) {
    pusher.send(msg, (err, res) => {
      console.log(err || res);
    });
  }
};

module.exports = { send };
