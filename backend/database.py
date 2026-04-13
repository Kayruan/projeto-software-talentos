import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Pegamos as credenciais do .env
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Criamos a conexão que será exportada para o resto do projeto
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)