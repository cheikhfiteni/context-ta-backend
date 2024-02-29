#!/bin/bash

# Stop the existing node server
pkill node || true
pm2 stop my-app || true
pm2 delete my-app || true

# Clean old files
rm -rf /usr/src/app/*