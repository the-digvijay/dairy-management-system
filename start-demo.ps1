$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (!(Get-Command mvn -ErrorAction SilentlyContinue)) { throw "Install Maven 3.9+ and add it to PATH first. See README.md." }
if (!(Get-Command npm -ErrorAction SilentlyContinue)) { throw "Install Node.js first. See README.md." }
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot\backend'; mvn spring-boot:run '-Dspring-boot.run.profiles=demo'"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot\frontend'; npm install; npm run dev"
Write-Host "Open http://localhost:5173 after both services start."
