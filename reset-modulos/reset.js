
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
const CONFIG={"apiKey": "AIzaSyDY_69KizkBQj3IoJuTS2F-Slu1tqkCjlQ", "authDomain": "bif-v2-94b2c.firebaseapp.com", "databaseURL": "https://bif-v2-94b2c-default-rtdb.firebaseio.com", "projectId": "bif-v2-94b2c", "storageBucket": "bif-v2-94b2c.firebasestorage.app", "messagingSenderId": "863302060084", "appId": "1:863302060084:web:f9da9098fe6ca0a71e2261"};
const ALLOWED={"antena/antena-fiscal.html": ["bif/antenaFiscal"], "apoio/apoio.html": ["apoio_escrituracao"], "atendimento/atendimento.html": ["atendimento_cliente"], "certificados.html": ["bif_certificados"], "controleguias/controle-guias.html": ["guias"], "ferramentas/calculadora-simples.html": ["calculadora_simples"], "indicadores/controle_ciap.html": ["bif_controle_ciap"], "indicadores/monitor_reforma_tributaria.html": ["bif_monitor_reforma/documentos"], "kanban/kanban.html": ["bif_criatividade/alef"], "leitura-org/leitura-organizacional-bif.html": ["leitura_organizacional"], "obrigacoes/obrigacoes.html": ["obrigacoes", "obrigacoes_anexos"], "portal/portal.html": ["pop_hub/registros"], "procedimentos/pop.html": ["pop_hub/registros"], "processos/portal_pedido_emissao_nota.html": ["bif_pedidos_emissao_nota"], "recebimento/recebimento.html": ["bif_controle_recebimento_movimentos", "bif_recebimento_sem_recebimento", "bif_recebimento_briefing_docs"], "tarefas/tarefas.html": ["bif_tarefas_fiscal"], "tarefas/mapa.html": ["bif_tarefas_mapa_fiscal"], "controladoria/saneamento_ncm.html": ["bif_saneamento_ncm_v1"], "arquivo/arquivo.html": ["bif_gestao_arquivo/alef"]};
const ADMIN_UID="lUChAjAb3jbzjZ834JPhjcEgyrO2";
const moduleKey=document.currentScript?.dataset?.module || document.querySelector('script[data-reset-module]')?.dataset.resetModule;
if(!ALLOWED[moduleKey]) throw new Error("Módulo não autorizado para reset");
const app=getApps().find(a=>a.name==="bif-v2-reset")||initializeApp(CONFIG,"bif-v2-reset");
const auth=getAuth(app),db=getDatabase(app);
const root=document.createElement("section");
root.style.cssText="position:fixed;bottom:18px;right:18px;z-index:2147483640;font:14px Arial,sans-serif";
root.innerHTML='<button id="bif-reset-open" type="button" style="background:#991b1b;color:white;border:0;border-radius:9px;padding:11px 15px;cursor:pointer;box-shadow:0 2px 12px #0003">Apagar registros deste módulo</button><div id="bif-reset-dialog" style="display:none;background:white;color:#222;border:1px solid #ddd;box-shadow:0 4px 24px #0004;border-radius:12px;padding:18px;width:min(380px,90vw);margin-top:8px"><strong>Reset exclusivo deste módulo</strong><p id="bif-reset-paths" style="overflow-wrap:anywhere"></p><p>Esta ação é irreversível. Confirme com a senha da sua conta Firebase e digitando APAGAR.</p><input id="bif-reset-password" type="password" placeholder="Senha do seu login" autocomplete="current-password" style="width:95%;padding:8px;margin:4px 0"><input id="bif-reset-confirm" placeholder="Digite APAGAR" style="width:95%;padding:8px;margin:4px 0"><p id="bif-reset-status" role="status"></p><button id="bif-reset-execute" type="button" style="background:#991b1b;color:white;border:0;border-radius:6px;padding:9px">Confirmar exclusão</button> <button id="bif-reset-cancel" type="button">Cancelar</button></div>';
document.body.appendChild(root);
const $=id=>root.querySelector("#"+id),paths=ALLOWED[moduleKey];
$("bif-reset-paths").textContent="Somente estes caminhos serão excluídos: "+paths.join(", ")+". Configurações e usuários permanecem.";
$("bif-reset-open").onclick=()=>{$("bif-reset-dialog").style.display="block"};
$("bif-reset-cancel").onclick=()=>{$("bif-reset-dialog").style.display="none"};
$("bif-reset-execute").onclick=async()=>{
 const status=$("bif-reset-status");status.textContent="";
 if($("bif-reset-confirm").value!=="APAGAR"){status.textContent="Digite APAGAR para confirmar.";return;}
 const user=auth.currentUser;
 if(!user || user.uid!==ADMIN_UID){status.textContent="Acesso negado: entre com a conta administradora autorizada no Firebase V2.";return;}
 if(!user.email){status.textContent="Esta operação requer conta com login por e-mail e senha.";return;}
 const button=$("bif-reset-execute");button.disabled=true;
 try {
   await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,$("bif-reset-password").value));
   const admin=await get(ref(db,"colaboradores/"+user.uid));
   const data=admin.val();
   if(!data || data.status!=="ativo" || !(data.isAdmin===true || ["admin","administrador"].includes(String(data.perfil).toLowerCase()))) throw new Error("Cadastro administrativo não autorizado.");
   if(db.app.options.projectId!=="bif-v2-94b2c") throw new Error("Projeto Firebase inesperado.");
   // Prevent deleting paths that contain or overlap protected nodes.
   for(const path of paths) {
     if(!path || ["colaboradores","painel","painel/empresas","painel/config","configuracoes"].some(p=>path===p || p.startsWith(path+"/"))) throw new Error("Caminho protegido: "+path);
   }
   for(const path of paths) await remove(ref(db,path));
   status.textContent="Registros removidos dos caminhos listados. Atualize a página.";
   $("bif-reset-password").value="";
 }catch(err){status.textContent="Não foi possível concluir: "+(err?.message||String(err));}
 finally{button.disabled=false;}
};
