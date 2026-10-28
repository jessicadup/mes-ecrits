// Chiffrement AES-GCM dans le navigateur : le mot de passe n'est jamais stocké.
const _e=new TextEncoder(),_d=new TextDecoder();
const toB64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function _key(pw,salt){const m=await crypto.subtle.importKey('raw',_e.encode(pw),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function lock(obj,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await _key(pw,salt),_e.encode(JSON.stringify(obj))));
 return{s:toB64(salt),i:toB64(iv),d:toB64(ct)}}
async function unlock(e,pw){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(e.i)},await _key(pw,fromB64(e.s)),fromB64(e.d));return JSON.parse(_d.decode(pt))}
