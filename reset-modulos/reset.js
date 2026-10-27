import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
const CONFIG={"apiKey": "AIzaSyDY_69KizkBQj3IoJuTS2F-Slu1tqkCjlQ", "authDomain": "bif-v2-94b2c.firebaseapp.com", "databaseURL": "https://bif-v2-94b2c-default-rtdb.firebaseio.com", "projectId": "bif-v2-94b2c", "storageBucket": "bif-v2-94b2c.firebasestorage.app", "messagingSenderId": "863302060084", "appId": "1:863302060084:web:f9da9098fe6ca0a71e2261"};
const ALLOWED={"antena/antena-fiscal.html": ["bif/antenaFiscal"], "apoio/apoio.html": ["apoio_escrituracao"], "atendimento/atendimento.html": ["atendimento_cliente"], "certificados.html": ["bif_certificados"], "controleguias/controle-guias.html": ["guias"], "ferramentas/calculadora-simples.html": ["calculadora_simples"], "indicadores/controle_ciap.html": ["bif_controle_ciap"], "indicadores/monitor_reforma_tributaria.html": ["bif_monitor_reforma/documentos"], "kanban/kanban.html": ["bif_criatividade/alef"], "leitura-org/leitura-organizacional-bif.html": ["leitura_organizacional"], "obrigacoes/obrigacoes.html": ["obrigacoes", "obrigacoes_anexos"], "portal/portal.html": ["pop_hub/registros"], "procedimentos/pop.html": ["pop_hub/registros"], "processos/portal_pedido_emissao_nota.html": ["bif_pedidos_emissao_nota"], "recebimento/recebimento.html": ["bif_controle_recebimento_movimentos", "bif_recebimento_sem_recebimento", "bif_recebimento_briefing_docs"], "tarefas/tarefas.html": ["bif_tarefas_fiscal"], "tarefas/mapa.html": ["bif_tarefas_mapa_fiscal"], "controladoria/saneamento_ncm.html": ["bif_saneamento_ncm_v1"], "arquivo/arquivo.html": ["bif_gestao_arquivo/alef"]};
const ADMIN_UID="lUChAjAb3jbzjZ834JPhjcEgyrO2";
const moduleKey=document.querySelector('script[data-reset-module]')?.getAttribute('data-reset-module');
const paths=ALLOWED[moduleKey];
if(!paths?.length) throw new Error('Reset indisponível: módulo sem caminhos aprovados.');
// Reutilizar a aplicação Firebase padrão usada pelo BIF. Não criar uma sessão de autenticação paralela.
const existing=getApps().find(a=>a.name==='[DEFAULT]');
const app=existing||initializeApp(CONFIG);
if(app.options.projectId!==CONFIG.projectId || app.options.databaseURL!==CONFIG.databaseURL) throw new Error('Projeto Firebase diferente do BIF V2.');
const auth=getAuth(app), db=getDatabase(app);
const root=document.createElement('div');
root.id='bif-reset-module-control';
root.style.cssText='position:fixed;bottom:16px;right:16px;z-index:2147483000;font:13px/1.45 Arial,sans-serif;max-width:calc(100vw - 32px);pointer-events:auto';
const open=document.createElement('button');open.type='button';open.textContent='Limpar registros deste módulo';
open.style.cssText='border:0;border-radius:8px;background:#9f1239;color:white;padding:9px 12px;cursor:pointer;box-shadow:0 3px 12px #0003';
const panel=document.createElement('div');panel.hidden=true;
panel.style.cssText='box-sizing:border-box;background:#fff;color:#111;border:1px solid #d4d4d8;box-shadow:0 4px 22px #0004;border-radius:10px;padding:15px;width:min(390px,calc(100vw - 32px));margin-top:7px';
const heading=document.createElement('strong');heading.textContent='Excluir somente registros deste módulo';
const info=document.createElement('p');info.textContent='Caminhos afetados: '+paths.join(', ')+'. Empresas, colaboradores e configurações compartilhadas serão preservados.';
info.style.overflowWrap='anywhere';
const pw=document.createElement('input');pw.type='password';pw.placeholder='Senha do seu login Firebase';pw.autocomplete='current-password';
const confirm=document.createElement('input');confirm.placeholder='Digite APAGAR para confirmar';
for(const inp of [pw,confirm]) inp.style.cssText='display:block;box-sizing:border-box;width:100%;padding:9px;margin:9px 0;border:1px solid #aaa;border-radius:5px;color:#111;background:white';
const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='overflow-wrap:anywhere;min-height:16px';
const go=document.createElement('button');go.type='button';go.textContent='Excluir registros';go.style.cssText='border:0;background:#9f1239;color:white;border-radius:6px;padding:9px;cursor:pointer';
const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.style.cssText='margin-left:8px;padding:9px;cursor:pointer';
panel.append(heading,info,pw,confirm,status,go,cancel);root.append(open,panel);document.body.append(root);
open.addEventListener('click',()=>{panel.hidden=!panel.hidden;status.textContent='';});
cancel.addEventListener('click',()=>{panel.hidden=true;pw.value='';confirm.value='';});
go.addEventListener('click',async()=>{
 status.textContent='';
 if(confirm.value!=='APAGAR'){status.textContent='Digite APAGAR para confirmar.';return;}
 go.disabled=true;
 try {
   await auth.authStateReady();
   const user=auth.currentUser;
   if(!user) throw new Error('Você não está autenticado nesta página. Entre novamente com seu usuário do Firebase V2.');
   if(user.uid!==ADMIN_UID) throw new Error('Este usuário não tem autorização para apagar dados.');
   if(!user.email) throw new Error('É necessário entrar com e-mail e senha para validar esta operação.');
   await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,pw.value));
   // O export atual não contém /colaboradores. A identidade é validada
   // pelo Firebase Authentication, UID permitido e reautenticação por senha.
   // As regras do Realtime Database DEVEM restringir as remoções no servidor.
   const protectedPaths=['colaboradores','painel','configuracoes','usuarios','bif_painel'];
   for(const path of paths){
     if(!path || path.startsWith('/') || path.includes('..') || protectedPaths.some(p=>path===p || p.startsWith(path+'/') || path.startsWith(p+'/'))) throw new Error('Caminho protegido: '+path);
   }
   // Não excluir automaticamente dados de um módulo se algum caminho é usado por outro módulo.
   for(const path of paths){
     const shared=Object.entries(ALLOWED).some(([key,arr])=>key!==moduleKey && arr.some(p=>p===path || p.startsWith(path+'/') || path.startsWith(p+'/')));
     if(shared) throw new Error('Caminho compartilhado com outro módulo: '+path+'. Exclusão bloqueada para evitar perda de dados.');
   }
   for(const path of paths) await remove(ref(db,path));
   status.textContent='Registros removidos. Atualize a página.';pw.value='';confirm.value='';
 }catch(error){status.textContent='Operação não concluída: '+(error?.message||String(error));}
 finally{go.disabled=false;}
});
