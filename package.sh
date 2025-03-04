#!/bin/bash

# Remove any existing package
rm -f extension.zip

# Create a temporary directory for packaging
mkdir -p temp_package

# Copy required files
cp manifest.json temp_package/
cp content.js temp_package/
cp popup.html temp_package/
cp popup.js temp_package/
cp LICENSE temp_package/
cp README.md temp_package/
cp privacy-policy.md temp_package/

# Create icons directory and copy icons
mkdir -p temp_package/icons
cp icons/icon16.png temp_package/icons/
cp icons/icon48.png temp_package/icons/
cp icons/icon128.png temp_package/icons/

# Create the ZIP file
cd temp_package
zip -r ../extension.zip ./*

# Clean up
cd ..
rm -rf temp_package

echo "Package created as extension.zip"
echo "Ready for Chrome Web Store submission!" 