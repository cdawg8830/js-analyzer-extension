#!/bin/bash

# Remove old package if it exists
rm -f js-analyzer.zip

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Remove any .DS_Store files
find . -name ".DS_Store" -delete

# Create the zip file with required files
zip -r js-analyzer.zip \
    manifest.json \
    popup.html \
    popup.js \
    content.js \
    jspdf.umd.min.js \
    icons/*.png \
    icons/*.svg \
    README.md \
    LICENSE

echo "Package created successfully!"
echo "Don't forget to create and add promotional images:"
echo "1. Small tile (440x280)"
echo "2. Large tile (920x680)"
echo "3. Marquee (1400x560)"
echo ""
echo "And screenshots:"
echo "1. Quick Summary view"
echo "2. SEO Impact analysis"
echo "3. Split View comparison" 