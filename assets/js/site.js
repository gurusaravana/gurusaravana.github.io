var yr=document.getElementById('yr');if(yr)yr.textContent=new Date().getFullYear();
(function(){var r=document.documentElement,b=document.getElementById('theme');
try{var s=localStorage.getItem('theme');if(s)r.dataset.theme=s}catch(e){}
b.onclick=function(){var d=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');r.dataset.theme=d==='dark'?'light':'dark';try{localStorage.setItem('theme',r.dataset.theme)}catch(e){}}})();
(function(){var q=document.getElementById('q');if(!q)return;var k='all',btns=document.querySelectorAll('.toolbar button');
function run(){var t=q.value.toLowerCase(),n=0;document.querySelectorAll('.pub').forEach(function(p){var ok=(k==='all'||p.dataset.kind===k)&&p.textContent.toLowerCase().indexOf(t)>-1;p.style.display=ok?'':'none';if(ok)n++});
document.querySelectorAll('#publist h3.year').forEach(function(h){var ol=h.nextElementSibling,any=[].some.call(ol.children,function(li){return li.style.display!=='none'});h.style.display=ol.style.display=any?'':'none'});
document.getElementById('none').style.display=n?'none':'block'}
q.oninput=run;btns.forEach(function(b){b.onclick=function(){btns.forEach(function(x){x.classList.remove('on')});b.classList.add('on');k=b.dataset.k;run()}})})();

/* Gallery: click a photo to view it full size */
(function(){
  var imgs=document.querySelectorAll('.gitem img');if(!imgs.length)return;
  imgs.forEach(function(img){img.addEventListener('click',function(){
    var cap=img.parentNode.querySelector('figcaption');
    var box=document.createElement('div');box.className='lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-label','Photo');
    var big=document.createElement('img');big.src=img.src;big.alt=img.alt;
    var p=document.createElement('p');p.textContent=cap?cap.innerText.split(/\n+/).join(' · '):'';
    var x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Close');x.textContent='×';
    box.appendChild(x);box.appendChild(big);box.appendChild(p);document.body.appendChild(box);x.focus();
    function close(){box.remove();document.removeEventListener('keydown',key)}
    function key(e){if(e.key==='Escape')close()}
    box.addEventListener('click',function(e){if(e.target!==big)close()});document.addEventListener('keydown',key);
  })});
})();
