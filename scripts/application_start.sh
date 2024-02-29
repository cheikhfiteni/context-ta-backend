#!/bin/bash

# Navigate to the working directory
cd /usr/src/app

# Start the node server in the background
pm2 start server.js --name my-app
pm2 save