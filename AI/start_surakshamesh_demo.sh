#!/bin/bash

################################################################################
# SURAKSHAMESH X - INTELLIGENT DEMO LAUNCHER v2.0
# Hardware & Vision Lead: Ankit
# 
# CUSTOM PATHS:
# - AI Server: ~/Documents/AK/Projects/surakshamesh-ai
# - Vision: ~/Documents/AK/Projects/surakshamesh-vision
# - Badge HTML: ~/Documents/AK/Projects/badge_simulation_polling.html
################################################################################

# Colors for beautiful output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION - YOUR CUSTOM PATHS
################################################################################

AI_DIR="$HOME/Documents/AK/Projects/surakshamesh-ai"
VISION_DIR="$HOME/Documents/AK/Projects/surakshamesh-vision"
BADGE_HTML="$HOME/Documents/AK/Projects/badge_simulation_polling.html"

# Service tracking
SERVICES_STARTED=()
FAILED_SERVICES=()

# Trap Ctrl+C for cleanup
trap cleanup INT TERM

cleanup() {
    echo -e "\n${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   🛑 SHUTTING DOWN SURAKSHAMESH X DEMO                ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${CYAN}Stopping services...${NC}\n"
    
    # Stop each service gracefully
    for service in "${SERVICES_STARTED[@]}"; do
        echo -e "${YELLOW}  ⏹  Stopping $service...${NC}"
    done
    
    # Kill all child processes
    pkill -P $$ 2>/dev/null
    
    # Kill processes by name (backup)
    pkill -f "uvicorn main:app" 2>/dev/null
    pkill -f "data_bridge_demo.py" 2>/dev/null
    pkill -f "ngrok http 8000" 2>/dev/null
    
    echo -e "\n${GREEN}✅ All services stopped cleanly.${NC}"
    echo -e "${CYAN}Demo shutdown complete. Thank you!${NC}\n"
    exit 0
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -ne "${CYAN}  ⏳ Waiting for $service_name to be ready"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        echo -ne "."
        sleep 1
        ((attempt++))
    done
    
    echo -e " ${RED}❌ TIMEOUT${NC}"
    return 1
}

# Function to get ngrok URL
get_ngrok_url() {
    local max_attempts=15
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Query ngrok API
        local url=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        
        if [ ! -z "$url" ]; then
            echo "$url"
            return 0
        fi
        
        sleep 1
        ((attempt++))
    done
    
    return 1
}

################################################################################
# STARTUP SEQUENCE
################################################################################

clear
echo -e "${BOLD}${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗███████╗██╗  ██╗ ║
║   ██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝██║  ██║ ║
║   ███████╗██║   ██║██████╔╝███████║█████╔╝ ███████╗███████║ ║
║   ╚════██║██║   ██║██╔══██╗██╔══██║██╔═██╗ ╚════██║██╔══██║ ║
║   ███████║╚██████╔╝██║  ██║██║  ██║██║  ██╗███████║██║  ██║ ║
║   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ║
║                                                              ║
║               MESH X - INTELLIGENT DEMO LAUNCHER             ║
║                         Version 2.0                          ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo -e "${CYAN}Initializing SurakshaMesh X Demo Environment...${NC}\n"
sleep 1

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

echo -e "${BOLD}${YELLOW}📋 PRE-FLIGHT CHECKS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check 1: Required commands
echo -e "${CYAN}[1/6] Checking required commands...${NC}"

REQUIRED_COMMANDS=("python3" "curl" "lsof")
MISSING_COMMANDS=()

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if command_exists "$cmd"; then
        echo -e "  ${GREEN}✅ $cmd${NC}"
    else
        echo -e "  ${RED}❌ $cmd (NOT FOUND)${NC}"
        MISSING_COMMANDS+=("$cmd")
    fi
done

