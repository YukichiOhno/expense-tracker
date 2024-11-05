const pino = require('pino');
const pretty = require('pino-pretty');

// Create a logger with pino-pretty and configure it to only show the message
const logger = pino({
  level: process.env.NODE_ENV == 'development' ? 'debug' : 'silent',
}, pretty({
  messageKey: 'msg',  // Only output the message field
  ignore: 'pid,hostname,time',  // Ignore other fields
}));

module.exports = logger;