# Start TaskBoard dev environment
Write-Host "`n🚀 Starting TaskBoard..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m venv .venv 2>$null; .venv\Scripts\Activate.ps1; pip install -r requirements.txt -q; python seed.py; python -m uvicorn main:app --reload --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 3

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host "✅ Servers starting..." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
