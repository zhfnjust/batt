@echo off
echo.

set NodePackagesPath=.

set Path=%NodePackagesPath%\node_modules\.bin;%PATH%
set Path=%NodePackagesPath%;%PATH%

set NODE_PATH=%NodePackagesPath%\node_modules;%NODE_PATH%
set NODE_ENV=production

echo Environment variables are successfully added.
echo. 
echo. 
echo. 

set/p option=(1)����¼���ν�� (2)��¼���ν�� :

if "%option%"=="1" node batt.js 
if "%option%"=="2" node batt.js record
if "%option%"=="" node batt.js 

pause

