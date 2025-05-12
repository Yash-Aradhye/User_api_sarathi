#!/bin/bash

# Update system
sudo dnf update -y

# Install Node.js and npm for Amazon Linux 2023
# First install Node.js repository
sudo dnf install -y nodejs20

# If you specifically need Node.js 18, use this alternative instead:
# curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
# sudo dnf install -y nodejs

# Install development tools (needed for some npm packages)
sudo dnf groupinstall -y "Development Tools"

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
mkdir -p ~/counselling/Backend/User_api

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "EC2 instance setup complete!"