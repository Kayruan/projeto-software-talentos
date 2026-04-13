from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    senha: str

class RegistroRequest(BaseModel):
    nome: str
    email: str
    senha: str
    tipo_conta: str
    cidade: str
    categoria: str = ""
    descricao: str = ""
    servicos: str = ""