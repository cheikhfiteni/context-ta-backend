// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started.html
const { writeErrorLog} = require('./logger');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
  
const secret_name = "prod/Context-TA/env-variables/v1";

const client = new SecretsManagerClient({
region: "us-east-2",
});

async function getSecret() {
    try {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secret_name,
          VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        })
      );
      if ('SecretString' in response) {
        return JSON.parse(response.SecretString);
      } else {
        const buff = Buffer.from(response.SecretBinary, 'base64');
        return JSON.parse(buff.toString('ascii'));
      }
    } catch (error) {
      throw error;
    }
  }

async function loadSecretsIntoEnv() {
    try {
        const secrets = await getSecret();
        for (const [key, value] of Object.entries(secrets)) {
            process.env[key] = value;
        }
    } catch (error) {
        writeErrorLog(error, true);
    }
}

module.exports = {loadSecretsIntoEnv};