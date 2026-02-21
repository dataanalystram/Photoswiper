#!/bin/bash

echo "📸 Setting up Photo Swiper for Mac/Linux..."
echo "==========================================="

# Check for Node.js
if ! command -v npm &> /dev/null
then
    echo "❌ Error: npm is not installed. Please install Node.js from https://nodejs.org/"
    exit
fi

echo "📦 Installing Dependencies..."
npm install

echo "🚀 Starting Photo Swiper..."
echo "Your browser should open automatically in a few seconds..."

# Start the dev server in the background
npm run dev &

# Wait a few seconds for server to start
sleep 4

# Open the browser
if which open > /dev/null
then
  open http://localhost:3000
elif which xdg-open > /dev/null
then
  xdg-open http://localhost:3000
elif which gnome-open > /dev/null
then
  gnome-open http://localhost:3000
else
  echo "🌐 Please manually open http://localhost:3000 in your browser."
fi

# Bring the background process back to the foreground so the terminal stays open
wait
