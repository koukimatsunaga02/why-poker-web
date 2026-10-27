/* why encrypted GitHub storage. No credentials or decryption keys in source. */
(function(root){
'use strict';
const DENOMS=[1,5,10,25,100,500,1000],MAX=600000,AAD=new TextEncoder().encode('why-poker:v1');
const bytes64=bytes=>{let s='';for(const n of bytes)s+=String.fromCharCode(n);return btoa(s)},from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const keyText=b=>bytes64(b).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
function keyBytes(text){if(!/^[A-Za-z0-9_-]{43}$/.test(text))throw new Error('閲覧キーは43文字です。配布されたキーを確認してください。');const b=from64(text.replaceAll('-','+').replaceAll('_','/')+'=');if(b.length!==32||keyText(b)!==text)throw new Error('閲覧キーの形式が正しくありません。');return b}
const generateKey=()=>keyText(crypto.getRandomValues(new Uint8Array(32)));
const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const text=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function validate(data){
 const fail=()=>{throw new Error('成績データの形式が正しくありません。対応するwhyのJSONを選択してください。')};
 if(!data||data.version!==2||!Array.isArray(data.members)||data.members.length>200||!Array.isArray(data.seasons)||!data.seasons.length||data.seasons.length>200)fail();
 const ids=new Set();for(const m of data.members){if(!text(m.id,100)||ids.has(m.id)||!text(m.name,32)||!text(m.icon,16)||!/^#[0-9a-fA-F]{6}$/.test(m.color)||m.photo&&(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(m.photo)||m.photo.length>350000)||m.deletedAt&&typeof m.deletedAt!=='string')fail();ids.add(m.id)}
 const seasons=new Set();let open=0;for(const s of data.seasons){if(!text(s.id,100)||seasons.has(s.id)||!text(s.name,40)||!date(s.start)||s.end!==null&&(!date(s.end)||s.end<s.start)||!integer(s.base)||!Array.isArray(s.events)||s.events.length>10000)fail();seasons.add(s.id);if(s.end===null)open++;
  const records=new Set(),days=new Set();for(const e of s.events){if(!text(e.id,100)||records.has(e.id)||!date(e.date)||e.date<s.start||s.end&&e.date>s.end||!text(e.name,70)||e.type!==undefined&&!['event','adjustment'].includes(e.type)||!Array.isArray(e.results)||!e.results.length)fail();records.add(e.id);if(e.type!=='adjustment'){if(days.has(e.date))fail();days.add(e.date)}const players=new Set();for(const r of e.results){if(!ids.has(r.id)||players.has(r.id)||!integer(r.bonus)||!r.chips||DENOMS.some(d=>!integer(r.chips[d],1e6))||!Number.isSafeInteger(r.stack)||r.stack!==DENOMS.reduce((v,d)=>v+d*r.chips[d],0))fail();players.add(r.id)}}
 }
 if(open>1)fail();if(new TextEncoder().encode(JSON.stringify(data)).length>MAX)throw new Error('保存サイズの上限（600KB）を超えています。アイコン画像を小さくしてください。');return data;
}
async function aesKey(secret){return crypto.subtle.importKey('raw',keyBytes(secret),'AES-GCM',false,['encrypt','decrypt'])}
async function encrypt(data,secret){validate(data);const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:AAD,tagLength:128},await aesKey(secret),new TextEncoder().encode(JSON.stringify(data)));return {format:'why-encrypted',version:1,algorithm:'AES-256-GCM',iv:bytes64(iv),ciphertext:bytes64(new Uint8Array(cipher))}}
async function decrypt(payload,secret){if(!payload||payload.format!=='why-encrypted'||payload.version!==1||payload.algorithm!=='AES-256-GCM'||typeof payload.iv!=='string'||typeof payload.ciphertext!=='string'||payload.ciphertext.length>850000)throw new Error('暗号化ファイルの形式が正しくありません。');let plain;try{const iv=from64(payload.iv);if(iv.length!==12)throw new Error();plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:AAD,tagLength:128},await aesKey(secret),from64(payload.ciphertext))}catch{throw new Error('閲覧キーが違うか、保存ファイルが変更されています。')}return validate(JSON.parse(new TextDecoder().decode(plain)))}
class GithubVault{
 constructor(config,{fetcher=(...args)=>fetch(...args)}={}){if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repo))throw new Error('保存先の設定がありません。');this.config=config;this.fetcher=fetcher;this.secret='';this.token='';this.sha=null;this.busy=false;this.lastRead=0;this.revision=null}
 get url(){const c=this.config;return `https://api.github.com/repos/${c.repo}/contents/${c.path.split('/').map(encodeURIComponent).join('/')}`}
 async request(method='GET',body){const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};if(this.token)headers.Authorization='Bearer '+this.token;if(body)headers['Content-Type']='application/json';let response;try{response=await this.fetcher(this.url+(method==='GET'?'?ref='+encodeURIComponent(this.config.branch)+'&t='+Date.now():''),{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(25000)})}catch{throw new Error('GitHubに接続できません。入力内容は保持されています。接続を確認して再実行してください。')}
  if(!response.ok){const errors={401:'編集トークンが無効・期限切れです。接続設定で再入力してください。',403:'GitHubの権限または利用回数の制限です。トークン権限・有効期限を確認してください。',404:'保存ファイルが見つかりません。保存先と公開設定を確認してください。',409:'ほかの画面で更新されました。入力内容を控えてから最新データを読み込んでください。',422:'GitHubに保存できません。権限と保存サイズを確認してください。'};const error=new Error(errors[response.status]||'GitHubでエラーが発生しました（'+response.status+'）。');error.status=response.status;throw error}return response.json();
 }
 async open(secret){keyBytes(secret);const file=await this.request();if(file.encoding!=='base64'||typeof file.content!=='string')throw new Error('GitHubのファイルを読み込めません。');const payload=JSON.parse(new TextDecoder().decode(from64(file.content.replace(/\s/g,''))));const data=await decrypt(payload,secret);this.secret=secret;this.sha=file.sha;this.lastRead=Date.now();this.revision=data.savedAt||null;return data}
 setToken(token){if(token&&!/^[A-Za-z0-9_]{20,255}$/.test(token))throw new Error('編集トークンの形式を確認してください。');this.token=token}
 async save(data){if(!this.secret||!this.sha)throw new Error('先に共有データを読み込んでください。');if(!this.token)throw new Error('編集するには接続設定で主催者のGitHubトークンを入力してください。');if(this.busy)throw new Error('保存中です。完了までお待ちください。');this.busy=true;try{validate(data);const latest=await this.request();if(latest.sha!==this.sha){const error=new Error('ほかの画面で更新されました。入力内容は保持しています。控えを保存してから、接続設定で再読み込みしてください。');error.status=409;throw error}const next={...data,savedAt:new Date().toISOString()},payload=await encrypt(next,this.secret);const response=await this.request('PUT',{message:'Update encrypted poker records',content:bytes64(new TextEncoder().encode(JSON.stringify(payload))),sha:this.sha,branch:this.config.branch});this.sha=response.content.sha;this.lastRead=Date.now();this.revision=next.savedAt;return next}finally{this.busy=false}}
 lock(){this.secret='';this.token='';this.sha=null;this.revision=null}
}
root.WhyVault={generateKey,keyBytes,encrypt,decrypt,validate,GithubVault};
})(globalThis);
