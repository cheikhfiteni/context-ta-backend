#!/bin/bash

# Wait for server to start with retries
max_attempts=5
attempt_num=1

while [ $attempt_num -le $max_attempts ]; do
    echo "Attempt $attempt_num of $max_attempts"
    if curl -f http://localhost:3000/; then
        echo "Server is up!"
        exit 0
    fi
    echo "Server not up yet. Waiting..."
    sleep 5 # wait for 5 seconds before retrying
    ((attempt_num++))
done

echo "Server failed to respond after $max_attempts attempts"
exit 1