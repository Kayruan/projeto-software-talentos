from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from routes import usuario 

app = FastAPI(title="API ConectaSul")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(usuario.router)

@app.get("/")
def home():
    return {"message": "API do ConectaSul está rodando perfeitamente! 🚀"}