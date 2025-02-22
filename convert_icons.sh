#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# Convert SVG to different PNG sizes with better quality settings
magick icons/icon.svg -density 1200 -background none -resize 16x16 -quality 100 icons/icon16.png
magick icons/icon.svg -density 1200 -background none -resize 48x48 -quality 100 icons/icon48.png
magick icons/icon.svg -density 1200 -background none -resize 128x128 -quality 100 icons/icon128.png

echo "Icons have been generated successfully!" 