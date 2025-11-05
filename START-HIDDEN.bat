@echo off
cd /d "C:\Users\AMD\Desktop\cursor project\insight report - V3"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -WindowStyle Hidden npm -ArgumentList 'run','dev'; ^
   Start-Process -WindowStyle Hidden npm -ArgumentList 'run','server'"

