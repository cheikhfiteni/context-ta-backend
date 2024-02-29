#!/bin/bash

# Stop the existing node server
pm2 stop my-app || true
pm2 delete my-app || true