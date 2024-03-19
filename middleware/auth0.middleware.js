const { auth } = require("express-oauth2-jwt-bearer");
const { loadSecretsIntoEnv } = require('../secrets'); // Adjust the path as necessary
const { writeErrorLog } = require('../logger');

async function setupAuthMiddleware() {
  await loadSecretsIntoEnv(); // Ensure secrets are loaded before proceeding

  // Print in red the environment variables to ensure they are loaded
  // DELETE AFTER TESTING!!!

  console.log('\x1b[31m%s\x1b[0m', process.env.AUTH0_DOMAIN);
  console.log('\x1b[31m%s\x1b[0m', process.env.AUTH0_AUDIENCE);
  writeErrorLog(`${process.env.AUTH0_DOMAIN} \n \n  ${process.env.AUTH0_AUDIENCE}`, false);

  const validateAccessToken = auth({
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    audience: process.env.AUTH0_AUDIENCE,
  });

  return validateAccessToken;
}

module.exports = setupAuthMiddleware;