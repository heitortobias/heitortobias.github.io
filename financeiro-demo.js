'use strict';
(()=>{
const $=id=>document.getElementById(id);
const money=cents=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cats=['Moradia','Contas','Mercado','Alimentação','Transporte','Combustível','Saúde','Lazer','Compras','Poupança','Investimentos','Outros'];
let entries=[],budgets={},goals=[],pending=null,counter=0;
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const amount=id=>{const n=Number($(id).value);return Number.isFinite(n)&&n>=0&&n<=10000000?Math.round(n*100):0;};
const notice=message=>{$('notice').textContent=message;};
function empty(el,text){el.replaceChildren(node('p',text,'empty'));}
function row(title,value,detail){const r=node('div',undefined,'row'),top=node('div',undefined,'row-top');top.append(node('span',title),node('strong',value));r.append(top);if(detail)r.append(node('p',detail));return r;}
function showPanel(id){document.querySelectorAll('.panel').forEach(e=>e.hidden=e.id!==id);document.querySelectorAll('nav button').forEach(e=>{if(e.dataset.panel===id)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');});}
function render(){
const income=entries.filter(e=>e.kind==='income').reduce((s,e)=>s+e.cents,0),expense=entries.filter(e=>e.kind==='expense').reduce((s,e)=>s+e.cents,0);
$('income-total').textContent=money(income);$('expense-total').textContent=money(expense);$('balance-total').textContent=money(income-expense);
const totals={};entries.filter(e=>e.kind==='expense').forEach(e=>totals[e.category]=(totals[e.category]||0)+e.cents);
$('categories').replaceChildren();if(!Object.keys(totals).length)empty($('categories'),'Nenhuma despesa ainda. Faça seu primeiro lançamento de teste.');
Object.entries(totals).sort((a,b)=>b[1]-a[1]).forEach(([c,v])=>{const r=row(c,money(v));const progress=node('progress');progress.max=Math.max(expense,1);progress.value=v;progress.setAttribute('aria-label',c+': '+money(v));r.append(progress);$('categories').append(r);});
$('history').replaceChildren();if(!entries.length)empty($('history'),'Seu histórico começa vazio. Os lançamentos adicionados aparecerão aqui.');
[...entries].reverse().forEach(e=>{const r=row(e.description,(e.kind==='income'?'+ ':'− ')+money(e.cents),e.category+' · '+(e.kind==='income'?'Receita':'Despesa'));r.querySelector('strong').className=e.kind;const b=node('button','Remover','subtle');b.type='button';b.setAttribute('aria-label','Remover lançamento '+e.description);b.addEventListener('click',()=>{entries=entries.filter(x=>x.id!==e.id);render();notice('Lançamento fictício removido.');});r.append(b);$('history').append(r);});
$('budget-list').replaceChildren();if(!Object.keys(budgets).length)empty($('budget-list'),'Defina o primeiro limite de teste.');
Object.entries(budgets).forEach(([c,v])=>{const used=totals[c]||0;const r=row(c,money(used)+' / '+money(v),used>v?'Acima do limite em '+money(used-v):'Disponível: '+money(v-used));const progress=node('progress');progress.max=v;progress.value=Math.min(used,v);progress.setAttribute('aria-label',c+': '+Math.round(used/v*100)+'% do orçamento');r.append(progress);$('budget-list').append(r);});
$('goal-list').replaceChildren();if(!goals.length)empty($('goal-list'),'Adicione uma meta fictícia para acompanhar seu progresso.');
goals.forEach(g=>{const r=row(g.name,money(g.saved)+' / '+money(g.target),Math.round(g.saved/g.target*100)+'% reservado');const progress=node('progress');progress.max=g.target;progress.value=Math.min(g.saved,g.target);progress.setAttribute('aria-label','Progresso da meta '+g.name);r.append(progress);$('goal-list').append(r);});
}
function reset(){entries=[];budgets={};goals=[];pending=null;counter=0;$('workspace').hidden=true;$('welcome').hidden=false;$('start-form').reset();document.querySelectorAll('#workspace form').forEach(f=>f.reset());$('examples').disabled=false;$('review').close();notice('');showPanel('overview');render();$('visitor').focus();}
for(const id of ['entry-category','budget-category'])cats.forEach(c=>$(id).append(node('option',c)));
$('start-form').addEventListener('submit',e=>{e.preventDefault();$('visitor-name').textContent=$('visitor').value.trim()||'Visitante';$('welcome').hidden=true;$('workspace').hidden=false;render();$('natural').focus();});
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{showPanel(b.dataset.panel);notice('');}));
$('entry-form').addEventListener('submit',e=>{e.preventDefault();const cents=amount('entry-amount'),description=$('entry-description').value.trim();if(cents<=0||!description)return;entries.push({id:++counter,kind:$('entry-kind').value,description,cents,category:$('entry-category').value});e.target.reset();render();notice('Lançamento fictício adicionado nesta sessão.');});
$('budget-form').addEventListener('submit',e=>{e.preventDefault();const cents=amount('budget-amount');if(cents<=0)return;budgets[$('budget-category').value]=cents;render();notice('Orçamento de teste salvo nesta sessão.');});
$('goal-form').addEventListener('submit',e=>{e.preventDefault();const target=amount('goal-target'),saved=amount('goal-saved'),name=$('goal-name').value.trim();if(!target||!name)return;goals.push({name,target,saved});e.target.reset();render();notice('Meta fictícia adicionada.');});
$('natural-form').addEventListener('submit',e=>{e.preventDefault();const description=$('natural').value.trim();const match=description.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[,.]\d{1,2})?)/i);if(!match){notice('Inclua um valor, por exemplo: Gastei 150 reais de gasolina hoje.');return;}
let raw=match[1];if(raw.includes(','))raw=raw.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(raw))raw=raw.replace(/\./g,'');const cents=Math.round(Number(raw)*100);if(!Number.isFinite(cents)||cents<=0||cents>1000000000){notice('Use um valor entre R$ 0,01 e R$ 10.000.000,00.');return;}
const t=description.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let category='Outros';const rules=[[/gasolina|combustivel|etanol|diesel/,'Combustível'],[/mercado|supermercado|feira/,'Mercado'],[/restaurante|almoco|jantar|lanche/,'Alimentação'],[/uber|onibus|transporte/,'Transporte'],[/aluguel|moradia|condominio/,'Moradia'],[/farmacia|saude|medico/,'Saúde'],[/internet|energia|luz|agua/,'Contas'],[/cinema|lazer|passeio/,'Lazer']];for(const [re,c]of rules)if(re.test(t)){category=c;break;}
pending={id:++counter,description,cents,kind:/recebi|receita|salario|ganhei/.test(t)?'income':'expense',category};$('review-kind').textContent=pending.kind==='income'?'Receita':'Despesa';$('review-description').textContent=description;$('review-category').textContent=category;$('review-amount').textContent=money(cents);$('review').showModal();});
$('review-cancel').addEventListener('click',()=>{pending=null;$('review').close();});$('review').addEventListener('cancel',()=>pending=null);
$('review-confirm').addEventListener('click',()=>{if(!pending)return;entries.push(pending);pending=null;$('review').close();$('natural-form').reset();render();notice('Lançamento confirmado somente na demonstração.');});
$('restart').addEventListener('click',()=>$('reset-dialog').showModal());$('reset-cancel').addEventListener('click',()=>$('reset-dialog').close());$('reset-confirm').addEventListener('click',()=>{$('reset-dialog').close();reset();});
$('examples').addEventListener('click',()=>{entries.push({id:++counter,kind:'income',description:'Salário fictício',cents:700000,category:'Outros'},{id:++counter,kind:'expense',description:'Mercado fictício',cents:48000,category:'Mercado'},{id:++counter,kind:'expense',description:'Gasolina fictícia',cents:15000,category:'Combustível'},{id:++counter,kind:'expense',description:'Aluguel fictício',cents:180000,category:'Moradia'});budgets['Mercado']=100000;budgets['Combustível']=40000;goals.push({name:'Viagem fictícia',target:500000,saved:100000});$('examples').disabled=true;render();notice('Exemplos fictícios carregados. Nenhum dado real foi usado.');});
render();
})();
