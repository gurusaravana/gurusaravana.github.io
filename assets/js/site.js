var yr=document.getElementById('yr');if(yr)yr.textContent=new Date().getFullYear();
(function(){var r=document.documentElement,b=document.getElementById('theme');
try{var s=localStorage.getItem('theme');if(s)r.dataset.theme=s}catch(e){}
b.onclick=function(){var d=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');r.dataset.theme=d==='dark'?'light':'dark';try{localStorage.setItem('theme',r.dataset.theme)}catch(e){}}})();
(function(){var q=document.getElementById('q');if(!q)return;var k='all',btns=document.querySelectorAll('.toolbar button');
function run(){var t=q.value.toLowerCase(),n=0;document.querySelectorAll('.pub').forEach(function(p){var ok=(k==='all'||p.dataset.kind===k)&&p.textContent.toLowerCase().indexOf(t)>-1;p.style.display=ok?'':'none';if(ok)n++});
document.querySelectorAll('#publist h3.year').forEach(function(h){var ol=h.nextElementSibling,any=[].some.call(ol.children,function(li){return li.style.display!=='none'});h.style.display=ol.style.display=any?'':'none'});
document.getElementById('none').style.display=n?'none':'block'}
q.oninput=run;btns.forEach(function(b){b.onclick=function(){btns.forEach(function(x){x.classList.remove('on')});b.classList.add('on');k=b.dataset.k;run()}})})();
