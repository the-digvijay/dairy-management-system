# DairyConnect — Dairy Management Mini Project
React + Spring Boot + MySQL. A local educational project with farmer CRUD, exact fat/SNF rate matching, morning/evening cow/buffalo collections, automatic financial calculations, printable monthly bills and farmer-wise reports.

## Requirements
- Java **17 or newer** (Java 21 also works)
- Maven 3.9+, Node.js 20.19+ or 22.12+, npm
- MySQL 8+ for normal mode; **demo mode needs no MySQL**
- VS Code with Java Extension Pack (optional)

## Quick start — easiest demo
Extract this ZIP and open the `dairy-management-system` folder in VS Code. Open two terminals.

Terminal 1 (PowerShell):
```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```
Demo mode uses a persistent H2 database in backend/data and adds one sample farmer and two illustrative rates on an empty database. These rates are NOT official dairy prices.

Terminal 2:
```powershell
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173. Backend: http://localhost:8080/api/dashboard.

Optional: after installing prerequisites, run `./start-demo.ps1` in PowerShell from the project root to open both terminals automatically.

## MySQL mode
Create the database if your user lacks permission to create it:
```sql
CREATE DATABASE dairy_management;
```
Set your own credentials in the backend terminal:
```powershell
cd backend
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
$env:DB_URL="jdbc:mysql://localhost:3306/dairy_management"
mvn spring-boot:run
```
Tables are created/updated by Hibernate for this mini project. MySQL mode begins empty: register a farmer and add a rate first. The frontend runs using the same commands above.
Optional MySQL Docker container: set DB_PASSWORD then run `docker compose up -d` from the project root. Do not use this if another MySQL service already occupies port 3306.

## Try the workflow
1. Farmers → register a farmer.
2. Rates → add COW, fat 3.50, SNF 8.50, rate 35.00 (demo example).
3. Milk Collection → choose the farmer, date, MORNING, COW, 5 litres, fat 3.50 and SNF 8.50. Saved amount: ₹175.00.
4. Add an EVENING entry or add a separate BUFFALO rate.
5. Monthly Bills → select month and farmer → Print / Save as PDF.
6. Reports → view farmer-wise monthly totals.

Amounts are calculated with BigDecimal on the backend, rounded per entry to two decimals. Rate changes preserve old saved amounts. Multiple deliveries are allowed. A farmer with collection records cannot be deleted. Bills are calculated summaries, not stored bills or proof of payment.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET / POST | /api/farmers | List / register |
| PUT / DELETE | /api/farmers/{id} | Edit / delete |
| GET / POST | /api/rates | List / create |
| PUT / DELETE | /api/rates/{id} | Edit / delete |
| GET / POST | /api/collections | List / record milk |
| GET | /api/collections?month=2026-10&farmerId=1 | Filter collection history |
| GET | /api/dashboard | Today's totals (Asia/Kolkata) |
| GET | /api/reports?month=2026-10 | Monthly farmer totals |

Collection POST example:
```json
{"farmerId":1,"date":"2026-10-05","shift":"MORNING","milkType":"COW","quantity":5,"fat":3.5,"snf":8.5}
```
Use a current or past date. Fat/SNF rates match EXACT values; this mini project does not interpolate ranges.

## Verification commands
```powershell
cd backend
mvn test
mvn package
```
```powershell
cd frontend
npm run build
```

## Upload to your GitHub
Create an empty GitHub repository named dairy-management-system (do not initialize a README there). Run from this project's root:
```powershell
git init
git add .
git commit -m "Add DairyConnect mini project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dairy-management-system.git
git push -u origin main
```
Replace YOUR_USERNAME. Authenticate through Git's browser flow. Never commit database passwords or tokens. The ZIP does not include a GitHub upload.

## Scope and limitations
This is an unauthenticated **local educational demo**. Do not expose its backend to the public internet. It includes sample Marathi labels, not full translation. Collection entries are append-only in this version. It does not include advances, stored finalized bills, payment tracking, rate interpolation or login. These can be added later.

## Validation performed
React production build passed. Spring Boot compiled and packaged successfully. Three automated tests passed using H2: monetary rounding, collection/rate/report workflow, and API endpoint responses. MySQL mode is configured but was not exercised against a live MySQL server.
