import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Validação crítica: se não houver chave, o app deve avisar antes de rodar
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERRO: SUPABASE_URL ou SUPABASE_KEY não configurados no ambiente!")
    sys.exit(1)

# Log para verificar no painel do Render se a chave foi carregada corretamente
# Mostramos apenas os primeiros 5 caracteres para segurança
print(f"DEBUG: Conectando ao Supabase com a chave: {SUPABASE_KEY[:5]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)