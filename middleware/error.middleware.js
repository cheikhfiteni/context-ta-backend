const {
  InvalidTokenError,
  UnauthorizedError,
} = require("express-oauth2-jwt-bearer");

const { writeErrorLog } = require("../logger");

const errorHandler = (error, request, response, next) => {
  if (error instanceof InvalidTokenError) {
    const message = "Bad credentials";
  
    // MORE DEBUGGING MAKE SURE TO REMOVE
    const token = request.headers.authorization?.split(' ')[1] || 'No token provided';
    const logMessage = [
      "Error: Bad credentials",
      "Token: " + token,
      "Status: " + error.status,
      "Error Message: " + error.message,
      "Stack Trace: " + error.stack,
      "Request Headers: " + JSON.stringify(request.headers, null, 2)
    ].join('\n\n');
    // use for debugging
    // writeErrorLog(logMessage, true);
    
    response.status(error.status).json({ message });

    return;
  }

  if (error instanceof UnauthorizedError) {
    const message = "Requires authentication";

    response.status(error.status).json({ message });

    return;
  }

  const status = 500;
  const message = "Internal Server Error";

  response.status(status).json({ message });
};

module.exports = {
  errorHandler,
};
