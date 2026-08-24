#!/bin/bash
while true; do
  echo "Starting tunnel..."
  /home/gustavolima/.local/bin/lt --port 3001 --subdomain financas-gustavo
  echo "Tunnel died, restarting in 3s..."
  sleep 3
done