if [ ${#MISSING_COMMANDS[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ FATAL ERROR: Missing required commands: ${MISSING_COMMANDS[*]}${NC}"
    echo -e "${YELLOW}Please install missing dependencies and try again.${NC}\n"
    exit 1
fi

# Check 2: Ngrok installation
echo -e "\n${CYAN}[2/6] Checking ngrok installation...${NC}"
if command_exists "ngrok"; then
    echo -e "  ${GREEN}✅ ngrok found${NC}"
else
    echo -e "  ${RED}❌ ngrok NOT FOUND${NC}"
    echo -e "${YELLOW}  ⚠️  Installing ngrok via Homebrew...${NC}"
    
    if command_exists "brew"; then
        brew install ngrok
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ ngrok installed successfully${NC}"
        else
            echo -e "  ${RED}❌ Failed to install ngrok${NC}"
            echo -e "${YELLOW}  Please install manually: brew install ngrok${NC}"
            FAILED_SERVICES+=("ngrok installation")
        fi
    else
        echo -e "  ${RED}❌ Homebrew not found${NC}"
        echo -e "${YELLOW}  Install Homebrew first: https://brew.sh${NC}"
        echo -e "${YELLOW}  Then run: brew install ngrok${NC}"
        FAILED_SERVICES+=("ngrok")
    fi
fi

# Check 3: Project directories
echo -e "\n${CYAN}[3/6] Checking project directories...${NC}"

if [ -d "$AI_DIR" ]; then
    echo -e "  ${GREEN}✅ AI project found${NC}"
    echo -e "     ${CYAN}Path: $AI_DIR${NC}"
else
    echo -e "  ${RED}❌ AI project NOT FOUND${NC}"
    echo -e "     ${YELLOW}Expected: $AI_DIR${NC}"
    FAILED_SERVICES+=("AI directory")
fi

if [ -d "$VISION_DIR" ]; then
    echo -e "  ${GREEN}✅ Vision project found${NC}"
    echo -e "     ${CYAN}Path: $VISION_DIR${NC}"
else
    echo -e "  ${RED}❌ Vision project NOT FOUND${NC}"
    echo -e "     ${YELLOW}Expected: $VISION_DIR${NC}"
    FAILED_SERVICES+=("Vision directory")
fi

# Check 4: Virtual environments
echo -e "\n${CYAN}[4/6] Checking virtual environments...${NC}"

if [ -f "$AI_DIR/venv/bin/activate" ]; then
    echo -e "  ${GREEN}✅ AI venv found${NC}"
else
    echo -e "  ${RED}❌ AI venv NOT FOUND${NC}"
    echo -e "     ${YELLOW}Expected: $AI_DIR/venv/bin/activate${NC}"
    echo -e "     ${YELLOW}Create it with: cd $AI_DIR && python3 -m venv venv${NC}"
    FAILED_SERVICES+=("AI venv")
fi

if [ -f "$VISION_DIR/venv/bin/activate" ]; then
    echo -e "  ${GREEN}✅ Vision venv found${NC}"
else
    echo -e "  ${RED}❌ Vision venv NOT FOUND${NC}"
    echo -e "     ${YELLOW}Expected: $VISION_DIR/venv/bin/activate${NC}"
    echo -e "     ${YELLOW}Create it with: cd $VISION_DIR && python3 -m venv venv${NC}"
    FAILED_SERVICES+=("Vision venv")
fi

# Check 5: Badge simulator HTML
echo -e "\n${CYAN}[5/6] Checking badge simulator HTML...${NC}"

if [ -f "$BADGE_HTML" ]; then
    echo -e "  ${GREEN}✅ Badge simulator found${NC}"
    echo -e "     ${CYAN}Path: $BADGE_HTML${NC}"
else
    echo -e "  ${RED}❌ Badge simulator HTML NOT FOUND${NC}"
    echo -e "     ${YELLOW}Expected: $BADGE_HTML${NC}"
    echo -e "     ${YELLOW}Please create or move the file to this location${NC}"
    FAILED_SERVICES+=("Badge HTML")
fi

# Check 6: Port availability
echo -e "\n${CYAN}[6/6] Checking port availability...${NC}"

if port_in_use 8000; then
    echo -e "  ${YELLOW}⚠️  Port 8000 already in use${NC}"
    echo -e "  ${YELLOW}Attempting to kill existing process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
    
    if port_in_use 8000; then
        echo -e "  ${RED}❌ Could not free port 8000${NC}"
        echo -e "     ${YELLOW}Please manually kill the process using port 8000${NC}"
        FAILED_SERVICES+=("Port 8000 conflict")
    else
        echo -e "  ${GREEN}✅ Port 8000 freed successfully${NC}"
    fi
else
    echo -e "  ${GREEN}✅ Port 8000 available${NC}"
fi

# Summary of pre-flight checks
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "${RED}❌ PRE-FLIGHT CHECK FAILED${NC}\n"
    echo -e "${YELLOW}The following issues were detected:${NC}"
    for failed in "${FAILED_SERVICES[@]}"; do
        echo -e "  ${RED}• $failed${NC}"
    done
    echo -e "\n${YELLOW}Please fix these issues and try again.${NC}\n"
    exit 1
else
    echo -e "${GREEN}✅ ALL PRE-FLIGHT CHECKS PASSED${NC}\n"
fi

sleep 2

################################################################################
# SERVICE STARTUP
################################################################################

echo -e "${BOLD}${YELLOW}🚀 STARTING SERVICES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

################################################################################
# SERVICE 1: AI Server
################################################################################

echo -e "${MAGENTA}[1/4] 🧠 Starting AI Server (surakshamesh-ai)...${NC}"

osascript -e 'tell application "Terminal"
    do script "cd '"$AI_DIR"' && source venv/bin/activate && clear && echo \"🧠 SurakshaMesh X - AI Server\" && echo \"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\" && echo \"\" && uvicorn main:app --reload --port 8000"
end tell' >/dev/null 2>&1

if [ $? -eq 0 ]; then
    SERVICES_STARTED+=("AI Server")
    echo -e "  ${GREEN}✅ AI Server terminal launched${NC}"
    
    # Wait for AI server to be ready
    if wait_for_service "http://127.0.0.1:8000/docs" "AI Server"; then
        echo -e "  ${GREEN}✅ AI Server is READY${NC}"
        echo -e "  ${CYAN}📍 Local URL: http://127.0.0.1:8000${NC}"
    else
        echo -e "  ${RED}❌ AI Server failed to start${NC}"
        echo -e "  ${YELLOW}Check the AI Server terminal for error messages${NC}"
        FAILED_SERVICES+=("AI Server startup")
    fi
else
    echo -e "  ${RED}❌ Failed to launch AI Server terminal${NC}"
    FAILED_SERVICES+=("AI Server terminal")
fi

echo ""

################################################################################
# SERVICE 2: Ngrok Tunnel (AUTOMATIC - NO PROMPT)
################################################################################

echo -e "${MAGENTA}[2/4] 🌐 Starting Ngrok Tunnel for AI Server...${NC}"

osascript -e 'tell application "Terminal"
    do script "clear && echo \"🌐 SurakshaMesh X - Ngrok Tunnel\" && echo \"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\" && echo \"\" && ngrok http 8000"
end tell' >/dev/null 2>&1

if [ $? -eq 0 ]; then
    SERVICES_STARTED+=("Ngrok Tunnel")
    echo -e "  ${GREEN}✅ Ngrok terminal launched${NC}"
    
    # Wait for ngrok to start
    echo -ne "  ${CYAN}⏳ Waiting for ngrok tunnel"
    sleep 5
    echo -e " ${GREEN}✅${NC}"
    
    # Get ngrok public URL
    NGROK_URL=$(get_ngrok_url)
    
    if [ ! -z "$NGROK_URL" ]; then
        echo -e "  ${GREEN}✅ Ngrok tunnel is READY${NC}"
        echo -e "  ${BOLD}${CYAN}🌍 Public URL: $NGROK_URL${NC}"
        echo -e "  ${YELLOW}📋 Share this URL with Guru for remote access${NC}"
        
        # Save URL to file for later reference
        echo "$NGROK_URL" > "/tmp/surakshamesh_ngrok_url.txt"
        echo -e "  ${CYAN}💾 URL saved to: /tmp/surakshamesh_ngrok_url.txt${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Could not retrieve ngrok URL automatically${NC}"
        echo -e "  ${CYAN}Check the ngrok terminal window for the public URL${NC}"
    fi
else
    echo -e "  ${RED}❌ Failed to launch ngrok terminal${NC}"
    FAILED_SERVICES+=("Ngrok tunnel")
fi

echo ""

################################################################################
# SERVICE 3: Vision Script
################################################################################

echo -e "${MAGENTA}[3/4] 📹 Starting Vision Script (data_bridge_demo.py)...${NC}"

osascript -e 'tell application "Terminal"
    do script "cd '"$VISION_DIR"' && source venv/bin/activate && clear && echo \"📹 SurakshaMesh X - Vision System\" && echo \"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\" && echo \"\" && python3 data_bridge_demo.py"
end tell' >/dev/null 2>&1

if [ $? -eq 0 ]; then
    SERVICES_STARTED+=("Vision Script")
    echo -e "  ${GREEN}✅ Vision script terminal launched${NC}"
    echo -e "  ${CYAN}📹 Camera window will open shortly${NC}"
    echo -e "  ${YELLOW}💡 Press 's' for SOS, 'q' to quit vision script${NC}"
else
    echo -e "  ${RED}❌ Failed to launch vision script terminal${NC}"
    echo -e "  ${YELLOW}Check if data_bridge_demo.py exists in $VISION_DIR${NC}"
    FAILED_SERVICES+=("Vision Script")
fi

echo ""

################################################################################
# SERVICE 4: Badge Simulator
################################################################################

echo -e "${MAGENTA}[4/4] 🏷️  Opening Badge Simulator...${NC}"

if [ -f "$BADGE_HTML" ]; then
    open "$BADGE_HTML"
    
    if [ $? -eq 0 ]; then
        SERVICES_STARTED+=("Badge Simulator")
        echo -e "  ${GREEN}✅ Badge simulator opened in browser${NC}"
        echo -e "  ${CYAN}🔗 File: $BADGE_HTML${NC}"
        echo -e "  ${YELLOW}💡 Click 'Connect' in the badge UI to start monitoring${NC}"
    else
        echo -e "  ${RED}❌ Failed to open badge simulator${NC}"
        FAILED_SERVICES+=("Badge Simulator")
    fi
else
    echo -e "  ${RED}❌ Badge simulator HTML not found${NC}"
    echo -e "  ${YELLOW}Expected location: $BADGE_HTML${NC}"
    FAILED_SERVICES+=("Badge HTML file")
fi

echo ""

################################################################################
# SERVICE 5: Monitoring Dashboard
################################################################################

echo -e "${MAGENTA}[5/5] 📊 Opening Monitoring Dashboards...${NC}"

# Wait a bit for AI server to fully start
sleep 2

# Open AI API docs
open "http://127.0.0.1:8000/docs" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ AI API Documentation opened${NC}"
    echo -e "  ${CYAN}🔗 URL: http://127.0.0.1:8000/docs${NC}"
else
    echo -e "  ${YELLOW}⚠️  Could not open AI docs automatically${NC}"
    echo -e "  ${CYAN}Manually visit: http://127.0.0.1:8000/docs${NC}"
fi

echo ""

################################################################################
# STARTUP SUMMARY
################################################################################

sleep 1

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    # Perfect startup
    echo -e "${GREEN}${BOLD}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║   ✅ ALL SYSTEMS OPERATIONAL - DEMO READY!                ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    echo -e "${GREEN}🎉 SurakshaMesh X is fully operational!${NC}\n"
    
else
    # Partial startup
    echo -e "${YELLOW}${BOLD}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║   ⚠️  PARTIAL STARTUP - SOME ISSUES DETECTED              ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    echo -e "${YELLOW}⚠️  The following services had issues:${NC}"
    for failed in "${FAILED_SERVICES[@]}"; do
        echo -e "  ${RED}• $failed${NC}"
    done
    echo ""
fi

# Status Dashboard
echo -e "${BOLD}${CYAN}📊 SERVICE STATUS DASHBOARD${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

for service in "${SERVICES_STARTED[@]}"; do
    echo -e "  ${GREEN}✅ $service${NC}"
done

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo ""
    for failed in "${FAILED_SERVICES[@]}"; do
        echo -e "  ${RED}❌ $failed${NC}"
    done
fi

echo ""

# Network Information
if [ ! -z "$NGROK_URL" ]; then
    echo -e "${BOLD}${CYAN}🌐 NETWORK ENDPOINTS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  ${CYAN}🏠 Local AI Server:${NC}    http://127.0.0.1:8000"
    echo -e "  ${CYAN}🌍 Public AI Server:${NC}   $NGROK_URL"
    echo -e "  ${CYAN}📚 API Documentation:${NC}  http://127.0.0.1:8000/docs"
    echo ""
fi

# Demo Instructions
echo -e "${BOLD}${YELLOW}📖 DEMO INSTRUCTIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}1.${NC} Wear helmet/vest → Vision detects → Badge shows ${GREEN}GREEN${NC}"
echo -e "  ${CYAN}2.${NC} Remove helmet → Vision detects violation → Badge turns ${RED}RED${NC}"
echo -e "  ${CYAN}3.${NC} Press ${BOLD}'s'${NC} in vision window → SOS alert → Badge ${RED}FLASHES${NC}"
echo -e "  ${CYAN}4.${NC} Watch AI terminal for risk predictions"
echo ""

# Controls
echo -e "${BOLD}${YELLOW}⚙️  CONTROLS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}•${NC} Press ${BOLD}${RED}Ctrl+C${NC} in THIS terminal to stop ALL services"
echo -e "  ${CYAN}•${NC} Ngrok URL saved to: /tmp/surakshamesh_ngrok_url.txt"
echo -e "  ${CYAN}•${NC} Don't close terminal windows manually"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}✨ System ready for demo. Press Ctrl+C to shutdown. ✨${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Keep script running and monitor services
while true; do
    sleep 1
done