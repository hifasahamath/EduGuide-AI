/**
 * Vercel Serverless Function Handler
 * Bridges Express app to Vercel's serverless environment.
 */
const app = require('../server/server');

module.exports = (req, res) => {
  return app(req, res);
};
