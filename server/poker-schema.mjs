const DENOMS=[1,5,10,25,100,500,1000],MAX=600000;
const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const text=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function validate(data){
 const fail=()=>{throw new Error('成績データの形式が正しくありません。対応するwhyのJSONを選択してください。')};
 if(!data||data.version!==2||!Array.isArray(data.members)||data.members.length>200||!Array.isArray(data.seasons)||!data.seasons.length||data.seasons.length>200)fail();
 const ids=new Set();for(const m of data.members){if(!text(m.id,100)||ids.has(m.id)||!text(m.name,32)||!text(m.icon,16)||!/^#[0-9a-fA-F]{6}$/.test(m.color)||m.photo&&(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(m.photo)||m.photo.length>350000)||m.deletedAt&&typeof m.deletedAt!=='string')fail();ids.add(m.id)}
 const seasons=new Set();let open=0;for(const s of data.seasons){if(!text(s.id,100)||seasons.has(s.id)||!text(s.name,40)||!date(s.start)||s.end!==null&&(!date(s.end)||s.end<s.start)||!integer(s.base)||!Array.isArray(s.events)||s.events.length>10000)fail();seasons.add(s.id);if(s.end===null)open++;
  const records=new Set(),days=new Set();for(const e of s.events){if(!text(e.id,100)||records.has(e.id)||!date(e.date)||e.date<s.start||s.end&&e.date>s.end||!text(e.name,70)||e.type!==undefined&&!['event','adjustment'].includes(e.type)||!Array.isArray(e.results)||!e.results.length)fail();records.add(e.id);if(e.type!=='adjustment'){if(days.has(e.date))fail();days.add(e.date)}const players=new Set();for(const r of e.results){if(!ids.has(r.id)||players.has(r.id)||!integer(r.bonus)||!r.chips||DENOMS.some(d=>!integer(r.chips[d],1e6))||!Number.isSafeInteger(r.stack)||r.stack!==DENOMS.reduce((v,d)=>v+d*r.chips[d],0))fail();players.add(r.id)}}
 }
 if(open>1)fail();if(new TextEncoder().encode(JSON.stringify(data)).length>MAX)throw new Error('保存サイズの上限（600KB）を超えています。アイコン画像を小さくしてください。');return data;
}
