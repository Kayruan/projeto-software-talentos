from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegistroRequest
from database import supabase

# Criamos um "mini-app" para as rotas de usuários
router = APIRouter()

@router.get("/prestadores")
def listar_prestadores():
    response = supabase.table("usuarios").select("*").eq("tipo_conta", "prestador").execute()
    return response.data

@router.post("/login")
def login(dados: LoginRequest):
    response = supabase.table("usuarios").select("*").eq("email", dados.email).eq("senha", dados.senha).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return {"message": "Login realizado com sucesso!", "user": response.data[0]}

@router.post("/registro")
def registro(dados: RegistroRequest):
    busca = supabase.table("usuarios").select("*").eq("email", dados.email).execute()
    if busca.data:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")

    novo_usuario = dados.dict()
    response = supabase.table("usuarios").insert(novo_usuario).execute()
    return response.data[0]