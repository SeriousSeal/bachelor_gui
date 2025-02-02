# Installation Guide

## Prerequisites
- Ubuntu 20.04/22.04
- Node.js 22.x
- npm 9.x+
- Docker 20.10+ (optional)
- Docker Compose 2.20+ (optional)

## Local Installation

### 1. Install Node.js
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node -v && npm -v
```

### 2. Set Up Application
```bash
# Clone repository (if not already cloned)
git clone https://github.com/SeriousSeal/bachelor_gui.git
cd bachelor_gui/gui_tensor_expressions

# Install dependencies
npm install

# Start development server
npm start
```

## Docker Installation

### 1. Modify Configuration
```diff
# In package.json
- "homepage": "https://seriousseal.github.io/bachelor_gui"
+ "homepage": "/"
```

### 2. Build & Run Container
```bash
# Build Docker image
docker-compose build

# Start container
docker-compose up

# Access at http://localhost:80
```

## Verification
- Local development: Access via `http://localhost:3000/bachelor_gui`
- Docker: Access via `http://localhost:80`
- Expected: Interactive GUI with tensor visualization components

> **Note**: The Docker configuration uses Nginx for production-optimized serving. For development, prefer the local installation.


getestet als visualisierungsoftware d3, nivo, react-d3-tree
als einfachstes und bestes für den Fall: reactflow
