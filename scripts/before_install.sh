#!/bin/bash

# Stop the existing node server
pkill node || true

# Clean old files
rm -rf /usr/src/app/*