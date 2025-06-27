#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

case "$1" in
  start)
    echo -e "${GREEN}Starting Neon server...${NC}"
    pm2 start ecosystem.config.js
    ;;
  stop)
    echo -e "${RED}Stopping Neon server...${NC}"
    pm2 stop neon-api-server
    ;;
  restart)
    echo -e "${YELLOW}Restarting Neon server...${NC}"
    pm2 restart neon-api-server
    ;;
  status)
    echo -e "${GREEN}Neon server status:${NC}"
    pm2 status neon-api-server
    ;;
  logs)
    echo -e "${GREEN}Showing logs:${NC}"
    pm2 logs neon-api-server
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac

exit 0 