from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegistroRequest
from database import supabase

# Criamos um "mini-app" para as rotas de usuários
router = APIRouter()

# ==========================================
# ROTAS PÚBLICAS E DE AUTENTICAÇÃO
# ==========================================

@router.get("/prestadores")
def listar_prestadores():
    # Busca apenas quem tem o tipo_conta como 'prestador'
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


# ==========================================
# ROTAS DE AGENDAMENTO
# ==========================================

@router.post("/agendamentos")
def criar_agendamento(agendamento: dict):
    # Recebe os dados do agendamento (prestador_id, cliente_id, data_hora, descricao_servico)
    try:
        response = supabase.table("agendamentos").insert(agendamento).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("/agendamentos/prestador/{prestador_id}")
def listar_agenda_prestador(prestador_id: str): 
    try:
        # Busca os agendamentos e traz junto o nome e telefone do cliente que marcou
        response = supabase.table("agendamentos")\
            .select("*, usuarios!agendamentos_cliente_id_fkey(nome, telefone)")\
            .eq("prestador_id", prestador_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda: {str(e)}")


# ==========================================
# ROTAS DE ADMINISTRAÇÃO
# ==========================================

@router.delete("/admin/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: str, admin_id: str):
    # 1. Busca os dados do usuário que está tentando fazer a exclusão
    check = supabase.table("usuarios").select("is_admin").eq("id", admin_id).execute()
    
    # 2. Verifica se a busca retornou algo e se ele realmente é um administrador
    if len(check.data) > 0 and check.data[0].get('is_admin') == True:
        try:
            response = supabase.table("usuarios").delete().eq("id", usuario_id).execute()
            return {"status": "sucesso", "message": "Usuário deletado com sucesso", "data": response.data}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao deletar: {str(e)}")
            
    # 3. Se não for administrador, barra a requisição com Erro 403
    raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem realizar esta ação.")