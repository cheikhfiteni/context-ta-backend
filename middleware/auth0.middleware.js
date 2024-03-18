const { auth } = require("express-oauth2-jwt-bearer");
require('dotenv').config({ path: '/.env', overwrite: true });

const validateAccessToken = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: process.env.AUTH0_AUDIENCE,
});

module.exports = {
  validateAccessToken,
};
