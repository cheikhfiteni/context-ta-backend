const { auth } = require("express-oauth2-jwt-bearer");
const { loadSecretsIntoEnv } = require('../secrets'); // Adjust the path as necessary
const { writeErrorLog } = require('../logger');

// fixed in aws secrets manager, but use as an invariant
function removeQuotes(string) {
  return string.replace(/^"(.+(?="$))"$/, '$1');
}

async function setupAuthMiddleware() {
  await loadSecretsIntoEnv(); // Ensure secrets are loaded before proceeding

  const auth0Domain = removeQuotes(process.env.AUTH0_DOMAIN);
  const auth0Audience = removeQuotes(process.env.AUTH0_AUDIENCE);

  const validateAccessToken = auth({
    issuerBaseURL: `https://${auth0Domain}`,
    audience: auth0Audience,
  });

  return validateAccessToken;
}

module.exports = setupAuthMiddleware;