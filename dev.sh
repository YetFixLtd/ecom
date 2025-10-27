#!/bin/bash

# E-Commerce Development Server Starter
# This script starts both backend (Laravel) and frontend (Next.js) development servers

echo "🚀 Starting E-Commerce Development Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: backend directory not found${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: frontend directory not found${NC}"
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ Error: PHP is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill 0
    exit
}

# Trap SIGINT (Ctrl+C) and cleanup
trap cleanup SIGINT SIGTERM

# Start Laravel backend
echo -e "${BLUE}📦 Starting Laravel Backend (Port 8000)...${NC}"
cd backend
php artisan serve > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started successfully on http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    echo "Check backend.log for details"
    exit 1
fi

# Start Next.js frontend
echo -e "${BLUE}⚛️  Starting Next.js Frontend (Port 3000)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started successfully on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Failed to start frontend server${NC}"
    echo "Check frontend.log for details"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All servers are running!${NC}"
echo ""
echo "📍 URLs:"
echo "   Backend API:  http://localhost:8000"
echo "   Frontend App: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and wait for both processes
wait

