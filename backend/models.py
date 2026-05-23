from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    senha: str

class RegistroRequest(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str      # Importante para o acoplamento com o WhatsApp
    tipo_conta: str
    cidade: str
    
    # Valores padrão vazios para quando o tipo_conta for 'cliente'
    categoria: str = ""
    descricao: str = ""
    servicos: str = ""

class AgendamentoRequest(BaseModel):
    prestador_id: str
    cliente_id: str
    data_hora: str
    descricao_servico: str
    valor_orcamento: Optional[float] = 0.0  # Preparado para receber o preço do prestador

class PerfilUpdate(BaseModel):
    categoria: str = None
    cidade: str = None
    servicos: str = None
    descricao: str = None
    foto_url: str = None  # Recebe a URL gerada pelo Supabase Storage
    telefone: str = None   # Permite atualização dinâmica do WhatsApp

class AvaliacaoRequest(BaseModel):
    prestador_id: str
    cliente_id: str
    nota: int
    comentario: Optional[str] = ""         # Texto com feedback do cliente
    foto_url: Optional[str] = ""           # <-- NOVO: Armazena o link da foto do serviço realizado

class AtualizarOrcamento(BaseModel):       # Modelo exclusivo para mudança parcial de valores
    valor_orcamento: float