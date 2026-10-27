
import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth,EmailAuthProvider,reauthenticateWithCredential} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getDatabase,ref,remove,get} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
const CONFIG={"apiKey": "AIzaSyDY_69KizkBQj3IoJuTS2F-Slu1tqkCjlQ", "authDomain": "bif-v2-94b2c.firebaseapp.com", "databaseURL": "https://bif-v2-94b2c-default-rtdb.firebaseio.com", "projectId": "bif-v2-94b2c", "storageBucket": "bif-v2-94b2c.firebasestorage.app", "messagingSenderId": "863302060084", "appId": "1:863302060084:web:f9da9098fe6ca0a71e2261"};
const PATHS={"antena/antena-fiscal.html": ["bif/antenaFiscal"], "apoio/apoio.html": ["apoio_escrituracao"], "arquivo/arquivo.html": ["bif_gestao_arquivo/alef"], "atendimento/atendimento.html": ["atendimento_cliente"], "certificados.html": ["bif_certificados"], "controladoria/saneamento_ncm.html": ["bif_saneamento_ncm_v1"], "controleguias/controle-guias.html": ["guias"], "documentos/documentos.html": ["documentos"], "equipes/equipes.html": ["gestao_equipes"], "ferramentas/calculadora-simples.html": ["calculadora_simples"], "indicadores/indicadores-principal-com-sped.html": ["bif_kpi_numeros_v2/dados"], "kanban/kanban.html": ["bif_criatividade/alef"], "leitura-org/leitura-organizacional-bif.html": ["leitura_organizacional"], "manuaisext/manuais.html": ["manuais_ext_docs"], "obrigacoes/obrigacoes.html": ["obrigacoes", "obrigacoes_anexos"], "portal/portal.html": ["pop_hub/registros"], "processos/portal_pedido_emissao_nota.html": ["bif_pedidos_emissao_nota"], "recebimento/recebimento.html": ["bif_controle_recebimento_movimentos", "bif_recebimento_sem_recebimento", "bif_recebimento_briefing_docs"], "tarefas/tarefas.html": ["bif_tarefas_fiscal/tasks"], "tarefas/mapa.html": ["bif_tarefas_mapa_fiscal"]};
const ADMIN_UID="lUChAjAb3jbzjZ834JPhjcEgyrO2";
const PROTECTED=["colaboradores","painel","painel/empresas","painel/config","configuracoes","usuarios","bif_painel","pop_hub/categorias"];
function el(parent,tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;parent.appendChild(node);return node;}
export function render(moduleKey,panel,close){
 panel.replaceChildren();
 el(panel,"strong","Apagar registros deste módulo");
 const paths=PATHS[moduleKey];
 if(!paths?.length){
   el(panel,"p","Este módulo não possui registros independentes validados no Firebase. A exclusão está bloqueada para preservar cadastros e dados compartilhados.");
   if(moduleKey==="painel/painel.html")el(panel,"p","O relatório de produtores rurais utiliza os cadastros compartilhados em painel/empresas; não é um banco de registros independente.");
   const cancel=el(panel,"button","Fechar");cancel.onclick=close;return;
 }
 el(panel,"p","Serão excluídos os dados destes caminhos: "+paths.join(", "));
 el(panel,"p","Usuários, empresas e configurações compartilhadas serão preservados. Faça backup antes de prosseguir.");
 const password=el(panel,"input");password.type="password";password.placeholder="Senha da conta Firebase";password.autocomplete="current-password";
 const confirm=el(panel,"input");confirm.placeholder="Digite APAGAR";
 for(const input of [password,confirm])input.style.cssText="box-sizing:border-box;display:block;width:100%;padding:9px;margin:8px 0;border:1px solid #aaa;border-radius:5px;color:#111;background:#fff";
 const status=el(panel,"p");status.setAttribute("role","status");
 const go=el(panel,"button","Excluir registros");go.type="button";go.style.cssText="background:#9f1239;color:#fff;border:0;border-radius:6px;padding:9px;cursor:pointer";
 const cancel=el(panel,"button","Cancelar");cancel.type="button";cancel.style.cssText="margin-left:8px;padding:9px;cursor:pointer";cancel.onclick=close;
 go.onclick=async()=>{
   if(confirm.value!=="APAGAR"){status.textContent="Digite APAGAR para confirmar.";return;}
   go.disabled=true;status.textContent="Verificando autenticação...";
   try{
     const app=getApps().find(a=>a.name==="[DEFAULT]")||initializeApp(CONFIG);
     if(app.options.projectId!==CONFIG.projectId||app.options.databaseURL!==CONFIG.databaseURL)throw Error("Projeto Firebase não corresponde ao BIF V2.");
     const auth=getAuth(app);await auth.authStateReady();
     const user=auth.currentUser;
     if(!user)throw Error("Usuário não autenticado. Entre novamente no BIF V2.");
     if(user.uid!==ADMIN_UID)throw Error("UID sem permissão de reset.");
     if(!user.email)throw Error("Conta sem autenticação por e-mail e senha.");
     await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password.value));
     const db=getDatabase(app);
     for(const path of paths){
       if(!path||path.startsWith("/")||path.includes("..")||PROTECTED.some(p=>p===path||p.startsWith(path+"/")||path.startsWith(p+"/")))throw Error("Caminho protegido: "+path);
     }
     // Fail closed if any path has become shared by another module.
     for(const path of paths){
       if(Object.entries(PATHS).some(([key,others])=>key!==moduleKey&&others.some(other=>other===path||other.startsWith(path+"/")||path.startsWith(other+"/"))))throw Error("Caminho compartilhado: "+path);
     }
     // Check all target paths are readable before any destructive write.
     for(const path of paths)await get(ref(db,path));
     status.textContent="Removendo registros...";
     for(const path of paths)await remove(ref(db,path));
     status.textContent="Registros excluídos dos caminhos indicados. Atualize a página.";
     password.value="";confirm.value="";
   }catch(err){status.textContent="Nenhum reset concluído ou exclusão parcial: "+(err?.message||String(err));}
   finally{go.disabled=false;}
 };
}
