const { auth } = require("express-oauth2-jwt-bearer");
const { loadSecretsIntoEnv } = require('../secrets'); // Adjust the path as necessary

async function setupAuthMiddleware() {
  await loadSecretsIntoEnv(); // Ensure secrets are loaded before proceeding

  const validateAccessToken = auth({
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    audience: process.env.AUTH0_AUDIENCE,
  });

  return validateAccessToken;
}

module.exports = setupAuthMiddleware;