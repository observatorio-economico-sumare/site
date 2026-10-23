const definitions={'Vínculo formal':'Registro de uma relação de trabalho formal contabilizada na base administrativa utilizada. Neste painel, o dado se refere ao local do estabelecimento, não necessariamente ao município de residência do trabalhador.','Pessoa ocupada':'Pessoa que exercia atividade remunerada ou outra atividade considerada trabalho segundo os critérios da pesquisa no período de referência.','Pessoa desocupada':'Pessoa sem trabalho que procurou uma ocupação e estava disponível para trabalhar, segundo os critérios da pesquisa.','CLT':'Trabalhador contratado sob as regras da Consolidação das Leis do Trabalho. Empregos com carteira não são equivalentes ao total de pessoas ocupadas.','MEI':'Microempreendedor individual: modalidade de formalização de um pequeno negócio. Um mesmo titular também pode ter outra atividade profissional.','Conta própria':'Pessoa que trabalha explorando seu próprio negócio ou atividade, sem necessariamente possuir CNPJ.','Saldo de empregos':'Diferença entre admissões e desligamentos no período. Não corresponde à quantidade total de empregos existentes.','Rendimento médio':'Média dos rendimentos do grupo definido pela pesquisa. Não é o salário de cada pessoa nem representa necessariamente a renda mediana.','Servidor público':'Pessoa que trabalha no setor público, sob regime estatutário ou outra forma de contratação. As bases estatísticas podem classificar vínculos de maneiras distintas.'};function showTerm(term){document.getElementById('termTitle').textContent=term;document.getElementById('termText').textContent=definitions[term];document.getElementById('termDialog').showModal()}document.getElementById('glossary').innerHTML=Object.entries(definitions).map(([k,v])=>`<div class="term"><b>${k}</b><p>${v}</p></div>`).join('');document.getElementById('sectors').textContent='Distribuição setorial em validação na fonte original.';const navButtons=[...document.querySelectorAll('nav button[data-tab]')];
function chooseTab(id,updateHash=true) {
 if(!navButtons.some(b=>b.dataset.tab===id))return;
 navButtons.forEach(b=>{
   const selected=b.dataset.tab===id;
   b.classList.toggle('active',selected);
   b.setAttribute('aria-selected',String(selected));
   b.tabIndex=selected?0:-1;
 });
 document.querySelectorAll('.tab').forEach(panel=>{panel.hidden=panel.id!==id;});
 if(updateHash) history.replaceState(null,'','#'+id);
}
navButtons.forEach((b,i)=>{
 b.addEventListener('click',()=>chooseTab(b.dataset.tab));
 b.addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();
   const next=event.key==='Home'?0:event.key==='End'?navButtons.length-1:
      (i+(event.key==='ArrowRight'?1:-1)+navButtons.length)%navButtons.length;
   navButtons[next].focus();
   chooseTab(navButtons[next].dataset.tab);
 });
});
chooseTab(location.hash.slice(1)||'inicio',false);
document.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>showTerm(b.dataset.term)));
document.getElementById('closeDialog').addEventListener('click',()=>document.getElementById('termDialog').close());
document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-controls',b.dataset.tab));
