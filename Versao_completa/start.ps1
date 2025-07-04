# Ativa ambiente virtual e roda Streamlit
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\.venv310\Scripts\Activate.ps1; streamlit run app_nutricional_offmulti.py"

# Abre nova aba e roda frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev"

# Abre nova aba e roda backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"
