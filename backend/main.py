from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import usuarios 

app = FastAPI(title="API ConectaSul")

# Lista explícita de origens permitidas
origins = [
    "http://localhost:3000",
    "http://localhost:5500",
    "https://projeto-software-talentos.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Lista explícita ao invés de "*"
    allow_credentials=True,         # Necessário para sessões/auth
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(usuarios.router) 

@app.get("/")
def home():
    return {"message": "API do ConectaSul está rodando perfeitamente! 🚀"}