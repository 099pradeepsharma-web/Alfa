#!/bin/bash

# Alfanumrik Development Environment Setup Script
# This script automates the setup process for the Alfanumrik project

set -e  # Exit on any error

echo "🚀 Setting up Alfanumrik Development Environment..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is not supported. Please upgrade to Node.js 18+"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Setup environment file
setup_env_file() {
    print_status "Setting up environment variables..."
    
    if [ -f ".env.local" ]; then
        print_warning ".env.local already exists. Skipping environment setup."
        return
    fi
    
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from template"
        print_warning "Please edit .env.local and add your Gemini API key"
    else
        print_error ".env.example not found. Creating basic .env.local"
        cat > .env.local << EOL
# Alfanumrik Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
VITE_APP_NAME=Alfanumrik
VITE_APP_VERSION=0.0.0
EOL
        print_success "Created basic .env.local file"
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        print_error ".env.local file not found"
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules directory not found. Dependencies may not be installed."
        return 1
    fi
    
    print_success "Setup verification completed"
}

# Main setup function
main() {
    echo
    print_status "Starting Alfanumrik setup process..."
    echo
    
    check_node
    check_npm
    install_dependencies
    setup_env_file
    verify_setup
    
    echo
    echo "================================================="
    print_success "Setup completed successfully! 🎉"
    echo
    echo "Next steps:"
    echo "1. Edit .env.local and add your Gemini API key"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo
    print_warning "Don't forget to get your Gemini API key from https://ai.studio/"
    echo
}

# Run main function
main