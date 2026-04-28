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
class AgendamentoRequest(BaseModel):
    prestador_id: str
    cliente_id: str
    data_hora: str
    descricao_servico: str

class AvaliacaoRequest(BaseModel):
    prestador_id: str
    cliente_id: str
    nota: int

class PerfilUpdate(BaseModel):
    categoria: str = None
    cidade: str = None
    servicos: str = None
    descricao: str = None
    foto_url: str = None  # <-- A estrela do show!
    telefone: str = None   # Aproveitamos para permitir editar o Zap