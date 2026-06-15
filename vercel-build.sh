#!/bin/bash

# Exit immediately if any command exits with a non-zero status
set -e

# 1. Clone the private repository using the environment variable
echo "Cloning private data repository..."
git clone https://$PRIVATE_REPO_TOKEN@github.com/Navin-Prabhakar/iitp-timetable-sync.git secure_temp

# 2. Copy the secret data to your project root
echo "Copying secret data..."
mkdir -p secret-data
cp -r secure_temp/secret-data/. ./secret-data/

# 3. Clean up the temporary cloned folder
echo "Cleaning up temporary files..."
rm -rf secure_temp

# 4. Run the ACTUAL framework build command natively
echo "Starting project build..."
npx next build