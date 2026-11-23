/* Tokyo Nodes 仪表盘 Service Worker
   策略：静态资源缓存优先（离线可打开），status.json 永不缓存（保持实时） */
const CACHE='tokyo-nodes-v1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // status.json / n2node.txt 一律网络直取
  if(/status2?\.json|n2node\.txt/.test(u.pathname)){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>
      new Response('{}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  // 其他只缓存 GET 同源
  if(e.request.method!=='GET' || u.origin!==location.origin) return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return res;
    })).catch(()=>caches.match('./index.html'))
  );
});
