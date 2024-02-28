#!/bin/bash

# Check if the server is up by making a request to the expected endpoint
curl -f http://localhost:3000/ || exit 1