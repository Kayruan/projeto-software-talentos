from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    senha: str

class RegistroRequest(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str      # <-- ADICIONAMOS AQUI! Super importante para o WhatsApp
    tipo_conta: str
    cidade: str
    
    # Esses têm valores padrão ("") porque o 'cliente' não vai preenchê-los
    categoria: str = ""
    descricao: str = ""
    servicos: str = ""