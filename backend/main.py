from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import usuarios 

app = FastAPI(title="API ConectaSul")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router) 

@app.get("/")
def home():
    return {"message": "API do ConectaSul está rodando perfeitamente! 🚀"}