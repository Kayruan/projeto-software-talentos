from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import usuarios # Importa as nossas rotas

app = FastAPI(title="ConectaSul API")

# Proteção de CORS para o Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectando as rotas ao aplicativo principal
app.include_router(usuarios.router)

@app.get("/")
def home():
    return {"status": "API ConectaSul Modularizada e Online!"}