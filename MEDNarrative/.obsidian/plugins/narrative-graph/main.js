// narrative-graph v0.1.0 - Narrative Toolchain
var k=(n,e)=>()=>{try{return e||n((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};var J=k((hs,nt)=>{var Zn=Object.freeze(["Entry","Content","Dialog","Choice","End"]),Qn=Object.freeze(["Marker","Event"]),ei="End",ti=Object.freeze(["set","add","subtract","toggle"]),ni=Object.freeze({input:Object.freeze({side:"left",t:.5}),output:Object.freeze({side:"right",t:.5})});function ii(){return{input:{side:"left",t:.5},output:{side:"right",t:.5}}}nt.exports={SAVED_STATE_VERSION:1,NODE_TYPES:Zn,ENGINE_ONLY_NODE_TYPES:Qn,END_NODE_TYPE:ei,EFFECT_OPS:ti,DEFAULT_PORTS:ni,defaultPorts:ii}});var st=k((us,ot)=>{var{SAVED_STATE_VERSION:it}=J(),ri=Object.freeze(["id","type","title","body","x","y","choices","choiceOptions","choiceRevealMode","cast","turns","customFields","ports","frameId","width","height"]),oi=Object.freeze(["id","from","to","choiceIndex","choiceOptionId","label","requirements","toPort"]);function q(n){return n!==null&&typeof n=="object"&&!Array.isArray(n)}function si(n){return n===void 0?void 0:JSON.parse(JSON.stringify(n))}function rt(n){let e=[];if(!q(n))return["saved-state root must be an object"];if(n.version!==it&&e.push(`saved-state version must be ${it}, got ${JSON.stringify(n.version)}`),!q(n.project))return e.push("missing project object"),e;let t=n.project;if(!Array.isArray(t.nodes))return e.push("missing project.nodes array"),e;let i=t.links||[];if(!Array.isArray(i))return e.push("project.links must be an array"),e;let r=new Set;for(let o of t.nodes){if(!q(o)){e.push("project.nodes contains a non-object entry");continue}let s=o.id!==void 0?`'${o.id}'`:"(missing id)";if(typeof o.id!="string"||o.id.length===0){e.push(`node ${s}: missing or invalid id`);continue}r.has(o.id)&&e.push(`node '${o.id}': duplicate node id`),r.add(o.id),(typeof o.type!="string"||o.type.length===0)&&e.push(`node '${o.id}': missing or invalid type`)}for(let o of i){if(!q(o)){e.push("project.links contains a non-object entry");continue}let s=o.id!==void 0?`'${o.id}'`:"(missing id)";(typeof o.id!="string"||o.id.length===0)&&e.push(`link ${s}: missing or invalid id`),r.has(o.from)||e.push(`link ${s}: 'from' references unknown node '${o.from}'`),r.has(o.to)||e.push(`link ${s}: 'to' references unknown node '${o.to}'`)}return e}function ai(n){let e;if(typeof n=="string")try{e=JSON.parse(n)}catch(t){throw new SyntaxError(`Invalid .ncanvas JSON: ${t.message}`)}else if(q(n))e=n;else throw new SyntaxError("Invalid .ncanvas: input must be JSON text or an object");return{state:e,errors:rt(e)}}function li(n){let e=q(n)&&q(n.state)?n.state:n;if(!q(e)||!q(e.project))throw new Error("Cannot serialize: not a saved-state object");let t=si(e);return JSON.stringify(t,null,2)}ot.exports={parseSavedState:ai,serializeSavedState:li,validateSavedState:rt,KNOWN_NODE_FIELDS:ri,KNOWN_LINK_FIELDS:oi}});var oe=k((ps,at)=>{function ve(n,e,t,i){let r=i-1;for(let o of n){if(typeof o!="string")continue;let s=o.match(e);if(s){let a=parseInt(s[1],10);a>r&&(r=a)}}return t+(r+1)}function di(n){let e=Array.isArray(n)?n.map(t=>t&&t.id):[];return ve(e,/^n(\d+)$/,"n",0)}function ci(n){let e=Array.isArray(n)?n.map(t=>t&&t.id):[];return ve(e,/^l(\d+)$/,"l",0)}function hi(n){let e=[];if(Array.isArray(n)){for(let t of n)if(t&&Array.isArray(t.choiceOptions))for(let i of t.choiceOptions)i&&typeof i.id=="string"&&e.push(i.id)}return ve(e,/^opt_(\d+)$/,"opt_",1)}at.exports={nextNodeId:di,nextLinkId:ci,nextOptionId:hi}});var Z=k((fs,lt)=>{function ui(n){return Array.isArray(n)?n.filter(e=>e&&typeof e.line=="string").map(e=>`${e.speaker}: ${e.line}`).join(`
`):""}function pi(n,e){if(!e)return null;for(let t of[":","\uFF1A"])if(n.startsWith(e+t))return n.slice(e.length+1).replace(/^\s+/,"");return null}function fi(n){if(!n||typeof n!="object")return[];if(Array.isArray(n.turns)&&n.turns.length>0)return n.turns;let e=typeof n.body=="string"?n.body:"";if(e.trim().length===0)return[];let t=(typeof n.title=="string"?n.title:"").trim(),i=[];for(let r of e.split(`
`)){if(r.trim().length===0)continue;let o=pi(r,t);i.push({speaker:t,line:o!==null?o:r})}return i}lt.exports={flattenTurns:ui,deriveTurns:fi}});var xe=k((gs,ht)=>{var dt=Object.freeze(["left","right","top","bottom"]);function ct(n){return dt.includes(n)}function gi(n){if(!n||typeof n!="object"||!ct(n.side))return null;let e=Number.isFinite(n.t)?Math.min(1,Math.max(0,n.t)):.5;return{side:n.side,t:e}}ht.exports={PORT_SIDES:dt,isPortSide:ct,normalizePort:gi}});var mt=k((_s,_t)=>{var{NODE_TYPES:_i,END_NODE_TYPE:mi,defaultPorts:ut}=J(),{nextNodeId:yi,nextLinkId:bi,nextOptionId:pt}=oe(),{flattenTurns:vi}=Z(),{PORT_SIDES:we,normalizePort:xi}=xe(),ft=Object.freeze({Entry:"Start",Content:"Content",Dialog:"Dialog",Choice:"Choice",End:"End"}),se=Object.freeze({Dialog:200});function wi(n){return se[n]||260}function gt(n){if(!n||typeof n!="object"||!n.project)throw new Error("ops: not a saved-state object");return n.project}function ae(n){let e=gt(n);return Array.isArray(e.nodes)||(e.nodes=[]),e.nodes}function le(n){let e=gt(n);return Array.isArray(e.links)||(e.links=[]),e.links}function X(n,e){return ae(n).find(t=>t&&t.id===e)}function Ee(n,e){return le(n).find(t=>t&&t.id===e)}function ke(n){return ae(n).filter(e=>e&&e.type==="Entry")}function Ei(n,e,t,i){if(!_i.includes(e))throw new Error(`addNode: unsupported node type '${e}'`);let r=ae(n);if(e==="Entry"&&ke(n).length>0)throw new Error("addNode: file already has an Entry node");let o={id:yi(r),type:e,title:ft[e],body:"",x:Number.isFinite(t)?Math.round(t):0,y:Number.isFinite(i)?Math.round(i):0};if(se[e]&&(o.width=se[e]),r.push(o),e==="Dialog")o.turns=[{speaker:"",line:""}];else if(e==="Choice"){o.choices=[],o.choiceOptions=[];for(let s=0;s<2;s++)o.choiceOptions.push({id:pt(r),label:"",requires:"",effects:[]}),o.choices.push("")}return o}function ki(n,e){let t=ae(n),i=t.findIndex(a=>a&&a.id===e);if(i<0)throw new Error(`deleteNode: unknown node '${e}'`);if(t[i].type==="Entry"&&ke(n).length<=1)throw new Error("deleteNode: cannot delete the last Entry node");t.splice(i,1);let o=le(n),s=o.filter(a=>a&&a.from!==e&&a.to!==e);o.length=0,o.push(...s)}function Si(n,e,t,i){let r=X(n,e);if(!r)throw new Error(`moveNode: unknown node '${e}'`);r.x=Number.isFinite(t)?Math.round(t):r.x,r.y=Number.isFinite(i)?Math.round(i):r.y}function Ci(n,e,t){let i=X(n,e);if(!i)throw new Error(`resizeNode: unknown node '${e}'`);i.x=Math.round(t.x),i.y=Math.round(t.y),i.width=Math.round(t.width),i.height=Math.round(t.height),i.manualSize=!0}function Ni(n,e,t){let i=X(n,e);if(!i)throw new Error(`setNodeTitle: unknown node '${e}'`);i.title=String(t??"")}function Ii(n,e,t){let i=X(n,e);if(!i)throw new Error(`setNodeBody: unknown node '${e}'`);i.body=String(t??"")}function Ai(n,e){if(!n||typeof n!="object")throw new Error("setTurns: not a node object");let t=(Array.isArray(e)?e:[]).map(i=>({speaker:String(i&&i.speaker!=null?i.speaker:"").trim(),line:String(i&&i.line!=null?i.line:"").trim()})).filter(i=>i.speaker.length>0||i.line.length>0);n.turns=t,n.body=vi(t)}function Mi(n,e,t,i){if(!n||typeof n!="object")throw new Error("setChoiceOptions: not a node object");let r=Array.isArray(t)?t:[n],o=new Map((Array.isArray(n.choiceOptions)?n.choiceOptions:[]).filter(a=>a&&typeof a.id=="string").map(a=>[a.id,a])),s=[];for(let a of Array.isArray(e)?e:[]){let l=a&&typeof a.id=="string"&&o.has(a.id)?o.get(a.id):{id:pt([...r,{choiceOptions:s}])};l.label=String(a&&a.label!=null?a.label:""),l.requires=String(a&&a.requires!=null?a.requires:""),l.effects=(Array.isArray(a&&a.effects)?a.effects:[]).filter(c=>c&&typeof c=="object").map(c=>({trigger:String(c.trigger||"onChoose"),op:String(c.op||"set"),key:String(c.key!=null?c.key:""),value:String(c.value!=null?c.value:"")})),s.push(l)}if(n.choiceOptions=s,n.choices=s.map(a=>a.label),Array.isArray(i)){let a=new Map(s.map((l,c)=>[l.id,c]));for(let l of i){if(!l||l.from!==n.id||l.choiceOptionId==null)continue;let c=a.get(String(l.choiceOptionId));c!==void 0&&(l.label=s[c].label||"",l.choiceIndex=c)}}}function Di(n,e,t,i,r){let o=X(n,e),s=X(n,t);if(!o)throw new Error(`addLink: unknown source node '${e}'`);if(!s)throw new Error(`addLink: unknown target node '${t}'`);if(e===t)throw new Error("addLink: self-links are not allowed");if(o.type===mi)throw new Error("addLink: End nodes have no output port");if(s.type==="Entry")throw new Error("addLink: Entry nodes have no input port");let a=le(n),l=i!=null?String(i):null;if(a.some(h=>h&&h.from===e&&h.to===t&&(h.choiceOptionId!=null?String(h.choiceOptionId):null)===l))throw new Error("addLink: duplicate link (same from/to/choiceOptionId)");let d={id:bi(a),from:e,to:t};if(o.type==="Choice"){if(!l)throw new Error("addLink: Choice sources require a choiceOptionId");let h=Array.isArray(o.choiceOptions)?o.choiceOptions:[],u=h.findIndex(p=>p&&p.id===l);if(u<0)throw new Error(`addLink: node '${e}' has no option '${l}'`);d.choiceOptionId=l,d.choiceIndex=u,d.label=h[u].label||""}else if(l)throw new Error("addLink: only Choice sources may carry a choiceOptionId");return r&&o.type!=="Choice"&&we.includes(r.fromSide)&&((!o.ports||typeof o.ports!="object")&&(o.ports=ut()),o.ports.output={side:r.fromSide,t:.5}),r&&we.includes(r.toSide)&&((!s.ports||typeof s.ports!="object")&&(s.ports=ut()),s.ports.input={side:r.toSide,t:.5},d.toPort={side:r.toSide,t:Number.isFinite(r.toT)?Math.min(1,Math.max(0,r.toT)):.5}),a.push(d),d}function Li(n,e){let t=le(n),i=t.findIndex(r=>r&&r.id===e);if(i<0)throw new Error(`deleteLink: unknown link '${e}'`);t.splice(i,1)}function Ti(n,e,t){let i=Ee(n,e);if(!i)throw new Error(`setLinkRequirements: unknown link '${e}'`);let r=String(t??"").trim();r.length>0?i.requirements=r:delete i.requirements}function Oi(n,e,t){let i=Ee(n,e);if(!i)throw new Error(`setLinkToPort: unknown link '${e}'`);let r=xi(t);r?i.toPort=r:delete i.toPort}_t.exports={DEFAULT_TITLES:ft,DEFAULT_NODE_WIDTHS:se,PORT_SIDES:we,defaultWidthFor:wi,findNode:X,findLink:Ee,entryNodes:ke,addNode:Ei,deleteNode:ki,moveNode:Si,resizeNode:Ci,setNodeTitle:Ni,setNodeBody:Ii,setTurns:Ai,setChoiceOptions:Mi,addLink:Di,deleteLink:Li,setLinkRequirements:Ti,setLinkToPort:Oi}});var Ie=k((ms,vt)=>{var Se=Object.freeze(["===","!==",">=","<=",">","<"]),Ce=0,Ne=3;function Pi(n){let e=[],t=0,i=o=>/[A-Za-z_$]/.test(o),r=o=>/[A-Za-z0-9_$.]/.test(o);for(;t<n.length;){let o=n[t];if(/\s/.test(o)){t++;continue}let s=n.slice(t,t+2),a=n.slice(t,t+3);if(a==="==="||a==="!=="){e.push({t:"op",v:a}),t+=3;continue}if(s==="&&"||s==="||"||s===">="||s==="<="||s==="=="){e.push({t:s==="=="?"badop":"op",v:s}),t+=2;continue}if(o===">"||o==="<"){e.push({t:"op",v:o}),t++;continue}if(o==="!"){e.push({t:"!"}),t++;continue}if(o==="("){e.push({t:"("}),t++;continue}if(o===")"){e.push({t:")"}),t++;continue}if(o===","){e.push({t:","}),t++;continue}if(o==='"'||o==="'"){let l=o,c=t+1,d="",h=!1;for(;c<n.length;){let u=n[c];if(u==="\\"&&c+1<n.length){let p=n[c+1];p==="n"?d+=`
`:p==="t"?d+="	":d+=p,c+=2;continue}if(u===l){h=!0,c++;break}d+=u,c++}if(!h)return null;e.push({t:"string",value:d}),t=c;continue}if(/[0-9]/.test(o)||o==="-"&&/[0-9]/.test(n[t+1]||"")){let l=t+(o==="-"?1:0);for(;l<n.length&&/[0-9.]/.test(n[l]);)l++;let c=Number(n.slice(t,l));if(Number.isNaN(c))return null;e.push({t:"number",value:c}),t=l;continue}if(i(o)){let l=t;for(;l<n.length&&r(n[l]);)l++;let c=n.slice(t,l);c==="true"||c==="false"?e.push({t:"bool",value:c==="true"}):e.push({t:"ident",v:c}),t=l;continue}return null}return e}function zi(n){let e=0,t=()=>n[e],i=()=>n[e++];function r(){return o()}function o(){let h=s();if(!h)return null;for(;t()&&t().t==="op"&&t().v==="||";){i();let u=s();if(!u)return null;h={type:"logical",operator:"||",left:h,right:u}}return h}function s(){let h=a();if(!h)return null;for(;t()&&t().t==="op"&&t().v==="&&";){i();let u=a();if(!u)return null;h={type:"logical",operator:"&&",left:h,right:u}}return h}function a(){let h=t();if(!h)return null;if(h.t==="!"){i();let u=a();return u?{type:"unary",operator:"!",argument:u}:null}if(h.t==="("){i();let u=r();return!u||!t()||t().t!==")"?null:(i(),{type:"group",expression:u})}return l()}function l(){let h=c();if(!h)return null;let u=t();if(u&&u.t==="op"&&Se.includes(u.v)){i();let p=c();return p?{type:"binary",operator:u.v,left:h,right:p}:null}return u&&u.t==="badop"?null:h}function c(){let h=t();if(!h)return null;if(h.t==="ident"){if(i(),t()&&t().t==="("){i();let u=[];if(t()&&t().t!==")")for(;;){let p=c();if(!p||p.type!=="literal")return null;if(u.push(p),t()&&t().t===","){i();continue}break}return!t()||t().t!==")"?null:(i(),{type:"call",name:h.v,args:u})}return{type:"identifier",path:h.v}}return h.t==="number"?(i(),{type:"literal",kind:"number",value:h.value}):h.t==="string"?(i(),{type:"literal",kind:"string",value:h.value}):h.t==="bool"?(i(),{type:"literal",kind:"bool",value:h.value}):null}let d=r();return!d||e!==n.length?null:d}function Q(n){if(!n||n.type!=="call"||n.name!=="at_period"||n.args.length!==1)return null;let e=n.args[0];if(e.kind!=="number")return null;let t=e.value;return Number.isInteger(t)&&t>=Ce&&t<=Ne?t:null}function de(n,e){return n.type==="logical"&&n.operator===e?[...de(n.left,e),...de(n.right,e)]:[n]}function $i(n){return!n||n.type!=="literal"?null:n.kind==="bool"?n.value?"true":"false":n.kind==="number"?String(n.value):JSON.stringify(n.value)}function yt(n){if(!n)return null;if(n.type==="identifier")return{type:"state",key:n.path,op:"truthy",value:""};if(n.type==="unary"&&n.operator==="!"&&n.argument.type==="identifier")return{type:"state",key:n.argument.path,op:"falsy",value:""};if(n.type==="call"){let e=Q(n);return e===null?null:{type:"period",periods:[e]}}if(n.type==="binary"){if(n.left.type!=="identifier")return null;let e=$i(n.right);return e===null?null:{type:"state",key:n.left.path,op:n.operator,value:e}}if(n.type==="group"){let e=n.expression,t=e.type==="logical"&&e.operator==="||"?de(e,"||"):[e];return t.length===0||t.some(i=>Q(i)===null)?null:{type:"period",periods:t.map(Q)}}return null}function qi(n){if(n.type==="logical"){let t=de(n,n.operator);if(n.operator==="||"&&t.every(r=>Q(r)!==null))return{clauses:[{type:"period",periods:t.map(Q)}],combinator:"&&"};let i=t.map(yt);return i.some(r=>r===null)?null:{clauses:i,combinator:n.operator}}let e=yt(n);return e?{clauses:[e],combinator:"&&"}:null}function Vi(n){let e=String(n??"").trim();if(!e)return{clauses:[],combinator:"&&"};let t=Pi(e);if(!t||t.length===0)return{raw:e};let i=zi(t);if(!i)return{raw:e};let r=qi(i);return r?{clauses:ji(r.clauses),combinator:r.combinator}:{raw:e}}function ji(n){return n.map(e=>e.type==="period"?{type:"period",periods:bt(e.periods)}:{type:"state",key:e.key,op:e.op,value:e.value})}function bt(n){let e=Array.isArray(n)?n:[n];return[...new Set(e.map(Number).filter(t=>Number.isInteger(t)&&t>=Ce&&t<=Ne))].sort((t,i)=>t-i)}function Fi(n){return!n||!Array.isArray(n.clauses)?n&&typeof n.raw=="string"?n.raw:"":n.clauses.map(Ri).filter(Boolean).join(n.combinator==="||"?" || ":" && ")}function Ri(n){if(!n)return"";if(n.type==="period"){let i=bt(n.periods);if(i.length===0)return"";let r=i.map(o=>`at_period(${o})`);return r.length===1?r[0]:`(${r.join(" || ")})`}let e=String(n.key||"").trim();if(!e)return"";if(n.op==="truthy")return e;if(n.op==="falsy")return`!${e}`;if(!Se.includes(n.op))return"";let t=String(n.value===void 0||n.value===null?"":n.value).trim();return t?`${e} ${n.op} ${t}`:""}function Bi(n,e){if(n==="bool")return e===!0||e==="true"?"true":e===!1||e==="false"?"false":null;if(n==="number"){let t=String(e).trim();return t!==""&&!Number.isNaN(Number(t))?String(Number(t)):null}return JSON.stringify(String(e??""))}vt.exports={STATE_OPS:Se,PERIOD_MIN:Ce,PERIOD_MAX:Ne,parseCondition:Vi,serializeCondition:Fi,formatConditionLiteral:Bi}});var kt=k((ys,Et)=>{var{nextNodeId:Hi,nextLinkId:Yi,nextOptionId:Xi}=oe(),Ui=Ie(),Ae="narrativeGraphClipboard",Me=1;function ce(n){return n===void 0?void 0:JSON.parse(JSON.stringify(n))}function Gi(n,e){let t=n&&n.project,i=t&&Array.isArray(t.nodes)?t.nodes:[],r=t&&Array.isArray(t.links)?t.links:[],o=new Set(Array.isArray(e)?e:[]);if(o.size===0)return null;let s=i.filter(l=>l&&o.has(l.id)).map(l=>ce(l));if(s.length===0)return null;let a=r.filter(l=>l&&o.has(l.from)&&o.has(l.to)).map(l=>ce(l));return{[Ae]:Me,nodes:s,links:a}}function Wi(n){if(typeof n!="string"||n.trim()==="")return null;let e;try{e=JSON.parse(n)}catch{return null}return!e||typeof e!="object"||Array.isArray(e)||e[Ae]!==Me||!Array.isArray(e.nodes)?null:e}var Ki=/\b(?:flag|res)_[A-Za-z0-9_]+/g;function xt(n){let e=[],t=String(n||"").trim();if(!t)return e;let i=Ui.parseCondition(t);if(Array.isArray(i.clauses)){for(let o of i.clauses)o.type==="state"&&o.key&&e.push(o.key);return e}return t.match(Ki)||[]}function wt(n){let e=new Set,t=[],i=r=>{let o=String(r||"").trim();o&&!e.has(o)&&(e.add(o),t.push(o))};for(let r of n&&Array.isArray(n.links)?n.links:[])for(let o of xt(r&&r.requirements))i(o);for(let r of n&&Array.isArray(n.nodes)?n.nodes:[]){let o=r&&Array.isArray(r.choiceOptions)?r.choiceOptions:[];for(let s of o){for(let a of xt(s&&s.requires))i(a);for(let a of s&&Array.isArray(s.effects)?s.effects:[])a&&a.key&&i(a.key)}}return t}function Ji(n,e,t){let i=n&&n.project;if(!i||typeof i!="object")throw new Error("applyPaste: not a saved-state object");Array.isArray(i.nodes)||(i.nodes=[]),Array.isArray(i.links)||(i.links=[]);let r=e&&Array.isArray(e.nodes)?e.nodes:[],o=e&&Array.isArray(e.links)?e.links:[];for(let g of r)if(!g||typeof g.id!="string"||typeof g.type!="string")throw new Error("applyPaste: envelope node missing id/type");if(r.length===0)return{addedNodeIds:[],addedLinkIds:[],missingVariables:[],downgradedEntry:0};let s=t||{},a=1/0,l=1/0,c=-1/0,d=-1/0;for(let g of r){let _=Number.isFinite(g.x)?g.x:0,b=Number.isFinite(g.y)?g.y:0;_<a&&(a=_),b<l&&(l=b),_>c&&(c=_),b>d&&(d=b)}let h,u;s.center&&Number.isFinite(s.center.x)&&Number.isFinite(s.center.y)?(h=s.center.x-(a+c)/2,u=s.center.y-(l+d)/2):(h=40,u=40);let p=new Map,f=new Map,y=[...i.nodes],x=[...i.links],S=!i.nodes.some(g=>g&&g.type==="Entry"),G=0,M=[];for(let g of r){let _=ce(g),b=Hi(y);if(p.set(g.id,b),_.id=b,_.x=Math.round((Number.isFinite(_.x)?_.x:0)+h),_.y=Math.round((Number.isFinite(_.y)?_.y:0)+u),_.type==="Entry"&&(S?S=!1:(_.type="Content",G++)),y.push(_),Array.isArray(_.choiceOptions)){for(let w of _.choiceOptions)if(w&&typeof w.id=="string"){let D=Xi(y);f.set(w.id,D),w.id=D}}i.nodes.push(_),M.push(b)}let O=[];for(let g of o){if(!g||!p.has(g.from)||!p.has(g.to))continue;let _=ce(g);if(_.id=Yi(x),_.from=p.get(g.from),_.to=p.get(g.to),_.choiceOptionId!=null){let b=f.get(String(_.choiceOptionId));if(!b)continue;_.choiceOptionId=b}x.push(_),i.links.push(_),O.push(_.id)}let E=new Set(Array.isArray(s.knownVariables)?s.knownVariables:[]),v=wt(e).filter(g=>!E.has(g));return{addedNodeIds:M,addedLinkIds:O,missingVariables:v,downgradedEntry:G}}Et.exports={CLIPBOARD_MARKER:Ae,CLIPBOARD_VERSION:Me,encodeSelection:Gi,parseEnvelopeText:Wi,referencedVariables:wt,applyPaste:Ji}});var Ct=k((bs,St)=>{function Zi(n){return{cap:Number.isFinite(n)&&n>0?Math.floor(n):50,undo:[],redo:[]}}function Qi(n){let e=n&&n.ui&&typeof n.ui=="object"?n.ui:{};return structuredClone({project:n&&n.project,ui:{selectedNodeId:e.selectedNodeId!=null?e.selectedNodeId:null,selectedLinkId:e.selectedLinkId!=null?e.selectedLinkId:null}})}function er(n,e){for(n.undo.push(e);n.undo.length>n.cap;)n.undo.shift();n.redo.length=0}function tr(n,e){return n.undo.length===0?null:(n.redo.push(e),{snapshot:n.undo.pop()})}function nr(n,e){return n.redo.length===0?null:(n.undo.push(e),{snapshot:n.redo.pop()})}St.exports={DEFAULT_CAP:50,createHistory:Zi,takeSnapshot:Qi,push:er,undo:tr,redo:nr}});var he=k((vs,qt)=>{function Le(n){return!Number.isFinite(n)||n<=0?1:Math.min(2.5,Math.max(.15,n))}function ir(n,e){return{x:n.x*e.scale+e.x,y:n.y*e.scale+e.y}}function Nt(n,e){return{x:(n.x-e.x)/e.scale,y:(n.y-e.y)/e.scale}}function rr(n,e,t){let i=Le(n.scale*t),r=Nt(e,n);return{x:e.x-r.x*i,y:e.y-r.y*i,scale:i}}function Te(n,e){let t=Number.isFinite(n.width)&&n.width>0?n.width:260;if(n.manualSize&&Number.isFinite(n.height)&&n.height>0)return{width:t,height:n.height};let i=Number.isFinite(e)&&e>0?e:It(n);return{width:t,height:i}}function It(n){let e=Number.isFinite(n.width)&&n.width>0?n.width:260,t=Math.max(10,Math.floor((e-24)/13)),i=typeof n.body=="string"?n.body:"",r=0;for(let o of i.split(`
`))r+=Math.max(1,Math.ceil(o.length/t));return Array.isArray(n.choiceOptions)&&n.choiceOptions.length>0&&(r+=n.choiceOptions.length),34+Math.max(1,r)*20+16}function De(n){switch(n){case"left":return{x:-1,y:0};case"right":return{x:1,y:0};case"top":return{x:0,y:-1};case"bottom":return{x:0,y:1};default:return{x:1,y:0}}}function or(n,e,t,i){let r=t||"left",o=Number.isFinite(i)?Math.min(1,Math.max(0,i)):.5;switch(r){case"left":return{x:n.x,y:n.y+e.height*o,side:r};case"right":return{x:n.x+e.width,y:n.y+e.height*o,side:r};case"top":return{x:n.x+e.width*o,y:n.y,side:r};case"bottom":return{x:n.x+e.width*o,y:n.y+e.height,side:r};default:return{x:n.x+e.width,y:n.y+e.height*.5,side:"right"}}}function sr(n,e){let t=n||"left",i=Number.isFinite(e)?Math.min(1,Math.max(0,e)):.5;switch(t){case"left":return{x:0,y:i};case"right":return{x:1,y:i};case"top":return{x:i,y:0};case"bottom":return{x:i,y:1};default:return{x:1,y:.5}}}var At=Object.freeze(["top","right","bottom","left"]),ar=Object.freeze({left:"right",right:"left",top:"bottom",bottom:"top"});function lr(n){return ar[n]||"left"}function dr(n){let e=[];for(let t of At){let i=[];for(let r of["input","output"]){let o=n&&n[r];if(o&&o.side===t){let s=Number.isFinite(o.t)?Math.min(1,Math.max(0,o.t)):.5;i.includes(s)||i.push(s)}}i.length===0&&i.push(.5);for(let r of i)e.push({side:t,t:r})}return e}function cr(n,e,t){let i=Math.abs(t.x-n.x),r=Math.abs(t.x-(n.x+e.width)),o=Math.abs(t.y-n.y),s=Math.abs(t.y-(n.y+e.height)),a="top",l=o;return r<l&&(a="right",l=r),s<l&&(a="bottom",l=s),i<l&&(a="left"),a}function hr(n,e,t,i){let r=o=>Math.min(1,Math.max(0,o));switch(t){case"left":case"right":return r((i.y-n.y)/Math.max(1,e.height));case"top":case"bottom":return r((i.x-n.x)/Math.max(1,e.width));default:return .5}}function ur(n,e){let t=Math.abs(e.x-n.x),i=Math.abs(e.y-n.y),r=Math.min(160,Math.max(40,Math.max(t,i)/2)),o=De(n.side),s=De(e.side),a={x:n.x+o.x*r,y:n.y+o.y*r},l={x:e.x+s.x*r,y:e.y+s.y*r},c=`M ${n.x} ${n.y} C ${a.x} ${a.y}, ${l.x} ${l.y}, ${e.x} ${e.y}`,d={x:(n.x+3*a.x+3*l.x+e.x)/8,y:(n.y+3*a.y+3*l.y+e.y)/8};return{d:c,mid:d}}function pr(n,e){let t=1/0,i=1/0,r=-1/0,o=-1/0;for(let s of n){if(!Number.isFinite(s.x)||!Number.isFinite(s.y))continue;let a=e?e.get(s.id):void 0,l=Te(s,a&&a.height);t=Math.min(t,s.x),i=Math.min(i,s.y),r=Math.max(r,s.x+l.width),o=Math.max(o,s.y+l.height)}return t===1/0?null:{minX:t,minY:i,maxX:r,maxY:o}}function fr(n,e,t,i){let r=Number.isFinite(i)?i:60,o=e>0?e:800,s=t>0?t:600,a=Math.max(1,n.maxX-n.minX),l=Math.max(1,n.maxY-n.minY),c=Le(Math.min((o-r*2)/a,(s-r*2)/l)),d=(n.minX+n.maxX)/2,h=(n.minY+n.maxY)/2;return{x:o/2-d*c,y:s/2-h*c,scale:c}}function Mt(n){return!!n&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.scale)&&n.scale>0}function gr(n,e,t,i){if(!Mt(n)||!e)return!1;let r=t>0?t:800,o=i>0?i:600,s=e.minX*n.scale+n.x,a=e.minY*n.scale+n.y,l=e.maxX*n.scale+n.x,c=e.maxY*n.scale+n.y;return l>=0&&c>=0&&s<=r&&a<=o}function _r(n,e){return{x0:Math.min(n.x,e.x),y0:Math.min(n.y,e.y),x1:Math.max(n.x,e.x),y1:Math.max(n.y,e.y)}}function Dt(n,e){return{x0:n.x,y0:n.y,x1:n.x+e.width,y1:n.y+e.height}}function Lt(n,e){return n.x0<=e.x1&&n.x1>=e.x0&&n.y0<=e.y1&&n.y1>=e.y0}function mr(n,e,t){let i=[];for(let r of n){if(!Number.isFinite(r.x)||!Number.isFinite(r.y))continue;let o=t?t.get(r.id):void 0,s=Te(r,o&&o.height);Lt(e,Dt(r,s))&&i.push(r.id)}return i}var Tt=40;function yr(n,e){let t=Number.isFinite(e)&&e>0?e:Tt,i=n&&Number.isFinite(n.scale)?n.scale:1,r=Math.max(2,t*i),o=n&&Number.isFinite(n.x)?n.x:0,s=n&&Number.isFinite(n.y)?n.y:0;return{backgroundPosition:`${o}px ${s}px`,backgroundSize:`${r}px ${r}px`}}var Ot=120,Pt=60,zt=8,$t=2;function br(n,e,t,i){let r=Number.isFinite(i)&&i>0?i:zt,o=$t;if(e<n.left-o||e>n.right+o||t<n.top-o||t>n.bottom+o)return null;let s=Math.abs(e-n.left),a=Math.abs(e-n.right),l=Math.abs(t-n.top),c=Math.abs(t-n.bottom),d=Math.min(s,a)<=r?s<=a?"w":"e":"",h=Math.min(l,c)<=r?l<=c?"n":"s":"";return!d&&!h?null:h+d}function vr(n){return n?n==="n"||n==="s"?"ns-resize":n==="e"||n==="w"?"ew-resize":n==="ne"||n==="sw"?"nesw-resize":"nwse-resize":""}function xr(n,e,t,i,r){let o=r&&Number.isFinite(r.width)?r.width:Ot,s=r&&Number.isFinite(r.height)?r.height:Pt,a=n.x,l=n.y,c=n.width,d=n.height;return e.includes("e")&&(c=Math.max(o,n.width+t)),e.includes("s")&&(d=Math.max(s,n.height+i)),e.includes("w")&&(c=Math.max(o,n.width-t),a=n.x+(n.width-c)),e.includes("n")&&(d=Math.max(s,n.height-i),l=n.y+(n.height-d)),{x:Math.round(a),y:Math.round(l),width:Math.round(c),height:Math.round(d)}}qt.exports={MIN_SCALE:.15,MAX_SCALE:2.5,ZOOM_STEP:1.1,DEFAULT_NODE_WIDTH:260,FIT_PADDING:60,GRID_SPACING:Tt,MIN_NODE_WIDTH:Ot,MIN_NODE_HEIGHT:Pt,RESIZE_BORDER:zt,RESIZE_OUTER_SLACK:$t,SIDE_ORDER:At,clampScale:Le,worldToScreen:ir,screenToWorld:Nt,zoomAtPoint:rr,resolveNodeSize:Te,estimateNodeHeight:It,sideNormal:De,portAnchor:or,portFraction:sr,sideHandles:dr,oppositeSide:lr,nearestSide:cr,sideT:hr,applyResize:xr,resizeZoneAt:br,resizeCursor:vr,gridBackground:yr,edgePath:ur,nodeBounds:pr,fitView:fr,isValidStoredView:Mt,viewIntersectsBounds:gr,normalizeRect:_r,nodeRect:Dt,rectsIntersect:Lt,nodesInRect:mr}});var Bt=k((xs,Rt)=>{var{NODE_TYPES:wr,DEFAULT_PORTS:Pe}=J(),{normalizePort:Er}=xe(),{deriveTurns:kr}=Z(),{DEFAULT_NODE_WIDTH:Sr,resolveNodeSize:ze,portAnchor:Oe,portFraction:Cr,sideHandles:Nr,edgePath:Ir,nodeBounds:Vt}=he(),Ar="http://www.w3.org/2000/svg",ue=400;function N(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function T(n,e){let t=document.createElementNS(Ar,n);if(e)for(let[i,r]of Object.entries(e))t.setAttribute(i,String(r));return t}function Mr(n){return{Entry:"entry",Content:"content",Dialog:"dialog",Choice:"choice",End:"end"}[n]||"unsupported"}function Dr(n,e,t){let i=N("span",`ng-port ng-port--${n}`);return i.dataset.nodeId=e,t&&(i.dataset.optionId=t),i}function Lr(n,e,t){let i=[];for(let r of Nr(e)){if(t==="Choice"&&r.side==="right")continue;let o=N("span","ng-port ng-port--side");o.dataset.nodeId=n,o.dataset.side=r.side,o.dataset.t=String(r.t);let s=Cr(r.side,r.t);o.style.left=`${s.x*100}%`,o.style.top=`${s.y*100}%`,i.push(o)}return i}var Tr=["ne","nw","se","sw"];function Or(){return Tr.map(n=>{let e=N("span",`ng-resize ng-resize--${n}`);return e.dataset.dir=n,e})}function Pr(n){let e=N("div",`ng-node ng-node--${Mr(n.type)}`);e.dataset.nodeId=n.id;let t=Number.isFinite(n.width)&&n.width>0?n.width:Sr;e.style.width=`${t}px`,e.style.left=`${n.x||0}px`,e.style.top=`${n.y||0}px`,n.manualSize&&Number.isFinite(n.height)&&n.height>0&&(e.style.height=`${n.height}px`,e.classList.add("ng-node--fixed"));let i=n.ports||Pe;for(let s of Lr(n.id,i,n.type))e.appendChild(s);let r=N("div","ng-node__header");n.type==="Entry"&&r.appendChild(N("span","ng-node__marker","\u25B6")),n.type==="End"&&r.appendChild(N("span","ng-node__marker","\u25A0")),r.appendChild(N("span","ng-node__title",n.title||n.type)),wr.includes(n.type)||r.appendChild(N("span","ng-node__badge",`${n.type} (unsupported)`)),r.appendChild(N("span","ng-node-id",n.id)),e.appendChild(r);let o=N("div","ng-node__body");if(n.type==="Dialog"){let s=Array.isArray(n.turns)&&n.turns.length>0?n.turns:kr(n);if(s.length>0)for(let a of s){let l=N("div","ng-node__turn");l.appendChild(N("span","ng-node__speaker",`${a.speaker}:`)),l.appendChild(N("span","ng-node__line",a.line)),o.appendChild(l)}else n.body&&o.appendChild(N("div","ng-node__text",n.body))}else if(n.body&&o.appendChild(N("div","ng-node__text",n.body)),n.type==="Choice"){let a=Array.isArray(n.choiceOptions)&&n.choiceOptions.length>0?n.choiceOptions:Array.isArray(n.choices)?n.choices.map(l=>({label:l})):[];for(let l of a){let c=N("div","ng-node__option",l&&l.label||"(empty option)");l&&l.id&&(c.dataset.optionId=l.id),o.appendChild(c)}for(let l of a)l&&l.id&&e.appendChild(Dr("out",n.id,l.id))}e.appendChild(o);for(let s of Or())e.appendChild(s);return e}function jt(n,e){let t=typeof n.label=="string"?n.label:"",i=e.get(n.from);if(i&&typeof n.choiceOptionId=="string"&&Array.isArray(i.choiceOptions)){let o=i.choiceOptions.find(s=>s&&s.id===n.choiceOptionId);o&&typeof o.label=="string"&&o.label.length>0&&(t=o.label)}let r=typeof n.requirements=="string"&&n.requirements.trim().length>0?n.requirements.trim():"";return{label:t,requirements:r}}function $e(n,e,t){let i=e.get(n.from),r=e.get(n.to);if(!i||!r)return null;let o=ze(i,t.get(i.id)&&t.get(i.id).height),s=ze(r,t.get(r.id)&&t.get(r.id).height),a=i.ports||Pe,l=r.ports||Pe,c=t.get(i.id),d=a.output&&a.output.t;n.choiceOptionId&&c&&c.optionT&&Number.isFinite(c.optionT[n.choiceOptionId])&&(d=c.optionT[n.choiceOptionId]);let h=Oe(i,o,a.output&&a.output.side,d),u=Er(n.toPort),p=u?Oe(r,s,u.side,u.t):Oe(r,s,l.input&&l.input.side,l.input&&l.input.t),{d:f,mid:y}=Ir(h,p),{label:x,requirements:S}=jt(n,e);return{d:f,mid:y,from:h,to:p,label:x,requirements:S}}function zr(n,e){let t=n.querySelector(".ng-edge__path"),i=n.querySelector(".ng-edge__hit");t&&t.setAttribute("d",e.d),i&&i.setAttribute("d",e.d);let r=n.querySelector(".ng-edge-end-handle");r&&(r.setAttribute("cx",String(e.to.x)),r.setAttribute("cy",String(e.to.y)));let o=n.querySelector(".ng-edge__label");o&&(o.setAttribute("x",String(e.mid.x)),o.setAttribute("y",String(e.mid.y-6)),o.textContent=e.label,o.style.display=e.label?"":"none");let s=n.querySelector(".ng-edge__condition");s&&(s.setAttribute("x",String(e.mid.x)),s.setAttribute("y",String(e.mid.y+(e.label?12:-6))),s.textContent=e.requirements,s.style.display=e.requirements?"":"none")}function $r(n,e){let t=T("g",{class:"ng-edge","data-link-id":n.id});t.appendChild(T("path",{class:"ng-edge__hit",d:e.d})),t.appendChild(T("path",{class:"ng-edge__path",d:e.d})),t.appendChild(T("circle",{class:"ng-edge-end-handle",cx:e.to.x,cy:e.to.y,r:6}));let i=T("text",{class:"ng-edge__label",x:e.mid.x,y:e.mid.y-6,"text-anchor":"middle"});i.textContent=e.label,e.label||(i.style.display="none"),t.appendChild(i);let r=T("text",{class:"ng-edge__condition",x:e.mid.x,y:e.mid.y+(e.label?12:-6),"text-anchor":"middle"});return r.textContent=e.requirements,e.requirements||(r.style.display="none"),t.appendChild(r),t}function qr(n,e,t){let i=new Map(n.map(h=>[h.id,h])),r=Vt(n,t),o=new Map;if(!r)return{svg:T("svg",{class:"ng-edges"}),edgeEls:o};let s=r.minX-ue,a=r.minY-ue,l=r.maxX-r.minX+ue*2,c=r.maxY-r.minY+ue*2,d=T("svg",{class:"ng-edges",viewBox:`${s} ${a} ${l} ${c}`});d.style.left=`${s}px`,d.style.top=`${a}px`,d.style.width=`${l}px`,d.style.height=`${c}px`;for(let h of e){let u=$e(h,i,t);if(!u)continue;let p=$r(h,u);o.set(h.id,p),d.appendChild(p)}if(typeof window<"u"&&window.__ngDebug){let h=T("g",{class:"ng-debug"});for(let u of e){let p=$e(u,i,t);if(!p)continue;h.appendChild(T("circle",{class:"ng-debug__from",cx:p.from.x,cy:p.from.y,r:5})),h.appendChild(T("circle",{class:"ng-debug__to",cx:p.to.x,cy:p.to.y,r:5}));let f=T("path",{class:"ng-debug__mid",d:`M ${p.mid.x-6} ${p.mid.y} L ${p.mid.x+6} ${p.mid.y} M ${p.mid.x} ${p.mid.y-6} L ${p.mid.x} ${p.mid.y+6}`});h.appendChild(f)}d.appendChild(h)}return{svg:d,edgeEls:o}}function Ft(n,e){let t=e.offsetHeight>0?e.offsetHeight:void 0,i=ze(n,t),r={width:i.width,height:i.height};if(n.type==="Choice"&&t){let o={};for(let s of e.querySelectorAll(".ng-node__option[data-option-id]")){let a=s.offsetTop+s.offsetHeight/2;if(Number.isFinite(a)){o[s.dataset.optionId]=a/t;let l=e.querySelector(`:scope > .ng-port--out[data-option-id="${s.dataset.optionId}"]`);l&&(l.style.top=`${a}px`)}}r.optionT=o}return r}function Vr(n,e,t){n.textContent="";let i=N("div","ng-canvas");if(n.appendChild(i),t&&t.length>0){let p=N("div","ng-canvas__warning",`File has ${t.length} parse problem(s) \u2014 rendering valid parts only.`);p.title=t.join(`
`),i.appendChild(p)}let r=e.project||{},o=Array.isArray(r.nodes)?r.nodes:[],s=Array.isArray(r.links)?r.links:[],a=N("div","ng-world");i.appendChild(a);let l=document.createDocumentFragment(),c=new Map;for(let p of o){let f=Pr(p);c.set(p.id,f),l.appendChild(f)}a.appendChild(l);let d=new Map;for(let p of o)d.set(p.id,Ft(p,c.get(p.id)));let{svg:h,edgeEls:u}=qr(o,s,d);return a.insertBefore(h,a.firstChild),{worldEl:a,frameEl:i,svgEl:h,nodeEls:c,edgeEls:u,sizes:d,bounds:Vt(o,d)}}Rt.exports={renderCanvas:Vr,layoutEdge:$e,applyEdgeLayout:zr,resolveEdgeLabels:jt,measureNode:Ft}});var Yt=k((ws,Ht)=>{var pe=Ie(),jr=0,Fr=["\u4E0A\u5348","\u4E0B\u5348","\u9EC4\u660F","\u6DF1\u591C"],Rr=[["===","\u7B49\u4E8E"],["!==","\u4E0D\u7B49\u4E8E"],[">=","\u2265"],["<=","\u2264"],[">","\uFF1E"],["<","\uFF1C"],["truthy","\u4E3A\u771F"],["falsy","\u4E3A\u5047"]];function C(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function Br(n,e,t){let i=t&&t.getVariables||(()=>[]),r=`ng-cond-vars-${++jr}`,o=C("div","ng-cond"),s=C("div","ng-cond__rows"),a=C("div","ng-cond__bar"),l=C("div","ng-cond__note","\u8868\u8FBE\u5F0F\u8F83\u590D\u6742\uFF0C\u4EC5\u652F\u6301\u6587\u672C\u7F16\u8F91");l.style.display="none";let c=C("details","ng-cond__raw"),d=C("summary","","\u6587\u672C\u7F16\u8F91");c.appendChild(d),c.appendChild(e);let h=C("button","ng-cond__add","+ \u5B50\u53E5");h.type="button";let u=C("button","ng-cond__comb");u.type="button",a.appendChild(h),a.appendChild(u),o.appendChild(s),o.appendChild(a),o.appendChild(l),o.appendChild(c),n.insertBefore(o,e.parentNode===n?e:null),e.parentNode!==c&&c.appendChild(e);let p=document.createElement("datalist");p.id=r,o.appendChild(p);let f=pe.parseCondition(e.value),y=!Array.isArray(f.clauses);function x(E){let v=i().find(g=>g&&g.name===E);return v?v.type:""}function S(){e.value=pe.serializeCondition(f)}function G(){p.textContent="";for(let E of i()){if(!E||!E.name)continue;let v=document.createElement("option");v.value=E.name,p.appendChild(v)}}function M(){if(y=!Array.isArray(f.clauses),l.style.display=y?"":"none",s.style.display=y?"none":"",a.style.display=y?"none":"",y){c.open=!0;return}u.textContent=f.combinator==="||"?"\u4EFB\u4E00\u6EE1\u8DB3 (||)":"\u5168\u90E8\u6EE1\u8DB3 (&&)",G(),s.textContent="",f.clauses.forEach((E,v)=>s.appendChild(O(E,v)))}function O(E,v){let g=C("div","ng-cond__row"),_=C("select","ng-cond__clause-type");for(let[w,D]of[["state","\u53D8\u91CF"],["period","\u65F6\u95F4\u6BB5"]]){let L=C("option","",D);L.value=w,E.type===w&&(L.selected=!0),_.appendChild(L)}if(_.addEventListener("change",()=>{f.clauses[v]=_.value==="period"?{type:"period",periods:[]}:{type:"state",key:"",op:"===",value:""},M(),S()}),g.appendChild(_),E.type==="period"){let w=C("span","ng-cond__periods");Fr.forEach((D,L)=>{let H=C("label","ng-cond__period"),P=document.createElement("input");P.type="checkbox",P.checked=E.periods.includes(L),P.addEventListener("change",()=>{let V=new Set(f.clauses[v].periods);P.checked?V.add(L):V.delete(L),f.clauses[v].periods=[...V],S()}),H.appendChild(P),H.appendChild(document.createTextNode(D)),w.appendChild(H)}),g.appendChild(w)}else{let w=C("input","ng-cond__key");w.type="text",w.placeholder="\u53D8\u91CF\u540D",w.value=E.key,w.setAttribute("list",r),w.addEventListener("input",()=>{f.clauses[v].key=w.value.trim(),H(),S()}),g.appendChild(w);let D=C("select","ng-cond__op");for(let[P,V]of Rr){let Y=C("option","",V);Y.value=P,E.op===P&&(Y.selected=!0),D.appendChild(Y)}D.addEventListener("change",()=>{f.clauses[v].op=D.value,H(),S()}),g.appendChild(D);let L=C("span","ng-cond__value");g.appendChild(L);let H=()=>{L.textContent="";let P=f.clauses[v].op;if(P==="truthy"||P==="falsy"){f.clauses[v].value="";return}let V=x(f.clauses[v].key),Y=f.clauses[v].value;if(V==="bool"){let re=C("select","ng-cond__val");for(let[tt,Jn]of[["true","true"],["false","false"]]){let be=C("option","",Jn);be.value=tt,Y===tt&&(be.selected=!0),re.appendChild(be)}re.addEventListener("change",()=>{f.clauses[v].value=re.value,S()}),L.appendChild(re);return}let z=C("input","ng-cond__val");z.type="text",V==="number"?(z.placeholder="\u6570\u5B57",z.value=Y,z.addEventListener("input",()=>{f.clauses[v].value=z.value.trim(),S()})):(z.placeholder="\u6587\u672C",z.value=Hr(Y),z.addEventListener("input",()=>{f.clauses[v].value=pe.formatConditionLiteral("string",z.value)||"",S()})),L.appendChild(z)};H()}let b=C("button","ng-cond__del","\xD7");return b.type="button",b.addEventListener("click",()=>{f.clauses.splice(v,1),M(),S()}),g.appendChild(b),g}return h.addEventListener("click",()=>{f.clauses.push({type:"state",key:"",op:"===",value:""}),M(),S()}),u.addEventListener("click",()=>{f.combinator=f.combinator==="||"?"&&":"||",M(),S()}),e.addEventListener("change",()=>{let E=pe.parseCondition(e.value);Array.isArray(E.clauses),f=E,M()}),M(),{syncFromText:M}}function Hr(n){let e=String(n||"");if(e.length>=2&&e.startsWith('"'))try{return JSON.parse(e)}catch{return e}return e}Ht.exports={attachConditionBuilder:Br}});var Ut=k((Es,Xt)=>{function Yr(n,e){let t=document.createElement("div");t.className="ng-ac",t.style.display="none",(n.parentElement||n).appendChild(t);let i=[],r=-1,o=!1;function s(){o=!1,r=-1,t.style.display="none"}function a(d){n.value=d.name,s()}function l(){let d=t.children;for(let h=0;h<d.length;h++)d[h].classList.toggle("ng-ac__item--active",h===r)}function c(){let d=n.value.trim().toLowerCase(),h=(e?e():[])||[];i=[];for(let u of h)if(!(!u||!u.name)&&!(d&&u.name.toLowerCase().indexOf(d)===-1)&&(i.push(u),i.length>=8))break;if(i.length===0){s();return}t.textContent="",i.forEach((u,p)=>{let f=document.createElement("div");f.className="ng-ac__item",f.textContent=u.name,f.addEventListener("mousedown",y=>{y.preventDefault(),a(u)}),t.appendChild(f)}),r=-1,o=!0,t.style.display="",l()}n.addEventListener("input",c),n.addEventListener("focus",c),n.addEventListener("blur",s),n.addEventListener("keydown",d=>{if(o)if(d.key==="ArrowDown"||d.key==="ArrowUp"){d.preventDefault(),d.stopPropagation();let h=d.key==="ArrowDown"?1:-1;r=(r+h+i.length)%i.length,l()}else d.key==="Enter"?r>=0&&i[r]&&(d.preventDefault(),d.stopPropagation(),a(i[r])):d.key==="Escape"&&(d.preventDefault(),d.stopPropagation(),s())})}Xt.exports={attachSpeakerAutocomplete:Yr}});var Jt=k((ks,Kt)=>{var{EFFECT_OPS:Xr}=J(),{deriveTurns:Ur}=Z(),{attachConditionBuilder:Gt}=Yt(),{attachSpeakerAutocomplete:Gr}=Ut();function I(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function U(n,e,t){let i=I("input",n);return i.type="text",i.value=e||"",t&&(i.placeholder=t),i}function Wt(n,e,t){let i=I("textarea",n);i.value=e||"",i.rows=1,t&&(i.placeholder=t);let r=()=>{i.style.height="auto",i.style.height=`${i.scrollHeight}px`};return i.addEventListener("input",r),setTimeout(r,0),i}function $(n,e,t){let i=I("button",n,e);return i.type="button",i.addEventListener("click",r=>{r.preventDefault(),t()}),i}function Wr(n,e,t,i){let r=I("div","ng-editor__turns");n.appendChild(r);let o=s=>{let a=I("div","ng-editor__turn-row"),l=U("ng-editor__speaker",s.speaker,"Speaker"),c=Wt("ng-editor__line",s.line,"Line");a.appendChild(l),i&&Gr(l,i),a.appendChild(c),a.appendChild($("ng-editor__row-del","\xD7",()=>{a.remove()})),r.appendChild(a)};for(let s of t.turns)o(s);n.appendChild($("ng-editor__row-add","+ turn",()=>o({speaker:"",line:""})))}function Kr(n){let e=[];for(let t of n.querySelectorAll(".ng-editor__turn-row"))e.push({speaker:t.querySelector(".ng-editor__speaker").value,line:t.querySelector(".ng-editor__line").value});return e}function Jr(n,e){let t=I("div","ng-editor__effects");n.appendChild(t);let i=r=>{let o=I("div","ng-editor__effect-row"),s=I("select","ng-editor__effect-op");for(let a of Xr){let l=I("option","",a);l.value=a,r.op===a&&(l.selected=!0),s.appendChild(l)}o.appendChild(s),o.appendChild(U("ng-editor__effect-key",r.key,"variable")),o.appendChild(U("ng-editor__effect-value",r.value,"value")),o.appendChild($("ng-editor__row-del","\xD7",()=>o.remove())),t.appendChild(o)};for(let r of e.effects||[])i(r);n.appendChild($("ng-editor__row-add","+ effect",()=>i({op:"set",key:"",value:""})))}function Zr(n,e,t,i){let r=I("div","ng-editor__options");n.appendChild(r);let o=s=>{let a=I("div","ng-editor__option-row");s.id&&(a.dataset.optionId=s.id);let l=I("div","ng-editor__option-head");l.appendChild(U("ng-editor__option-label",s.label,"Option label"));let c=U("ng-editor__option-requires",s.requires,"requires (e.g. res_coins >= 5)");l.appendChild(c),l.appendChild($("ng-editor__row-del","\xD7",()=>a.remove())),a.appendChild(l),i&&Gt(a,c,{getVariables:i}),Jr(a,s),r.appendChild(a)};for(let s of t.options)o(s);n.appendChild($("ng-editor__row-add","+ option",()=>o({label:"",requires:"",effects:[]})))}function Qr(n){let e=[];for(let t of n.querySelectorAll(".ng-editor__option-row")){let i=[];for(let o of t.querySelectorAll(".ng-editor__effect-row"))i.push({trigger:"onChoose",op:o.querySelector(".ng-editor__effect-op").value,key:o.querySelector(".ng-editor__effect-key").value,value:o.querySelector(".ng-editor__effect-value").value});let r={label:t.querySelector(".ng-editor__option-label").value,requires:t.querySelector(".ng-editor__option-requires").value,effects:i};t.dataset.optionId&&(r.id=t.dataset.optionId),e.push(r)}return e}function qe(n,e){let t={title:n.querySelector(".ng-editor__title").value};return e.type==="Dialog"?t.turns=Kr(n):(t.body=n.querySelector(".ng-editor__body").value,e.type==="Choice"&&(t.options=Qr(n))),t}function eo(n,e){let t=I("div","ng-editor");t.dataset.editorFor=n.id,t.appendChild(I("div","ng-editor__heading",`Edit ${n.type} \xB7 ${n.id}`));let i=U("ng-editor__title",n.title,"Title");if(t.appendChild(i),n.type==="Dialog"){let l=Array.isArray(n.turns)&&n.turns.length>0?n.turns:Ur(n);Wr(t,n,{turns:l.length>0?l:[{speaker:"",line:""}]},e.getSpeakers)}else{let l=Wt("ng-editor__body",n.body,n.type==="Choice"?"Prompt text":"Body");if(t.appendChild(l),n.type==="Choice"){let c=(Array.isArray(n.choiceOptions)?n.choiceOptions:[]).map(d=>({id:d.id,label:d.label,requires:d.requires,effects:d.effects}));Zr(t,n,{options:c},e.getVariables)}}let r=I("div","ng-editor__footer"),o=$("ng-editor__done","\u5B8C\u6210",()=>e.onCommit(qe(t,n)));o.title="\u5173\u95ED\u5E76\u4FDD\u5B58\u672C\u6B21\u7F16\u8F91",r.appendChild(o);let s=$("ng-editor__cancel","\u64A4\u9500",()=>e.onCancel());s.title="\u6062\u590D\u5230\u6253\u5F00\u65F6\u7684\u5185\u5BB9",r.appendChild(s),t.appendChild(r);let a=()=>{typeof e.onDraft=="function"&&e.onDraft(qe(t,n))};return t.addEventListener("input",a),t.addEventListener("click",l=>{l.target&&typeof l.target.closest=="function"&&l.target.closest(".ng-editor__row-del, .ng-editor__row-add")&&a()}),t.addEventListener("keydown",l=>{l.key==="Escape"&&(l.stopPropagation(),e.onCancel())}),t}function to(n,e){let t=I("div","ng-editor ng-editor--link");t.dataset.editorFor=n.id,t.appendChild(I("div","ng-editor__heading",`Condition \xB7 ${n.id}`));let i=U("ng-editor__requires",n.requirements||"","e.g. flag_honest == true (empty = always)");t.appendChild(i),e.getVariables&&Gt(t,i,{getVariables:e.getVariables});let r=I("div","ng-editor__footer"),o=$("ng-editor__done","\u5B8C\u6210",()=>e.onCommit(i.value));o.title="\u5173\u95ED\u5E76\u4FDD\u5B58\u672C\u6B21\u7F16\u8F91",r.appendChild(o);let s=$("ng-editor__cancel","\u64A4\u9500",()=>e.onCancel());return s.title="\u6062\u590D\u5230\u6253\u5F00\u65F6\u7684\u5185\u5BB9",r.appendChild(s),t.appendChild(r),t.addEventListener("input",()=>{typeof e.onDraft=="function"&&e.onDraft(i.value)}),t.addEventListener("keydown",a=>{a.key==="Escape"?(a.stopPropagation(),e.onCancel()):a.key==="Enter"&&(a.preventDefault(),e.onCommit(i.value))}),t}Kt.exports={buildNodeEditor:eo,buildLinkEditor:to,readNodeDraft:qe}});var ee=k((Ss,rn)=>{var no="Variables.md",Zt=Object.freeze(["bool","number","string"]),io=["# \u5168\u5C40\u53D8\u91CF\u8868","","\u5168 vault \u5171\u4EAB\u7684\u5BF9\u8BDD\u53D8\u91CF\uFF08NG-06\uFF09\u3002\u53D8\u91CF\u540D\u4FDD\u7559 flag_/res_ \u524D\u7F00\uFF08\u9A71\u52A8 MED \u7FFB\u8BD1\uFF09\uFF1B","\u7C7B\u578B \u2208 bool|number|string\uFF1B\u521D\u59CB\u503C\u4E3A\u5B57\u9762\u91CF\uFF08true/false\u3001\u6570\u5B57\u6216\u5B57\u7B26\u4E32\uFF09\u3002","","| \u53D8\u91CF | \u7C7B\u578B | \u521D\u59CB\u503C | \u5907\u6CE8 |","| --- | --- | --- | --- |",""].join(`
`),Qt=["\u53D8\u91CF","\u7C7B\u578B","\u521D\u59CB\u503C","\u5907\u6CE8"];function Ve(n){let e=n.trim();return e.length>=2&&e.startsWith("|")&&e.endsWith("|")}function je(n){return n.trim().slice(1,-1).split(/(?<!\\)\|/).map(t=>t.trim().replace(/\\\|/g,"|"))}function ro(n){return String(n??"").replace(/\|/g,"\\|")}function oo(n){return Ve(n)?je(n).every(e=>/^:?-+:?$/.test(e.replace(/\s/g,""))):!1}function Fe(n){if(typeof n=="string"){if(n.startsWith("flag_"))return"bool";if(n.startsWith("res_"))return"number"}return"string"}function en(n,e){let t=String(e??"").trim();return n==="bool"?/^(true|false)$/i.test(t):n==="number"?t!==""&&!Number.isNaN(Number(t)):!0}function so(n,e){let t=String(e??"").trim();if(n==="bool")return/^true$/i.test(t);if(n==="number"){let i=Number(t);return Number.isNaN(i)?t:i}return String(e??"")}function tn(n){for(let e=0;e<n.length-1;e++){if(!Ve(n[e]))continue;let t=je(n[e]),i={},r=!0;for(let s of Qt){let a=t.indexOf(s);if(a===-1){r=!1;break}i[s]=a}if(!r||!oo(n[e+1]))continue;let o=e+2;for(;o<n.length&&Ve(n[o]);)o++;return{headerIdx:e,sepIdx:e+1,rowStart:e+2,rowEnd:o,colMap:i}}return null}function ao(n){let e=String(n||"").split(`
`),t=tn(e);if(!t)return{entries:[],warnings:[]};let i=[];for(let r=t.rowStart;r<t.rowEnd;r++){let o=je(e[r]),s=l=>{let c=t.colMap[l];return c<o.length?o[c]:""},a={name:s("\u53D8\u91CF"),type:s("\u7C7B\u578B").toLowerCase(),initial:s("\u521D\u59CB\u503C"),note:s("\u5907\u6CE8")};!a.name&&!a.type&&!a.initial&&!a.note||i.push(a)}return{entries:i,warnings:nn(i)}}function lo(n,e){let t=String(n??""),i=t.split(`
`),r=(e||[]).filter(a=>a&&String(a.name||"").trim()!=="").map(a=>"| "+[a.name,a.type,a.initial,a.note].map(ro).join(" | ")+" |"),o=tn(i);if(!o){let a=["| "+Qt.join(" | ")+" |","| --- | --- | --- | --- |",...r];if(t.trim()==="")return a.join(`
`);let l=i.slice();return l[l.length-1].trim()!==""&&l.push(""),l.push(...a),l.join(`
`)}return i.slice(0,o.rowStart).concat(r,i.slice(o.rowEnd)).join(`
`)}function nn(n){let e=[],t=new Set;for(let i of n||[]){if(!i)continue;let r=String(i.name||"").trim(),o=r||"(\u672A\u547D\u540D)";if(!r){e.push("\u5B58\u5728\u672A\u586B\u5199\u53D8\u91CF\u540D\u7684\u884C");continue}t.has(r)&&e.push(`\u53D8\u91CF "${r}" \u91CD\u590D\u5B9A\u4E49`),t.add(r);let s=String(i.type||"").trim().toLowerCase();s&&!Zt.includes(s)&&(e.push(`\u53D8\u91CF "${o}" \u7C7B\u578B "${i.type}" \u672A\u77E5\uFF08\u5E94\u4E3A bool|number|string\uFF09\uFF0C\u6309\u524D\u7F00\u63A8\u65AD\u5904\u7406`),s="");let a=s||Fe(r);r.startsWith("flag_")&&a!=="bool"&&e.push(`\u53D8\u91CF "${r}" \u524D\u7F00 flag_ \u8981\u6C42 bool \u7C7B\u578B\uFF0C\u5F53\u524D\u4E3A ${a}`),r.startsWith("res_")&&a!=="number"&&e.push(`\u53D8\u91CF "${r}" \u524D\u7F00 res_ \u8981\u6C42 number \u7C7B\u578B\uFF0C\u5F53\u524D\u4E3A ${a}`),en(a,i.initial)||e.push(`\u53D8\u91CF "${r}" \u521D\u59CB\u503C "${i.initial}" \u65E0\u6CD5\u6309 ${a} \u89E3\u6790`)}return e}function co(n,e){let t=new Set((n||[]).map(r=>r&&r.name)),i=[];for(let[r,o]of Object.entries(e||{})){if(t.has(r))continue;let s,a;typeof o=="boolean"?(a="bool",s=o?"true":"false"):typeof o=="number"?(a="number",s=String(o)):(a=Fe(r),o==null?s="":s=String(o)),i.push({name:r,type:a,initial:s,note:""})}return i}rn.exports={DEFAULT_VARIABLES_PATH:no,EMPTY_VARIABLES_FILE:io,VALID_TYPES:Zt,inferTypeFromPrefix:Fe,isValidInitial:en,parseInitialValue:so,parseVariablesTable:ao,serializeVariablesTable:lo,validateEntries:nn,mergeFileVariables:co}});var an=k((Cs,sn)=>{var{validateEntries:ho}=ee(),on=["bool","number","string"],Re=class{constructor(e){this._onCommit=e.onCommit,this._onClose=e.onClose;let t=document.createElement("div");t.className="ng-vars-panel ng-vars-panel--hidden";let i=document.createElement("div");i.className="ng-vars-panel__header";let r=document.createElement("span");r.className="ng-vars-panel__title",r.textContent="\u5168\u5C40\u53D8\u91CF";let o=document.createElement("button");o.type="button",o.className="ng-vars-panel__close",o.textContent="\xD7",o.addEventListener("click",()=>this._onClose()),i.appendChild(r),i.appendChild(o),t.appendChild(i);let s=document.createElement("table");s.className="ng-vars-panel__grid";let a=document.createElement("thead"),l=document.createElement("tr");for(let h of["\u53D8\u91CF","\u7C7B\u578B","\u521D\u59CB\u503C","\u5907\u6CE8",""]){let u=document.createElement("th");u.textContent=h,l.appendChild(u)}a.appendChild(l),s.appendChild(a),this._tbody=document.createElement("tbody"),s.appendChild(this._tbody),t.appendChild(s);let c=document.createElement("div");c.className="ng-vars-panel__footer";let d=document.createElement("button");d.type="button",d.className="ng-vars-panel__add",d.textContent="+ \u6DFB\u52A0\u53D8\u91CF",d.addEventListener("click",()=>{let h=this._buildRow({name:"",type:"",initial:"",note:""});this._tbody.appendChild(h);let u=h.querySelector(".ng-vars-panel__name");u&&u.focus()}),c.appendChild(d),this._warningsEl=document.createElement("div"),this._warningsEl.className="ng-vars-panel__warnings",c.appendChild(this._warningsEl),t.appendChild(c),this.el=t}setEntries(e,t){this._tbody.textContent="";for(let i of e||[])this._tbody.appendChild(this._buildRow(i));this.setWarnings(t)}setWarnings(e){this._warningsEl.textContent=(e||[]).join("\uFF1B")}_buildRow(e){let t=document.createElement("tr"),i=document.createElement("td"),r=document.createElement("input");r.className="ng-vars-panel__name",r.type="text",r.placeholder="flag_/res_",r.value=e.name||"",i.appendChild(r),t.appendChild(i);let o=document.createElement("td"),s=document.createElement("select");s.className="ng-vars-panel__type";for(let y of on){let x=document.createElement("option");x.value=y,x.textContent=y,s.appendChild(x)}s.value=on.includes(e.type)?e.type:"";let a=document.createElement("option");a.value="",a.textContent="(\u63A8\u65AD)",s.insertBefore(a,s.firstChild),o.appendChild(s),t.appendChild(o);let l=document.createElement("td"),c=document.createElement("input");c.className="ng-vars-panel__initial",c.type="text",c.value=e.initial||"",l.appendChild(c),t.appendChild(l);let d=document.createElement("td"),h=document.createElement("input");h.className="ng-vars-panel__note",h.type="text",h.value=e.note||"",d.appendChild(h),t.appendChild(d);let u=document.createElement("td"),p=document.createElement("button");p.type="button",p.className="ng-vars-panel__del",p.textContent="\xD7",p.addEventListener("click",()=>{t.remove(),this._onCommit(this._collectEntries())}),u.appendChild(p),t.appendChild(u);let f=()=>this._onCommit(this._collectEntries());return r.addEventListener("change",f),s.addEventListener("change",f),c.addEventListener("change",f),h.addEventListener("change",f),t}_collectEntries(){let e=[];for(let t of this._tbody.querySelectorAll("tr"))e.push({name:t.querySelector(".ng-vars-panel__name").value.trim(),type:t.querySelector(".ng-vars-panel__type").value,initial:t.querySelector(".ng-vars-panel__initial").value,note:t.querySelector(".ng-vars-panel__note").value});return e}validateCurrent(){return ho(this._collectEntries())}destroy(){this.el.remove()}};sn.exports={VariablesPanel:Re}});var cn=k((Ns,dn)=>{function ln(n,e,t){let i=t==null?"Characters":String(t).trim().replace(/\/+$/,"");if(!i)return[];let r=i+"/",o=[];for(let s of n||[]){if(!s||s.extension!=="md"||!s.path.startsWith(r))continue;let a=e(s);if(!a)continue;let l=a.id!==void 0&&a.id!==null&&String(a.id).trim()!==""?String(a.id).trim():s.basename,c=a.name!==void 0&&a.name!==null&&String(a.name).trim()!==""?String(a.name).trim():s.basename;o.push({id:"gc-"+l,name:c,role:a.role,voice:a.voice})}return o}function uo(n,e){try{let t=n&&n.vault,i=n&&n.metadataCache;return!t||typeof t.getFiles!="function"||!i||typeof i.getFileCache!="function"?[]:ln(t.getFiles(),r=>{let o=i.getFileCache(r);return o&&o.frontmatter},e)}catch{return[]}}dn.exports={listSpeakersFromFiles:ln,loadSpeakers:uo}});var fn=k((Is,pn)=>{var{ZOOM_STEP:hn,zoomAtPoint:po,isValidStoredView:fo,gridBackground:go,GRID_SPACING:_o}=he(),un=300,Be=class{constructor(e,t,i,r){this._frameEl=e,this._worldEl=t,this._onNavigate=typeof i=="function"?i:()=>{},this._shouldPan=typeof r=="function"?r:o=>o.button===1,this._view={x:0,y:0,scale:1},this._pan=null,this._zoomTimer=null,this._onWheel=this._handleWheel.bind(this),this._onPointerDown=this._handlePointerDown.bind(this),this._onPointerMove=this._handlePointerMove.bind(this),this._onPointerUp=this._handlePointerUp.bind(this)}attach(){this._frameEl.addEventListener("wheel",this._onWheel,{passive:!1}),this._frameEl.addEventListener("pointerdown",this._onPointerDown)}detach(){this._frameEl.removeEventListener("wheel",this._onWheel),this._frameEl.removeEventListener("pointerdown",this._onPointerDown),this._endPan(),this._zoomTimer!==null&&(clearTimeout(this._zoomTimer),this._zoomTimer=null)}getView(){return{...this._view}}setView(e){fo(e)&&(this._view={x:e.x,y:e.y,scale:e.scale},this._apply())}_apply(){let{x:e,y:t,scale:i}=this._view;this._worldEl.style.transform=`translate(${e}px, ${t}px) scale(${i})`;let r=go(this._view,_o);this._frameEl.style.backgroundPosition=r.backgroundPosition,this._frameEl.style.backgroundSize=r.backgroundSize}_commit(e){this._onNavigate(this.getView(),e)}_handleWheel(e){e.preventDefault();let t=this._frameEl.getBoundingClientRect(),i={x:e.clientX-t.left,y:e.clientY-t.top},r=e.deltaY<0?hn:1/hn;this._view=po(this._view,i,r),this._apply(),this._zoomTimer!==null&&clearTimeout(this._zoomTimer),this._zoomTimer=setTimeout(()=>{this._zoomTimer=null,this._commit("zoom")},un)}_handlePointerDown(e){if(this._shouldPan(e)){if(this._pan={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,viewX:this._view.x,viewY:this._view.y,moved:!1},this._frameEl.classList.add("ng-canvas--panning"),typeof this._frameEl.setPointerCapture=="function")try{this._frameEl.setPointerCapture(e.pointerId)}catch{}this._frameEl.addEventListener("pointermove",this._onPointerMove),this._frameEl.addEventListener("pointerup",this._onPointerUp),this._frameEl.addEventListener("pointercancel",this._onPointerUp),e.button===1&&e.preventDefault()}}_handlePointerMove(e){if(!this._pan||e.pointerId!==this._pan.pointerId)return;let t=e.clientX-this._pan.startX,i=e.clientY-this._pan.startY;Math.abs(t)+Math.abs(i)>2&&(this._pan.moved=!0),this._view.x=this._pan.viewX+t,this._view.y=this._pan.viewY+i,this._apply()}_handlePointerUp(e){if(!this._pan||e.pointerId!==this._pan.pointerId)return;let t=this._pan.moved;this._endPan(),t&&this._commit("pan")}_endPan(){this._pan=null,this._frameEl.classList.remove("ng-canvas--panning"),this._frameEl.removeEventListener("pointermove",this._onPointerMove),this._frameEl.removeEventListener("pointerup",this._onPointerUp),this._frameEl.removeEventListener("pointercancel",this._onPointerUp)}};pn.exports={Viewport:Be,ZOOM_COMMIT_DELAY:un}});var Xe=k((As,En)=>{var He=Object.freeze({X0:140,Y0:80,gapX:150,gapY:90,bandGapY:200,marginH:1.1,maxRelax:8});function mo(n){return n&&typeof n.width=="number"&&n.width>0?n.width:480}function yo(n){return n&&typeof n.height=="number"&&n.height>0?n.height:160}function gn(n){if(n==="n_entry")return-1;let e=String(n).replace(/\D/g,"");return e?parseInt(e,10):0}function _n(n){let e=n&&typeof n.width=="number"&&n.width>0?n.width:n&&n.type==="Dialog"?420:480,t=Math.max(8,Math.floor((e-24)/22));if(n&&n.type==="Content"){let i=0;for(let r of String(n.body||"").split(`
`))i+=Math.max(1,Math.ceil(r.length/t));return 54+i*26}if(n&&n.type==="Dialog"){let i=Array.isArray(n.turns)&&n.turns.length?n.turns.map(o=>`${o&&o.speaker||""}${o&&o.line||""}`):String(n.body||"").split(`
`).filter(o=>o.trim()),r=30;for(let o of i)r+=Math.max(1,Math.ceil(String(o).length/t))*24+18;return r}return 90}function j(n){return{w:Math.round(mo(n)),h:Math.round(Math.max(yo(n),_n(n))*He.marginH)}}function mn(n,e){if(n=Array.isArray(n)?n:[],e=Array.isArray(e)?e:[],!n.length)throw new Error("graphInfo: \u6CA1\u6709\u8282\u70B9");let t=new Map,i=new Map;n.forEach((g,_)=>{t.set(g.id,_),i.set(g.id,[])});let r=[];for(let g of e)!g||!t.has(g.from)||!t.has(g.to)||(i.get(g.from).push(g.to),r.push([g.from,g.to]));let o=t.has("n_entry")?"n_entry":n[0].id,s=new Set([o]),a=[o];for(;a.length;){let g=a.shift();for(let _ of i.get(g)||[])s.has(_)||(s.add(_),a.push(_))}let l=new Map,c=new Map,d=new Set,h=[],u=new Map,p=[],f=0,y=g=>{l.set(g,f),c.set(g,f),f+=1,h.push(g),d.add(g);for(let _ of i.get(g))l.has(_)?d.has(_)&&c.set(g,Math.min(c.get(g),l.get(_))):(y(_),c.set(g,Math.min(c.get(g),c.get(_))));if(c.get(g)===l.get(g)){let _=[];for(;;){let b=h.pop();if(d.delete(b),u.set(b,p.length),_.push(b),b===g)break}p.push(_)}};for(let g of n)l.has(g.id)||y(g.id);let x=p.map(()=>new Set);for(let[g,_]of r){let b=u.get(g),w=u.get(_);b!==w&&!x[b].has(w)&&x[b].add(w)}let S=new Map([[u.get(o),0]]),G=0,M=p.length+2;for(;;){let g=!1;for(let _ of x.keys()){let b=S.get(_);if(b!==void 0)for(let w of x[_])(S.has(w)?S.get(w):-1)<b+1&&(S.set(w,b+1),g=!0)}if(!g||++G>M)break}let O=new Map;for(let g of n){if(!s.has(g.id))continue;let _=S.get(u.get(g.id));O.set(g.id,_===void 0?0:_)}let E=0;for(let g of O.values())g>E&&(E=g);for(let g of n)O.has(g.id)||(E+=1,O.set(g.id,E));let v=new Map;for(let g of n){let _=O.get(g.id);v.has(_)||v.set(_,[]),v.get(_).push(g)}for(let g of v.values())g.sort((_,b)=>gn(_.id)-gn(b.id));return{nodes:n,links:e,depth:O,byDepth:v,levels:E+1}}function Ye(n){return[...n.byDepth.keys()].sort((e,t)=>e-t)}function ge(n,e){let t=0;for(let i of n.byDepth.get(e))t=Math.max(t,j(i).w);return t}function yn(n,e,t){let i=n.byDepth.get(e),r=0;return i.forEach((o,s)=>{r+=j(o).h+(s?t.gapY:0)}),r}function bn(n,e){let t=Ye(n),i=new Map,r=e.X0;for(let o of t)i.set(o,r),r+=ge(n,o)+e.gapX;for(let o of t){let s=e.Y0;for(let a of n.byDepth.get(o)){let l=j(a);a.x=i.get(o),a.y=s,s+=l.h+e.gapY}}}function vn(n,e,t){let i=Ye(n),r=new Map;for(let a of i){let l=Math.floor(a/t);r.has(l)||r.set(l,[]),r.get(l).push(a)}let o=0,s=e.Y0;for(let a of[...r.keys()].sort((l,c)=>l-c)){let l=new Map,c=0;for(let h of r.get(a)){let u=a%2===0?h%t:t-1-h%t;l.set(u,Math.max(l.get(u)||0,ge(n,h))),c=Math.max(c,yn(n,h,e))}let d=0;for(let h of[...l.keys()].sort((u,p)=>u-p))d+=l.get(h)+e.gapX;d=d>0?d-e.gapX:0,o=Math.max(o,e.X0+d),s+=c+e.bandGapY}return s=s-e.bandGapY,{width:o,height:s}}function xn(n,e,t){let i=Ye(n),r=new Map;for(let s of i){let a=Math.floor(s/t);r.has(a)||r.set(a,[]),r.get(a).push(s)}let o=e.Y0;for(let s of[...r.keys()].sort((a,l)=>a-l)){let a=r.get(s),l=new Map,c=new Map;for(let p of a){let f=s%2===0?p%t:t-1-p%t;c.set(p,f),l.set(f,Math.max(l.get(f)||0,ge(n,p)))}let d=new Map,h=e.X0;for(let p of[...l.keys()].sort((f,y)=>f-y))d.set(p,h),h+=l.get(p)+e.gapX;let u=o;for(let p of a){let f=o;for(let y of n.byDepth.get(p)){let x=j(y);y.x=d.get(c.get(p)),y.y=f,f+=x.h+e.gapY}u=Math.max(u,f-e.gapY)}o=u+e.bandGapY}}function fe(n){if(n=Array.isArray(n)?n:[],!n.length)return{width:0,height:0,aspect:1,overlaps:0};let e=1/0,t=1/0,i=-1/0,r=-1/0;for(let l of n){let c=j(l),d=l.x|0,h=l.y|0;d<e&&(e=d),h<t&&(t=h),d+c.w>i&&(i=d+c.w),h+c.h>r&&(r=h+c.h)}let o=0;for(let l=0;l<n.length;l++){let c=n[l],d=j(c),h=c.x|0,u=c.y|0;for(let p=l+1;p<n.length;p++){let f=n[p],y=j(f),x=f.x|0,S=f.y|0;h<x+y.w&&x<h+d.w&&u<S+y.h&&S<u+d.h&&(o+=1)}}let s=i-e,a=r-t;return{width:s,height:a,aspect:Math.round(s/Math.max(1,a)*100)/100,overlaps:o}}function wn(n){return fe(n).aspect>=2.5?"row":"square"}function bo(n,e,t){let i=n&&n.nodes||[],r=n&&n.links||[],o=e;if(o==="toggle"&&(o=wn(i)==="row"?"square":"row"),o!=="row"&&o!=="square")throw new Error("\u672A\u77E5\u6392\u5E03\u6A21\u5F0F\uFF1A"+e);let s=mn(i,r),a=Object.assign({},He,t||{}),l=h=>{let u=[];if(Number.isFinite(h.cols)&&h.cols>0)u.push(h.cols);else for(let f=4;f<=16;f++)u.push(f);let p=null;for(let f of u){let y=vn(s,h,f),x=Math.max(y.width,y.height)/Math.max(1,Math.min(y.width,y.height));(!p||x<p.ratio)&&(p={cols:f,ratio:x})}return p},c=null,d=1;if(o==="row")for(let h=0;h<a.maxRelax&&(bn(s,a),c=fe(i),c.overlaps!==0);h++)a=Object.assign({},a,{gapY:Math.round(a.gapY*1.3),gapX:Math.round(a.gapX*1.15)});else{d=l(a).cols;for(let h=0;h<a.maxRelax&&(xn(s,a,d),c=fe(i),c.overlaps!==0);h++)a=Object.assign({},a,{gapY:Math.round(a.gapY*1.3),gapX:Math.round(a.gapX*1.15),bandGapY:Math.round(a.bandGapY*1.2)}),d=l(a).cols}return{mode:o,overlaps:c.overlaps,cols:d,bands:o==="square"?Math.ceil(s.levels/d):1,bounds:{width:c.width,height:c.height},relaxed:c.overlaps===0}}En.exports={DEF:He,estHeight:_n,boxOf:j,graphInfo:mn,colWidth:ge,stackHeight:yn,placeRow:bn,placeSquare:xn,squareMetrics:vn,measure:fe,detectMode:wn,applyLayout:bo}});var Mn=k((Ms,An)=>{var{deriveTurns:kn,flattenTurns:vo}=Z(),{nextOptionId:xo}=oe(),{boxOf:wo}=Xe(),Ue=Object.freeze(["Content","Dialog"]),_e="Choice";function Ge(n){let e=0;for(let t of Array.isArray(n)?n:[])if(t){if(e+=String(t.body||"").replace(/\s/g,"").length,Array.isArray(t.turns))for(let i of t.turns)e+=String(i&&i.line||"").replace(/\s/g,"").length;Array.isArray(t.choices)&&(e+=t.choices.join("").replace(/\s/g,"").length)}return e}function We(n){return n&&Array.isArray(n.choiceOptions)&&n.choiceOptions.length?n.choiceOptions.map((t,i)=>({id:t&&t.id||"opt_"+(i+1),label:String((t&&t.label)!=null?t.label:(n.choices||[])[i]!=null?n.choices[i]:""),requires:t&&t.requires||"",effects:t&&Array.isArray(t.effects)?t.effects:[]})):(n&&Array.isArray(n.choices)?n.choices:[]).map((t,i)=>({id:"opt_"+(i+1),label:String(t),requires:"",effects:[]}))}function Cn(n,e,t){let i=We(n),r=We(e),o=i.slice(),s={byOldIdx:[],byOldId:new Map,labels:[]};return r.forEach((a,l)=>{let c=xo([...Array.isArray(t)?t:[],{choiceOptions:o}]),d={index:o.length,id:c,label:a.label};o.push({id:c,label:a.label,requires:a.requires||"",effects:Array.isArray(a.effects)?a.effects:[]}),s.byOldIdx.push(d),s.byOldId.set(a.id,l),s.labels.push(a.label)}),n.choiceOptions=o,n.choices=o.map(a=>a.label),s}function Nn(n,e,t){if(!n||!e||n.type!==e.type)throw new Error("\u8BE5\u7C7B\u578B\u4E0D\u652F\u6301\u5408\u5E76\uFF1A"+(n&&n.type)+" \u2190 "+(e&&e.type));if(n.type==="Content"){let i=String(n.body||"").trim(),r=String(e.body||"").trim();return n.body=[i,r].filter(Boolean).join(`
`),{type:"Content"}}if(n.type==="Dialog"){let i=kn(n).concat(kn(e));return n.turns=i,n.body=vo(i),{type:"Dialog"}}if(n.type===_e){let i=t&&t.nodes||[n,e],r=Cn(n,e,i);return{type:_e,remap:r,labels:r.labels}}throw new Error("\u8BE5\u7C7B\u578B\u4E0D\u652F\u6301\u5408\u5E76\uFF1A"+n.type)}function In(n,e,t,i){let r=n&&n.links||[],o=new Set(r.map(c=>`${c.from}\0${c.to}\0${c.choiceOptionId||""}`)),s=[],a=0,l=0;for(let c of r){if(!c||c.from!==t&&c.to!==t){s.push(c);continue}let d=Object.assign({},c);if(d.from===t&&(d.from=e,i)){let u=null;if(typeof d.choiceIndex=="number")u=d.choiceIndex;else if(d.choiceOptionId!=null){let f=String(d.choiceOptionId);if(i.byOldId.has(f))u=i.byOldId.get(f);else{let y=/^opt_(\d+)$/.exec(f);y&&(u=parseInt(y[1],10)-1)}}let p=u!=null?i.byOldIdx[u]:void 0;p&&(d.choiceIndex=p.index,d.choiceOptionId=p.id,d.label||(d.label=p.label||""))}if(d.to===t&&(d.to=e),d.from===d.to){l+=1;continue}let h=`${d.from}\0${d.to}\0${d.choiceOptionId||""}`;if(o.has(h)){l+=1;continue}o.add(h),a+=1,s.push(d)}return s.forEach((c,d)=>{c.id="l"+d}),n.links=s,{rewired:a,dropped:l}}function Sn(n){let e=wo(n);return{x:n.x|0,y:n.y|0,w:e.w,h:e.h}}function Eo(n,e){let t=n.x+n.w/2,i=n.y+n.h/2;return t>=e.x&&t<=e.x+e.w&&i>=e.y&&i<=e.y+e.h}function ko(n,e){let t=Math.min(n.x+n.w,e.x+e.w)-Math.max(n.x,e.x),i=Math.min(n.y+n.h,e.y+e.h)-Math.max(n.y,e.y);return t>0&&i>0?t*i:0}function So(n,e,t){let i=Object.assign({ratio:.35,mergeChoice:!0},t||{}),r=i.mergeChoice?[...Ue,_e]:[...Ue];n=Array.isArray(n)?n:[];let o=n.find(l=>l&&l.id===e);if(!o||!r.includes(o.type))return null;let s=Sn(o),a=null;for(let l of n){if(!l||l.id===e||l.type!==o.type)continue;let c=Sn(l),d=ko(s,c);if(d<=0)continue;let h=Math.min(s.w*s.h,c.w*c.h);!Eo(s,c)&&(h<=0||d/h<i.ratio)||(!a||d>a.area)&&(a={target:l,area:d})}return a?a.target:null}function Co(n,e,t){if(!n||!Array.isArray(n.nodes))throw new Error("mergeNodes: not a project object");if(e===t)throw new Error("mergeNodes: \u4E0D\u80FD\u5408\u5E76\u8282\u70B9\u5230\u81EA\u8EAB");let i=n.nodes.find(u=>u&&u.id===e),r=n.nodes.find(u=>u&&u.id===t);if(!i)throw new Error(`mergeNodes: unknown target '${e}'`);if(!r)throw new Error(`mergeNodes: unknown node '${t}'`);let o=Ge(n.nodes),s=JSON.parse(JSON.stringify({nodes:n.nodes,links:n.links||[]})),a=s.nodes.find(u=>u.id===e),l=s.nodes.find(u=>u.id===t),c=Nn(a,l,{nodes:s.nodes}),d=In(s,e,t,c.remap||null);s.nodes=s.nodes.filter(u=>u.id!==t);let h=Ge(s.nodes);if(h<o)throw new Error(`\u5408\u5E76\u5F02\u5E38\uFF1A\u6B63\u6587\u51CF\u5C11 ${o-h} \u5B57\uFF0C\u5DF2\u4E2D\u6B62\uFF08\u672A\u5199\u5165\uFF09`);return delete a.manualSize,delete a.height,n.nodes=s.nodes,n.links=s.links,{rewired:d.rewired,dropped:d.dropped,type:c.type}}function No(n,e){let t=Object.assign({stdWidth:440},e||{}),i=0,r=0;for(let o of n&&n.nodes||[]){if(!o||o.type!=="Content"&&o.type!=="Dialog"){r+=1;continue}let s=!1;o.width!==t.stdWidth&&(o.width=t.stdWidth,s=!0),"manualSize"in o&&(delete o.manualSize,s=!0),"height"in o&&(delete o.height,s=!0),s&&(i+=1)}return{changed:i,skipped:r}}An.exports={MERGE_TYPES:Ue,CHOICE_TYPE:_e,contentChars:Ge,normalizeOptions:We,mergeChoiceInto:Cn,mergePair:Nn,contractEdges:In,findMergeCandidate:So,mergeNodes:Co,tidySizes:No}});var Ln=k((Ds,Dn)=>{function Io(n,e){let t=n&&n.nodes||[],i=n&&n.links||[],r=new Map(t.map(d=>[d.id,d])),o={bridged:0,dropped:0},s=new Map,a=new Map,l=[];for(let d of i){if(!d)continue;let h=r.has(d.from),u=r.has(d.to);if(h&&u){l.push(d);continue}if(!h&&!u){o.dropped+=1;continue}u?(a.has(d.from)||a.set(d.from,[]),a.get(d.from).push(d)):(s.has(d.to)||s.set(d.to,[]),s.get(d.to).push(d))}for(let[d,h]of s){let u=a.get(d)||[];for(let p of h){let f=u.shift();f?(l.push(Object.assign({},p,{to:f.to,toPort:f.toPort||{side:"left",t:.5}})),o.bridged+=1):o.dropped+=1}}for(let[,d]of a)o.dropped+=d.length;(o.bridged||o.dropped)&&(l.forEach((d,h)=>{d.id="l"+h}),n.links=l);let c=0;for(let d of n.links||[]){if(!d||d.choiceOptionId==null)continue;let h=r.get(d.from);if(!h||h.type!=="Choice")continue;let u=Array.isArray(h.choiceOptions)?h.choiceOptions:[],p=u.findIndex(y=>y&&y.id===String(d.choiceOptionId));if(p<0)continue;let f=u[p].label||"";(d.label!==f||d.choiceIndex!==p)&&(d.label=f,d.choiceIndex=p,c+=1)}if(o.relabeled=c,e){let d=n&&n.links||[];e.selectedNodeId&&!r.has(e.selectedNodeId)&&(e.selectedNodeId=null),e.selectedLinkId&&!d.some(h=>h.id===e.selectedLinkId)&&(e.selectedLinkId=null)}return o}Dn.exports={repairDoc:Io}});var On=k((Ls,Tn)=>{var Ao=Object.freeze(["ui","out-port","port-handle","in-port","node","edge","edge-end-handle","empty"]),Mo=Object.freeze(["none","pan","marquee","node-drag","link-drag","resize-drag","end-handle-drag"]);function Do(n){let{button:e,spaceHeld:t,targetKind:i,portHit:r,resizeZone:o}=n;return i==="ui"?{type:"none"}:i==="out-port"&&e===0?{type:"link-drag"}:i==="port-handle"&&e===0?{type:"link-drag"}:i==="edge-end-handle"&&e===0?{type:"end-handle-drag"}:i==="in-port"?{type:"none"}:e===1?{type:"pan"}:e!==0?{type:"none"}:t?{type:"pan"}:i==="node"?r?{type:"link-drag"}:o?{type:"resize-drag"}:{type:"node-drag"}:i==="empty"||i==="edge"?{type:"marquee"}:{type:"none"}}function Lo(n,e,t){return t?[...new Set([...n,...e])]:[...e]}function To(n,e,t){let i=[...n];return t||i.includes(e)?i:[e]}Tn.exports={TARGET_KINDS:Ao,GESTURES:Mo,decidePointerDown:Do,mergeMarqueeSelection:Lo,pointerDownSelection:To}});var Yn=k((Ts,Hn)=>{var{TextFileView:Oo,Notice:A}=require("obsidian"),{parseSavedState:Po,serializeSavedState:zo}=st(),m=mt(),Ke=kt(),F=Ct(),{renderCanvas:$o,layoutEdge:me,applyEdgeLayout:ye,measureNode:qo}=Bt(),{buildNodeEditor:Vo,buildLinkEditor:jo,readNodeDraft:Fo}=Jt(),{VariablesPanel:Ro}=an(),R=ee(),{loadSpeakers:Bo}=cn(),{Viewport:Ho}=fn(),Je=Xe(),te=Mn(),Yo=Ln(),{decidePointerDown:Pn,mergeMarqueeSelection:Xo,pointerDownSelection:Uo}=On(),{fitView:zn,isValidStoredView:Go,viewIntersectsBounds:Wo,worldToScreen:$n,screenToWorld:B,edgePath:Ko,normalizeRect:qn,nodesInRect:Jo,nodeBounds:Zo,resolveNodeSize:ne,nearestSide:Vn,sideT:jn,oppositeSide:Qo,applyResize:es,resizeZoneAt:Fn,resizeCursor:ts}=he(),Rn="narrative-graph-view",Bn=2e3,Ze=class n extends Oo{constructor(e){super(e),this.data="",this._state=null,this._errors=[],this._parseFailure=null,this._viewport=null,this._saveTimer=null,this._frameEl=null,this._worldEl=null,this._svgEl=null,this._nodeEls=new Map,this._edgeEls=new Map,this._sizes=new Map,this._selectedNodeIds=new Set,this._selectedLinkId=null,this._editorEl=null,this._editorSession=null,this._nodeDrag=null,this._linkDrag=null,this._marquee=null,this._resize=null,this._endHandleDrag=null,this._spaceHeld=!1,this._dragEndedAt=0,this._cursorEl=null,this._mergeBubble=null,this._editorDragCleanup=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._searchInputEl=null,this._searchCountEl=null,this._searchPrevEl=null,this._searchNextEl=null,this._varsPanel=null,this._varsVisible=!1,this._varsSaveTimer=null,this._varsLastWrite=null,this._varsModifyRef=null,this._varsEntries=null,this._speakers=null,this._history=null,this._historyBaseline=null,this._onClick=this._handleClick.bind(this),this._onDblClick=this._handleDblClick.bind(this),this._onPointerDown=this._handlePointerDown.bind(this),this._onPointerMove=this._handlePointerMove.bind(this),this._onPointerUp=this._handlePointerUp.bind(this),this._onKeyDown=this._handleKeyDown.bind(this),this._onKeyUp=this._handleKeyUp.bind(this),this._onHoverMove=this._handleHoverMove.bind(this),this._onDocKeyDown=this._handleDocKeyDown.bind(this)}getViewType(){return Rn}getDisplayText(){return this.file?this.file.basename:"Narrative Graph"}getViewData(){return this._state?zo(this._state):this.data}setViewData(e,t){this.data=e,this._parseFailure=null;try{let{state:i,errors:r}=Po(e);this._state=i,this._errors=r}catch(i){this._state=null,this._errors=[],this._parseFailure=i}this._selectedNodeIds.clear(),this._selectedLinkId=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._render(),this._history=this._state?F.createHistory():null,this._historyBaseline=this._state?F.takeSnapshot(this._state):null,this._state&&(this._ensureVarsEntries(),this._ensureSpeakers())}clear(){this.data="",this._state=null,this._errors=[],this._parseFailure=null,this._selectedNodeIds.clear(),this._selectedLinkId=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._history=null,this._historyBaseline=null,this._render()}async onOpen(){this.contentEl.tabIndex=-1,this.contentEl.addEventListener("click",this._onClick),this.contentEl.addEventListener("dblclick",this._onDblClick),this.contentEl.addEventListener("pointerdown",this._onPointerDown),this.contentEl.addEventListener("pointermove",this._onHoverMove),this.contentEl.addEventListener("keydown",this._onKeyDown),this.contentEl.addEventListener("keyup",this._onKeyUp),window.addEventListener("keydown",this._onDocKeyDown,!0),this.app&&this.app.vault&&typeof this.app.vault.on=="function"&&(this._varsModifyRef=this.app.vault.on("modify",e=>this._onVaultModify(e)))}async onClose(){this._editorSession&&this._finalizeEditor(this._editorSession,this._editorSession.readDraft()),this.contentEl.removeEventListener("click",this._onClick),this.contentEl.removeEventListener("dblclick",this._onDblClick),this.contentEl.removeEventListener("pointerdown",this._onPointerDown),this.contentEl.removeEventListener("pointermove",this._onHoverMove),this.contentEl.removeEventListener("keydown",this._onKeyDown),this.contentEl.removeEventListener("keyup",this._onKeyUp),window.removeEventListener("keydown",this._onDocKeyDown,!0),this._cancelDrags(),this._removeMergeBubble(),this._varsModifyRef&&this.app&&this.app.vault&&typeof this.app.vault.offref=="function"&&(this.app.vault.offref(this._varsModifyRef),this._varsModifyRef=null),this._varsSaveTimer!==null&&(clearTimeout(this._varsSaveTimer),this._varsSaveTimer=null),this._saveTimer!==null&&(clearTimeout(this._saveTimer),this._saveTimer=null),this._viewport&&(this._viewport.detach(),this._viewport=null)}_render(){if(this._viewport&&(this._viewport.detach(),this._viewport=null),this._editorEl=null,this._editorDragCleanup&&(this._editorDragCleanup(),this._editorDragCleanup=null),this._cursorEl=null,this._mergeBubble=null,this._searchInputEl=null,this._searchCountEl=null,this._searchPrevEl=null,this._searchNextEl=null,this.contentEl.empty(),this.contentEl.addClass("narrative-graph-view"),this._parseFailure){this.contentEl.createEl("p",{cls:"narrative-graph-error",text:String(this._parseFailure.message||this._parseFailure)});return}if(!this._state)return;let e=$o(this.contentEl,this._state,this._errors);this._frameEl=e.frameEl,this._worldEl=e.worldEl,this._svgEl=e.svgEl,this._nodeEls=e.nodeEls,this._edgeEls=e.edgeEls,this._sizes=e.sizes,this._viewport=new Ho(this._frameEl,this._worldEl,(i,r)=>this._persistView(i,r),i=>this._shouldPan(i)),this._viewport.attach();let t=this._state.ui&&this._state.ui.view;if(Go(t)&&(!e.bounds||Wo(t,e.bounds,this.contentEl.clientWidth,this.contentEl.clientHeight)))this._viewport.setView(t);else if(e.bounds){let i=zn(e.bounds,this.contentEl.clientWidth,this.contentEl.clientHeight);this._viewport.setView(i)}this._buildToolbar(),this._buildLayoutTools(),this._varsPanel&&this._varsPanel.el&&this._frameEl.appendChild(this._varsPanel.el),this._restoreSelection(),this._refreshSearch(),this._scheduleRelayout()}_rerenderPreservingCamera(){let e=this._viewport?this._viewport.getView():null;this._render(),e&&this._viewport&&this._viewport.setView(e)}_afterMutation(){this._recordHistory(),this._rerenderPreservingCamera(),this._scheduleSave()}_recordHistory(){!this._history||!this._historyBaseline||!this._state||(F.push(this._history,this._historyBaseline),this._historyBaseline=F.takeSnapshot(this._state))}_scheduleRelayout(){(typeof requestAnimationFrame=="function"?requestAnimationFrame:t=>setTimeout(t,0))(()=>this._relayoutEdges())}_relayoutEdges(){if(!this._state||!this._svgEl||!this._svgEl.isConnected)return;let e=this._state.project&&this._state.project.nodes||[],t=!1;for(let r of e){let o=this._nodeEls.get(r.id);if(!o)continue;let s=this._sizes.get(r.id),a=qo(r,o);o.offsetHeight>0&&s&&(s.height!==a.height||JSON.stringify(s.optionT||null)!==JSON.stringify(a.optionT||null))&&(this._sizes.set(r.id,a),t=!0)}if(!t)return;let i=new Map(e.map(r=>[r.id,r]));for(let r of this._state.project.links||[]){let o=this._edgeEls.get(r.id),s=me(r,i,this._sizes);o&&s&&ye(o,s)}}_buildToolbar(){let e=document.createElement("div");e.className="ng-toolbar";let t={Entry:"+\u8D77\u70B9",Content:"+\u5185\u5BB9",Dialog:"+\u5BF9\u8BDD",Choice:"+\u9009\u62E9",End:"+\u7ED3\u5C40"},i=["Content","Dialog","Choice","End"];m.entryNodes(this._state).length===0&&i.unshift("Entry");for(let h of i){let u=document.createElement("button");u.type="button",u.className="ng-toolbar__btn ng-toolbar__btn--add",u.dataset.addType=h,u.textContent=t[h]||`+${h}`,u.addEventListener("click",()=>this._createNode(h)),e.appendChild(u)}let r=document.createElement("span");r.className="ng-toolbar__divider",e.appendChild(r);let o=document.createElement("button");o.type="button",o.className="ng-toolbar__btn ng-toolbar__btn--vars",o.textContent="\u53D8\u91CF\u8868",o.addEventListener("click",()=>this._toggleVarsPanel()),e.appendChild(o);let s=document.createElement("span");s.className="ng-toolbar__search";let a=document.createElement("input");a.type="text",a.className="ng-toolbar__search-input",a.placeholder="\u67E5\u627E\u8282\u70B9\u2026",a.value=this._searchQuery,a.addEventListener("input",()=>this._onSearchInput(a.value)),a.addEventListener("keydown",h=>{h.key==="Enter"?(h.preventDefault(),this._stepSearchHit(h.shiftKey?-1:1)):h.key==="Escape"&&(a.value="",this._onSearchInput(""),this.contentEl.focus({preventScroll:!0}))}),s.appendChild(a);let l=document.createElement("span");l.className="ng-toolbar__search-count",s.appendChild(l);let c=document.createElement("button");c.type="button",c.className="ng-toolbar__btn ng-toolbar__btn--search-nav",c.textContent="\u2039",c.title="\u4E0A\u4E00\u6761 (Shift+Enter)",c.addEventListener("click",()=>{this._stepSearchHit(-1),a.focus()}),s.appendChild(c);let d=document.createElement("button");d.type="button",d.className="ng-toolbar__btn ng-toolbar__btn--search-nav",d.textContent="\u203A",d.title="\u4E0B\u4E00\u6761 (Enter)",d.addEventListener("click",()=>{this._stepSearchHit(1),a.focus()}),s.appendChild(d),e.appendChild(s),this._searchInputEl=a,this._searchCountEl=l,this._searchPrevEl=c,this._searchNextEl=d,this._frameEl.appendChild(e)}_buildLayoutTools(){let e=document.createElement("div");e.className="ng-layout-tools";let t=this._state.project&&this._state.project.nodes||[],i=Je.measure(t),r=Je.detectMode(t),o=document.createElement("button");o.type="button",o.className="ng-layout-tools__btn",o.dataset.action="toggle-layout",o.textContent=`\u6392\u5E03\uFF1A${r==="row"?"\u6A2A\u6392":"\u65B9\u5F62"} \u21C4`,o.title=`\u5305\u56F4\u76D2 ${i.width}\xD7${i.height}\uFF5C\u91CD\u53E0 ${i.overlaps}`,o.addEventListener("click",()=>this.applyLayoutMode("toggle")),e.appendChild(o);let s=this._graphSettings().mergeSuggest,a=document.createElement("button");a.type="button",a.className="ng-layout-tools__btn"+(s?"":" is-off"),a.dataset.action="toggle-merge",a.textContent=s?"\u5408\u5E76\uFF1A\u5F00":"\u5408\u5E76\uFF1A\u5173",a.title="\u62D6\u62FD\u540C\u7C7B\u5757\u91CD\u53E0\u65F6\u63D0\u793A\u5408\u5E76\uFF08\u70B9\u51FB\u5173\u95ED/\u5F00\u542F\uFF09",a.addEventListener("click",()=>{let c=!this._graphSettings().mergeSuggest;this.plugin&&this.plugin.settings&&(this.plugin.settings.mergeSuggest=c,typeof this.plugin.saveSettings=="function"&&this.plugin.saveSettings()),a.textContent=c?"\u5408\u5E76\uFF1A\u5F00":"\u5408\u5E76\uFF1A\u5173",a.classList.toggle("is-off",!c)}),e.appendChild(a);let l=document.createElement("button");l.type="button",l.className="ng-layout-tools__btn",l.dataset.action="tidy-sizes",l.textContent="\u5C3A\u5BF8\uFF1A\u6574\u7406",l.title=`Content/Dialog \u7EDF\u4E00\u5BBD\u5EA6 ${this._graphSettings().stdWidth}px\uFF0C\u9AD8\u5EA6\u4EA4\u8FD8\u81EA\u52A8\u6491\u9AD8`,l.addEventListener("click",()=>this.tidyNodeSizes()),e.appendChild(l),this._frameEl.appendChild(e)}_nodeSearchText(e){let t=[e.id,e.title,e.body];if(Array.isArray(e.turns))for(let i of e.turns)i&&t.push(i.speaker,i.line);if(Array.isArray(e.choiceOptions))for(let i of e.choiceOptions)i&&t.push(i.label);return Array.isArray(e.choices)&&t.push(...e.choices),t.filter(i=>typeof i=="string"&&i.length>0).join(`
`).toLowerCase()}_onSearchInput(e){this._searchQuery=String(e??""),this._searchIndex=-1,this._refreshSearch()}_refreshSearch(){let e=this._searchQuery.trim().toLowerCase(),t=this._state&&this._state.project&&this._state.project.nodes||[];this._searchHits=e?t.filter(i=>i&&this._nodeSearchText(i).includes(e)).map(i=>i.id):[],this._searchHits.length===0?this._searchIndex=-1:this._searchIndex>=this._searchHits.length&&(this._searchIndex=0),this._applySearchHighlight(),this._updateSearchCount()}_applySearchHighlight(){for(let[,t]of this._nodeEls)t.classList.remove("ng-node--search-hit","ng-node--search-current");let e=this._searchIndex>=0?this._searchHits[this._searchIndex]:null;for(let t of this._searchHits){let i=this._nodeEls.get(t);i&&(i.classList.add("ng-node--search-hit"),t===e&&i.classList.add("ng-node--search-current"))}}_updateSearchCount(){if(!this._searchCountEl)return;this._searchQuery.trim()?this._searchHits.length===0?this._searchCountEl.textContent="0":this._searchIndex>=0?this._searchCountEl.textContent=`${this._searchIndex+1}/${this._searchHits.length}`:this._searchCountEl.textContent=String(this._searchHits.length):this._searchCountEl.textContent="";let e=this._searchHits.length===0;this._searchPrevEl&&(this._searchPrevEl.disabled=e),this._searchNextEl&&(this._searchNextEl.disabled=e)}_focusSearch(){this._searchInputEl&&(this._searchInputEl.focus(),this._searchInputEl.select())}_isActiveView(){let e=this.app&&this.app.workspace;if(!e)return!0;if(typeof e.getActiveViewOfType=="function"){let i=e.getActiveViewOfType(n);if(i)return i===this}let t=e.activeLeaf;return t&&t.view?t.view===this:t&&!t.view?t===this.leaf:!1}_handleDocKeyDown(e){(e.ctrlKey||e.metaKey)&&(e.key!=="f"&&e.key!=="F"||this._isActiveView()&&(e.preventDefault(),e.stopPropagation(),this._focusSearch()))}_stepSearchHit(e){if(this._searchHits.length===0)return;let t=this._searchHits.length;this._searchIndex=((this._searchIndex+e)%t+t)%t,this._applySearchHighlight(),this._updateSearchCount(),this._centerOnNode(this._searchHits[this._searchIndex])}_centerOnNode(e){let t=m.findNode(this._state,e);if(!t||!this._viewport)return;let i=this._sizes.get(e),r=ne(t,i&&i.height),o=this._viewport.getView(),s=this.contentEl.clientWidth>0?this.contentEl.clientWidth:800,a=this.contentEl.clientHeight>0?this.contentEl.clientHeight:600,l=t.x+r.width/2,c=t.y+r.height/2;this._viewport.setView({x:s/2-l*o.scale,y:a/2-c*o.scale,scale:o.scale}),this._persistView(this._viewport.getView(),"search")}_createNode(e){let t=this._frameEl.getBoundingClientRect(),i=B({x:t.width/2,y:t.height/2},this._viewport.getView());try{let r=m.addNode(this._state,e,i.x-m.defaultWidthFor(e)/2,i.y-40);this._afterMutation(),this._setSelection([r.id],null)}catch(r){console.warn("[Narrative Graph] addNode rejected:",r.message)}}_graphSettings(){let e=this.plugin&&this.plugin.settings||{};return{autoSave:e.autoSave!==!1,mergeSuggest:e.mergeSuggest!==!1,mergeThreshold:Number.isFinite(e.mergeThreshold)?e.mergeThreshold:.35,mergeChoice:e.mergeChoice!==!1,stdWidth:Number.isFinite(e.stdWidth)?e.stdWidth:440}}applyLayoutMode(e){let t=this._state&&this._state.project;if(!t)return;let i;try{i=Je.applyLayout(t,e)}catch(o){console.warn("[Narrative Graph] \u6392\u5E03\u5C40\u5931\u8D25:",o.message),new A(`\u6392\u5E03\u5C40\u5931\u8D25\uFF1A${o.message}`);return}let r=Zo(t.nodes,this._sizes);r&&this._viewport&&(this._viewport.setView(zn(r,this.contentEl.clientWidth,this.contentEl.clientHeight)),this._persistView(this._viewport.getView(),"layout")),this._afterMutation(),new A(`\u6392\u5E03\uFF1A${i.mode==="row"?"\u6A2A\u6392":"\u65B9\u5F62"}\uFF5C${i.cols} \u5217 \xD7 ${i.bands} \u5E26\uFF5C\u5305\u56F4\u76D2 ${i.bounds.width}\xD7${i.bounds.height}\uFF5C\u91CD\u53E0 ${i.overlaps}`)}tidyNodeSizes(){let e=this._state&&this._state.project;if(!e)return;let t=te.tidySizes(e,{stdWidth:this._graphSettings().stdWidth});t.changed>0?(this._afterMutation(),new A(`\u5C3A\u5BF8\u6574\u7406\uFF1A\u6539\u52A8 ${t.changed}\uFF5C\u8DF3\u8FC7 ${t.skipped}`)):new A(`\u5C3A\u5BF8\u6574\u7406\uFF1A\u5DF2\u662F\u7EDF\u4E00\u5C3A\u5BF8\uFF0C0 \u6539\u52A8\uFF5C\u8DF3\u8FC7 ${t.skipped}`)}repairCanvas(){let e=this._state&&this._state.project;if(!e)return;let t=Yo.repairDoc(e,this._state.ui);t.bridged>0||t.dropped>0||t.relabeled>0?(this._afterMutation(),new A(`\u4FEE\u590D\uFF1A\u6865\u63A5 ${t.bridged}\uFF5C\u4E22\u5F03 ${t.dropped}\uFF5C\u6807\u7B7E\u540C\u6B65 ${t.relabeled}`)):new A("\u753B\u5E03\u7ED3\u6784\u65E0\u9700\u4FEE\u590D")}mergeOverlappingNodes(){let e=this._state&&this._state.project;if(!e)return;let t=this._graphSettings(),i=new Set,r=0,o=0,s=0;for(;;){let a=null;for(let l of e.nodes){if(!l)continue;let c=te.findMergeCandidate(e.nodes,l.id,{ratio:.1,mergeChoice:t.mergeChoice});if(c&&!i.has(`${l.id}>${c.id}`)){a={movedId:l.id,targetId:c.id};break}}if(!a)break;try{let l=te.mergeNodes(e,a.targetId,a.movedId);r+=1,o+=l.rewired,s+=l.dropped}catch(l){i.add(`${a.movedId}>${a.targetId}`),console.warn("[Narrative Graph] \u5408\u5E76\u91CD\u53E0\u8282\u70B9\u88AB\u62D2\u7EDD:",l.message)}}r>0?(this._afterMutation(),new A(`\u5408\u5E76\u91CD\u53E0\uFF1A${r} \u5BF9\uFF5C\u91CD\u8FDE ${o} \u6761\u7EBF\uFF5C\u4E22\u5F03 ${s} \u6761`)):new A("\u6CA1\u6709\u91CD\u53E0\u7684\u540C\u7C7B\u8282\u70B9\uFF0C\u96F6\u6539\u52A8")}_maybeSuggestMerge(e){if(!e||!this._state||!this._state.project)return;let t=this._graphSettings();if(!t.mergeSuggest)return;let i=te.findMergeCandidate(this._state.project.nodes,e,{ratio:t.mergeThreshold,mergeChoice:t.mergeChoice});i&&this._showMergeBubble(i.id,e)}_showMergeBubble(e,t){this._removeMergeBubble();let i=m.findNode(this._state,e);if(!i||!this._frameEl)return;let r=document.createElement("div");r.className="ng-merge-bubble";let o=document.createElement("span");o.className="ng-merge-bubble__text",o.textContent=`\u5408\u5E76\u5230\u300C${i.title||i.id}\u300D\uFF1F`,r.appendChild(o);let s=document.createElement("button");s.type="button",s.className="ng-merge-bubble__btn ng-merge-bubble__btn--ok",s.textContent="\u5408\u5E76",s.addEventListener("click",()=>this._confirmMergeBubble()),r.appendChild(s);let a=document.createElement("button");a.type="button",a.className="ng-merge-bubble__btn ng-merge-bubble__btn--cancel",a.textContent="\u53D6\u6D88",a.addEventListener("click",()=>this._removeMergeBubble()),r.appendChild(a);let l=this._viewport?this._viewport.getView():{x:0,y:0,scale:1},c=this._sizes.get(e),d=ne(i,c&&c.height),h=$n({x:i.x+d.width+8,y:i.y},l);r.style.left=`${h.x}px`,r.style.top=`${h.y}px`,this._frameEl.appendChild(r),this._mergeBubble={el:r,targetId:e,movedId:t},s.focus()}_confirmMergeBubble(){let e=this._mergeBubble;if(this._removeMergeBubble(),!(!e||!this._state||!this._state.project))try{let t=te.mergeNodes(this._state.project,e.targetId,e.movedId);this._afterMutation(),new A(`\u5DF2\u5408\u5E76 ${t.type}\uFF5C\u91CD\u8FDE ${t.rewired} \u6761\u7EBF\uFF5C\u4E22\u5F03 ${t.dropped} \u6761`)}catch(t){console.warn("[Narrative Graph] \u5408\u5E76\u5931\u8D25:",t.message),new A(`\u5408\u5E76\u5931\u8D25\uFF1A${t.message}`)}}_removeMergeBubble(){this._mergeBubble&&(this._mergeBubble.el.remove(),this._mergeBubble=null)}_varsPath(){let e=this.plugin&&this.plugin.settings;return e&&e.variablesPath&&e.variablesPath.trim()||R.DEFAULT_VARIABLES_PATH}_toggleVarsPanel(){this._varsPanel||(this._varsPanel=new Ro({onCommit:e=>this._commitVarsEntries(e),onClose:()=>this._toggleVarsPanel()}),this._frameEl&&this._frameEl.appendChild(this._varsPanel.el)),this._varsVisible=!this._varsVisible,this._varsPanel.el.classList.toggle("ng-vars-panel--hidden",!this._varsVisible),this._varsVisible&&this._refreshVarsPanel()}async _refreshVarsPanel(){let e=this.app&&this.app.vault;if(!(!e||typeof e.getAbstractFileByPath!="function"))try{let t=this._varsPath(),i=e.getAbstractFileByPath(t),r;i?r=await e.read(i):(r=R.EMPTY_VARIABLES_FILE,await e.create(t,r));let{entries:o,warnings:s}=R.parseVariablesTable(r);this._varsEntries=o,this._varsPanel&&this._varsPanel.setEntries(o,s)}catch(t){console.warn("[Narrative Graph] \u8BFB\u53D6\u53D8\u91CF\u8868\u5931\u8D25:",t.message)}}_commitVarsEntries(e){this._varsPanel&&this._varsPanel.setWarnings(R.validateEntries(e)),this._varsSaveTimer!==null&&clearTimeout(this._varsSaveTimer),this._varsSaveTimer=setTimeout(()=>{this._varsSaveTimer=null,this._writeVariables(e)},800)}async _writeVariables(e){let t=this.app&&this.app.vault;if(!(!t||typeof t.getAbstractFileByPath!="function"))try{let i=this._varsPath(),r=t.getAbstractFileByPath(i),o=r?await t.read(r):R.EMPTY_VARIABLES_FILE,s=R.serializeVariablesTable(o,e);this._varsLastWrite=s,this._varsEntries=e,r?await t.modify(r,s):await t.create(i,s)}catch(i){console.warn("[Narrative Graph] \u5199\u5165\u53D8\u91CF\u8868\u5931\u8D25:",i.message)}}async _onVariablesFileModified(e){if(!e||e.path!==this._varsPath())return;let t=this.app&&this.app.vault;if(!(!t||typeof t.read!="function"))try{let i=await t.read(e);if(i===this._varsLastWrite)return;let{entries:r,warnings:o}=R.parseVariablesTable(i);this._varsEntries=r,this._varsPanel&&this._varsVisible&&this._varsPanel.setEntries(r,o)}catch(i){console.warn("[Narrative Graph] \u5237\u65B0\u53D8\u91CF\u8868\u5931\u8D25:",i.message)}}async _ensureVarsEntries(){if(this._varsEntries!==null)return;let e=this.app&&this.app.vault;if(!e||typeof e.getAbstractFileByPath!="function"||typeof e.read!="function"){this._varsEntries=[];return}try{let t=e.getAbstractFileByPath(this._varsPath());if(!t){this._varsEntries=[];return}let{entries:i}=R.parseVariablesTable(await e.read(t));this._varsEntries=i}catch(t){console.warn("[Narrative Graph] \u8BFB\u53D6\u53D8\u91CF\u7F13\u5B58\u5931\u8D25:",t.message),this._varsEntries=[]}}async _ensureSpeakers(){this._speakers===null&&(this._speakers=Bo(this.app))}_getVarEntries(){return this._varsEntries||[]}_getSpeakers(){return this._speakers||[]}_onVaultModify(e){e&&e.path===this._varsPath()?this._onVariablesFileModified(e):e&&this._speakers!==null&&e.extension==="md"&&typeof e.path=="string"&&e.path.startsWith("Characters/")&&(this._speakers=null,this._ensureSpeakers())}_setSelection(e,t){this._selectedNodeIds=new Set(e||[]),this._selectedLinkId=t||null,this._applySelectionClasses(),this._setUiSelection()}_applySelectionClasses(){this._clearResizeCursor();for(let e of this.contentEl.querySelectorAll(".is-selected"))e.classList.remove("is-selected");for(let e of this._selectedNodeIds){let t=this._nodeEls.get(e);t&&t.classList.add("is-selected")}if(this._selectedLinkId){let e=this._edgeEls.get(this._selectedLinkId);e&&e.classList.add("is-selected")}}_setUiSelection(){this._state&&((!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={}),this._state.ui.selectedNodeId=this._selectedNodeIds.size>0?this._selectedNodeIds.values().next().value:null,this._state.ui.selectedLinkId=this._selectedLinkId,this._scheduleSave())}_restoreSelection(){if(this._selectedNodeIds.size===0&&!this._selectedLinkId){let e=this._state&&this._state.ui;e&&e.selectedNodeId&&this._nodeEls.has(e.selectedNodeId)?this._selectedNodeIds=new Set([e.selectedNodeId]):e&&e.selectedLinkId&&this._edgeEls.has(e.selectedLinkId)&&(this._selectedLinkId=e.selectedLinkId)}this._applySelectionClasses()}_classifyTarget(e){if(!e||typeof e.closest!="function")return"empty";if(this._editorEl&&this._editorEl.contains(e)||e.closest(".ng-toolbar")||e.closest(".ng-layout-tools")||e.closest(".ng-vars-panel")||e.closest(".ng-merge-bubble"))return"ui";if(e.closest(".ng-port--out"))return"out-port";let t=e.closest(".ng-port--side");if(t){let r=m.findNode(this._state,t.dataset.nodeId);return r&&r.type!=="End"&&r.type!=="Choice"?"port-handle":"in-port"}let i=e.closest("[data-node-id]");return i&&this._nodeEls.get(i.dataset.nodeId)===i?"node":e.closest(".ng-edge-end-handle")?"edge-end-handle":e.closest(".ng-edge")?"edge":"empty"}_shouldPan(e){let t=this._classifyTarget(e.target);return Pn({button:e.button,spaceHeld:this._spaceHeld,targetKind:t}).type==="pan"}_portHandleAt(e,t,i){for(let r of e.querySelectorAll(".ng-port--side")){let o=r.getBoundingClientRect(),s=t-(o.left+o.width/2),a=i-(o.top+o.height/2);if(Math.max(Math.abs(s),Math.abs(a))<=10)return r}return null}_handleHoverMove(e){if(this._nodeDrag||this._linkDrag||this._marquee||this._resize||this._endHandleDrag||!this._state||typeof e.target.closest!="function"){this._clearResizeCursor();return}let t=e.target.closest("[data-node-id]"),i=t&&this._nodeEls.get(t.dataset.nodeId)===t?t:null;if(!i){this._clearResizeCursor();return}this._cursorEl&&this._cursorEl!==i&&this._clearResizeCursor(),i.style.cursor=ts(Fn(i.getBoundingClientRect(),e.clientX,e.clientY)),this._cursorEl=i}_clearResizeCursor(){this._cursorEl&&(this._cursorEl.style.cursor=""),this._cursorEl=null}_handlePointerDown(e){let t=e.target;if(typeof t.closest!="function")return;this._mergeBubble&&!this._mergeBubble.el.contains(t)&&this._removeMergeBubble(),!(this._editorEl&&this._editorEl.contains(document.activeElement))&&!t.closest("input, textarea, select, button, .ng-vars-panel")&&this.contentEl.focus({preventScroll:!0});let r=this._classifyTarget(t),o=!1,s=null,a=null,l=null;if(r==="node"&&e.button===0){let d=t.closest("[data-node-id]");d&&this._nodeEls.get(d.dataset.nodeId)===d&&(a=d.dataset.nodeId,l=this._portHandleAt(d,e.clientX,e.clientY),o=!!l,o||(s=Fn(d.getBoundingClientRect(),e.clientX,e.clientY)))}switch(Pn({button:e.button,spaceHeld:this._spaceHeld,targetKind:r,portHit:o,resizeZone:s}).type){case"node-drag":{let d=t.closest("[data-node-id]");this._startNodeDrag(e,d.dataset.nodeId);break}case"link-drag":{this._startLinkDrag(e,l||t.closest(".ng-port"));break}case"end-handle-drag":{let d=t.closest(".ng-edge");d&&this._startEndHandleDrag(e,d.getAttribute("data-link-id"));break}case"resize-drag":{this._startResize(e,a,s);break}case"marquee":this._startMarquee(e);break;default:break}}_handlePointerMove(e){this._nodeDrag?this._moveNodeDrag(e):this._linkDrag?this._moveLinkDrag(e):this._marquee?this._moveMarquee(e):this._resize?this._moveResize(e):this._endHandleDrag&&this._moveEndHandleDrag(e)}_handlePointerUp(e){this._nodeDrag?this._endNodeDrag(e):this._linkDrag?this._endLinkDrag(e):this._marquee?this._endMarquee(e):this._resize?this._endResize(e):this._endHandleDrag&&this._endEndHandleDrag(e)}_cancelDrags(){if(this._untrackDrag(),this._nodeDrag=null,this._linkDrag&&(this._linkDrag.ghost.remove(),this._linkDrag=null,this._frameEl&&this._frameEl.classList.remove("ng-canvas--link-drag")),this._marquee&&(this._marquee.rectEl.remove(),this._marquee=null),this._resize){let e=this._resize;this._resize=null;let t=m.findNode(this._state,e.nodeId);if(t&&e.moved){let i=e.origFields;t.x=i.x,t.y=i.y,i.width===void 0?delete t.width:t.width=i.width,i.height===void 0?delete t.height:t.height=i.height,i.manualSize===void 0?delete t.manualSize:t.manualSize=i.manualSize,this._rerenderPreservingCamera()}}if(this._endHandleDrag){let e=this._endHandleDrag;this._endHandleDrag=null;let t=this._state&&m.findLink(this._state,e.linkId);t&&e.moved&&(e.hadToPort?t.toPort={...e.origToPort}:delete t.toPort,this._relayoutLink(e.linkId))}}_startNodeDrag(e,t){if(e.shiftKey)return;this._removeMergeBubble();let i=Uo(this._selectedNodeIds,t,!1);(i.length!==this._selectedNodeIds.size||i.some(a=>!this._selectedNodeIds.has(a)))&&this._setSelection(i,null);let r=[...this._selectedNodeIds].filter(a=>m.findNode(this._state,a)),o=new Map;for(let a of r){let l=m.findNode(this._state,a);o.set(a,{x:l.x,y:l.y})}let s=(this._state.project.links||[]).filter(a=>a&&(this._selectedNodeIds.has(a.from)||this._selectedNodeIds.has(a.to))).map(a=>a.id);this._nodeDrag={pointerId:e.pointerId,dragIds:r,grabbedId:t,starts:o,linkIds:s,startClientX:e.clientX,startClientY:e.clientY,scale:this._viewport.getView().scale,moved:!1},this._trackDrag()}_moveNodeDrag(e){let t=this._nodeDrag;if(e.pointerId!==t.pointerId)return;let i=(e.clientX-t.startClientX)/t.scale,r=(e.clientY-t.startClientY)/t.scale;Math.abs(i)+Math.abs(r)>1&&(t.moved=!0);for(let s of t.dragIds){let a=m.findNode(this._state,s),l=t.starts.get(s);a.x=Math.round(l.x+i),a.y=Math.round(l.y+r);let c=this._nodeEls.get(s);c&&(c.style.left=`${a.x}px`,c.style.top=`${a.y}px`)}let o=new Map(this._state.project.nodes.map(s=>[s.id,s]));for(let s of t.linkIds){let a=m.findLink(this._state,s),l=this._edgeEls.get(s),c=a&&me(a,o,this._sizes);l&&c&&ye(l,c)}}_endNodeDrag(e){let t=this._nodeDrag;if(this._nodeDrag=null,this._untrackDrag(),t&&t.moved){this._dragEndedAt=Date.now();for(let i of t.dragIds){let r=m.findNode(this._state,i);if(!r)continue;r.x=Math.round(r.x/8)*8,r.y=Math.round(r.y/8)*8;let o=this._nodeEls.get(i);o&&(o.style.left=`${r.x}px`,o.style.top=`${r.y}px`)}this._recordHistory(),this._scheduleSave(),this._maybeSuggestMerge(t.grabbedId)}}_startMarquee(e){let t=document.createElement("div");t.className="ng-marquee",this._frameEl.appendChild(t),this._marquee={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,additive:!!e.shiftKey,rectEl:t,moved:!1},this._trackDrag()}_moveMarquee(e){let t=this._marquee;if(e.pointerId!==t.pointerId)return;let i=this._frameEl.getBoundingClientRect(),r={x:t.startX-i.left,y:t.startY-i.top},o={x:e.clientX-i.left,y:e.clientY-i.top};Math.abs(o.x-r.x)+Math.abs(o.y-r.y)>3&&(t.moved=!0);let s=qn(r,o);t.rectEl.style.left=`${s.x0}px`,t.rectEl.style.top=`${s.y0}px`,t.rectEl.style.width=`${s.x1-s.x0}px`,t.rectEl.style.height=`${s.y1-s.y0}px`}_endMarquee(e){let t=this._marquee;if(this._marquee=null,this._untrackDrag(),!t||(t.rectEl.remove(),!t.moved))return;this._dragEndedAt=Date.now();let i=t.additive||!!e.shiftKey,r=this._frameEl.getBoundingClientRect(),o=this._viewport.getView(),s=B({x:t.startX-r.left,y:t.startY-r.top},o),a=B({x:e.clientX-r.left,y:e.clientY-r.top},o),l=Jo(this._state.project.nodes||[],qn(s,a),this._sizes),c=Xo(this._selectedNodeIds,l,i);this._setSelection(c,null)}_startLinkDrag(e,t){let i=t.dataset.nodeId,r=t.dataset.optionId||null,o=t.dataset.side||null,s=t.getBoundingClientRect(),a=this._frameEl.getBoundingClientRect(),l=this._viewport.getView(),c=B({x:s.left+s.width/2-a.left,y:s.top+s.height/2-a.top},l),d=document.createElementNS("http://www.w3.org/2000/svg","path");d.setAttribute("class","ng-edge__ghost"),this._svgEl.appendChild(d),this._frameEl.classList.add("ng-canvas--link-drag"),this._linkDrag={pointerId:e.pointerId,fromId:i,optionId:r,fromSide:o,start:c,ghost:d},this._trackDrag()}_moveLinkDrag(e){let t=this._linkDrag;if(e.pointerId!==t.pointerId)return;let i=this._frameEl.getBoundingClientRect(),r=B({x:e.clientX-i.left,y:e.clientY-i.top},this._viewport.getView()),o=t.fromSide||"right",{d:s}=Ko({x:t.start.x,y:t.start.y,side:o},{x:r.x,y:r.y,side:Qo(o)});t.ghost.setAttribute("d",s)}_hitTestLinkTarget(e,t){let i=typeof document.elementFromPoint=="function"?document.elementFromPoint(e,t):null;if(!i||typeof i.closest!="function")return null;let r=i.closest(".ng-port--side");if(r&&this._nodeEls.has(r.dataset.nodeId)){let s=m.findNode(this._state,r.dataset.nodeId);if(s&&s.type!=="Entry"){let a=parseFloat(r.dataset.t);return{nodeId:r.dataset.nodeId,side:r.dataset.side,t:Number.isFinite(a)?a:.5}}return null}let o=i.closest("[data-node-id]");if(o&&this._nodeEls.get(o.dataset.nodeId)===o){let s=m.findNode(this._state,o.dataset.nodeId);if(!s||s.type==="Entry")return null;let a=this._frameEl.getBoundingClientRect(),l=B({x:e-a.left,y:t-a.top},this._viewport.getView()),c=this._sizes.get(s.id),d=ne(s,c&&c.height),h=Vn(s,d,l);return{nodeId:s.id,side:h,t:jn(s,d,h,l)}}return null}_endLinkDrag(e){let t=this._linkDrag;if(this._linkDrag=null,this._untrackDrag(),this._frameEl&&this._frameEl.classList.remove("ng-canvas--link-drag"),!t)return;t.ghost.remove();let i=this._hitTestLinkTarget(e.clientX,e.clientY);if(i)try{m.addLink(this._state,t.fromId,i.nodeId,t.optionId,{fromSide:t.fromSide,toSide:i.side,toT:i.t}),this._afterMutation()}catch(r){console.warn("[Narrative Graph] addLink rejected:",r.message)}}_relayoutLink(e){if(!this._state)return;let t=m.findLink(this._state,e),i=this._edgeEls.get(e);if(!t||!i)return;let r=new Map(this._state.project.nodes.map(s=>[s.id,s])),o=me(t,r,this._sizes);o&&ye(i,o)}_startEndHandleDrag(e,t){let i=m.findLink(this._state,t);if(!i)return;let r=m.findNode(this._state,i.to);r&&(this._endHandleDrag={pointerId:e.pointerId,linkId:t,nodeId:r.id,hadToPort:!!i.toPort,origToPort:i.toPort?{side:i.toPort.side,t:i.toPort.t}:null,moved:!1},this._trackDrag())}_moveEndHandleDrag(e){let t=this._endHandleDrag;if(e.pointerId!==t.pointerId)return;let i=m.findLink(this._state,t.linkId),r=m.findNode(this._state,t.nodeId);if(!i||!r)return;let o=this._frameEl.getBoundingClientRect(),s=B({x:e.clientX-o.left,y:e.clientY-o.top},this._viewport.getView()),a=this._sizes.get(r.id),l=ne(r,a&&a.height),c=Vn(r,l,s),d=jn(r,l,c,s);i.toPort={side:c,t:d},t.moved=!0,this._relayoutLink(t.linkId)}_endEndHandleDrag(e){let t=this._endHandleDrag;if(this._endHandleDrag=null,this._untrackDrag(),!(!t||!t.moved)){this._dragEndedAt=Date.now();try{let i=m.findLink(this._state,t.linkId);m.setLinkToPort(this._state,t.linkId,i&&i.toPort),this._afterMutation(),this._setSelection([],t.linkId)}catch(i){console.warn("[Narrative Graph] setLinkToPort rejected:",i.message)}}}_startResize(e,t,i){if(!t||!i||!this._nodeEls.get(t))return;let o=m.findNode(this._state,t);if(!o)return;this._selectedNodeIds.has(t)||this._setSelection([t],null);let s=this._sizes.get(t),a=ne(o,s&&s.height);this._resize={pointerId:e.pointerId,nodeId:t,dir:i,startRect:{x:o.x,y:o.y,width:a.width,height:a.height},origFields:{x:o.x,y:o.y,width:o.width,height:o.height,manualSize:o.manualSize},startClientX:e.clientX,startClientY:e.clientY,scale:this._viewport.getView().scale,moved:!1},this._trackDrag()}_moveResize(e){let t=this._resize;if(e.pointerId!==t.pointerId)return;let i=(e.clientX-t.startClientX)/t.scale,r=(e.clientY-t.startClientY)/t.scale;Math.abs(i)+Math.abs(r)>1&&(t.moved=!0);let o=es(t.startRect,t.dir,i,r),s=m.findNode(this._state,t.nodeId);if(!s)return;s.x=o.x,s.y=o.y,s.width=o.width,s.height=o.height;let a=this._nodeEls.get(t.nodeId);a&&(a.classList.add("ng-node--fixed"),a.style.left=`${s.x}px`,a.style.top=`${s.y}px`,a.style.width=`${s.width}px`,a.style.height=`${s.height}px`);let l=this._sizes.get(t.nodeId)||{};this._sizes.set(t.nodeId,{width:o.width,height:o.height,optionT:l.optionT});let c=new Map(this._state.project.nodes.map(d=>[d.id,d]));for(let d of this._state.project.links||[]){if(!d||d.from!==t.nodeId&&d.to!==t.nodeId)continue;let h=this._edgeEls.get(d.id),u=me(d,c,this._sizes);h&&u&&ye(h,u)}}_endResize(e){let t=this._resize;if(this._resize=null,this._untrackDrag(),!t||!t.moved)return;this._dragEndedAt=Date.now();let i=m.findNode(this._state,t.nodeId);i&&(m.resizeNode(this._state,t.nodeId,{x:i.x,y:i.y,width:i.width,height:i.height}),this._afterMutation())}_trackDrag(){document.addEventListener("pointermove",this._onPointerMove),document.addEventListener("pointerup",this._onPointerUp),document.addEventListener("pointercancel",this._onPointerUp)}_untrackDrag(){document.removeEventListener("pointermove",this._onPointerMove),document.removeEventListener("pointerup",this._onPointerUp),document.removeEventListener("pointercancel",this._onPointerUp)}_handleClick(e){if(Date.now()-this._dragEndedAt<150)return;let t=e.target;if(typeof t.closest!="function"||this._editorEl&&this._editorEl.contains(t)||t.closest(".ng-toolbar")||t.closest(".ng-port")||t.closest(".ng-resize")||t.closest(".ng-vars-panel")||t.closest(".ng-layout-tools")||t.closest(".ng-merge-bubble"))return;let i=t.closest("[data-node-id]");if(i&&this._nodeEls.get(i.dataset.nodeId)===i){if(e.shiftKey){let o=new Set(this._selectedNodeIds);o.has(i.dataset.nodeId)?o.delete(i.dataset.nodeId):o.add(i.dataset.nodeId),this._setSelection([...o],null)}else this._setSelection([i.dataset.nodeId],null);return}let r=t.closest(".ng-edge");if(r){this._setSelection([],r.getAttribute("data-link-id"));return}this._setSelection([],null)}_handleDblClick(e){if(Date.now()-this._dragEndedAt<150)return;let t=e.target;if(typeof t.closest!="function"||this._editorEl&&this._editorEl.contains(t)||t.closest(".ng-resize"))return;let i=t.closest("[data-node-id]");if(i&&this._nodeEls.get(i.dataset.nodeId)===i){this._openNodeEditor(i.dataset.nodeId);return}let r=t.closest(".ng-edge");r&&this._openLinkEditor(r.getAttribute("data-link-id"),e)}_closeEditor(){this._editorDragCleanup&&(this._editorDragCleanup(),this._editorDragCleanup=null),this._editorEl&&(this._editorEl.remove(),this._editorEl=null)}_placeEditor(e,t,i){this._editorSession&&this._finalizeEditor(this._editorSession,this._editorSession.readDraft()),this._closeEditor(),this._frameEl.appendChild(e),this._editorEl=e;let r=(l,c)=>{let d=this._frameEl.getBoundingClientRect(),h=Math.max(0,d.width-e.offsetWidth),u=Math.max(0,d.height-e.offsetHeight);return{x:Math.min(Math.max(0,l),h),y:Math.min(Math.max(0,c),u)}},o=r(t,i);e.style.left=`${o.x}px`,e.style.top=`${o.y}px`;let s=e.querySelector(".ng-editor__heading");s&&s.addEventListener("pointerdown",l=>{if(l.button!==0)return;let c=l.clientX,d=l.clientY,h=parseFloat(e.style.left)||0,u=parseFloat(e.style.top)||0,p=y=>{let x=r(h+y.clientX-c,u+y.clientY-d);e.style.left=`${x.x}px`,e.style.top=`${x.y}px`},f=()=>{window.removeEventListener("pointermove",p),window.removeEventListener("pointerup",f),this._editorDragCleanup===f&&(this._editorDragCleanup=null)};this._editorDragCleanup=f,window.addEventListener("pointermove",p),window.addEventListener("pointerup",f)});let a=e.querySelector("input, textarea");a&&a.focus()}_openNodeEditor(e){let t=m.findNode(this._state,e);if(!t)return;let i={kind:"node",id:e,snapshot:JSON.parse(JSON.stringify({title:t.title,body:t.body,turns:t.turns,choiceOptions:t.choiceOptions})),dirty:!1,readDraft:null},r=Vo(t,{onDraft:s=>this._applyEditorDraft(i,s),onCommit:s=>this._finalizeEditor(i,s),onCancel:()=>this._cancelEditor(i),getVariables:()=>this._getVarEntries(),getSpeakers:()=>this._getSpeakers()});i.readDraft=()=>Fo(r,t);let o=$n({x:t.x,y:t.y},this._viewport.getView());this._placeEditor(r,o.x,o.y),this._editorSession=i}_openLinkEditor(e,t){let i=m.findLink(this._state,e);if(!i)return;let r={kind:"link",id:e,snapshot:JSON.parse(JSON.stringify({requirements:i.requirements})),dirty:!1,readDraft:null},o=jo(i,{onDraft:a=>this._applyEditorDraft(r,a),onCommit:a=>this._finalizeEditor(r,a),onCancel:()=>this._cancelEditor(r),getVariables:()=>this._getVarEntries()});r.readDraft=()=>{let a=o.querySelector(".ng-editor__requires");return a?a.value:""};let s=this._frameEl.getBoundingClientRect();this._placeEditor(o,t.clientX-s.left,t.clientY-s.top),this._editorSession=r}_applyEditorResult(e,t){if(e.kind==="link"){m.setLinkRequirements(this._state,e.id,t);return}let i=m.findNode(this._state,e.id);if(!i)throw new Error(`editor session: unknown node '${e.id}'`);m.setNodeTitle(this._state,e.id,t.title),t.turns&&m.setTurns(i,t.turns),t.body!==void 0&&m.setNodeBody(this._state,e.id,t.body),t.options&&m.setChoiceOptions(i,t.options,this._state.project.nodes,this._state.project.links)}_applyEditorDraft(e,t){if(this._editorSession===e){try{this._applyEditorResult(e,t)}catch{return}e.dirty=!0,this._stabilizeChoiceOptionIds(e),this._scheduleSave()}}_stabilizeChoiceOptionIds(e){if(e.kind!=="node"||!this._editorEl)return;let t=m.findNode(this._state,e.id);if(!t||t.type!=="Choice"||!Array.isArray(t.choiceOptions))return;this._editorEl.querySelectorAll(".ng-editor__option-row").forEach((r,o)=>{let s=t.choiceOptions[o];s&&s.id&&!r.dataset.optionId&&(r.dataset.optionId=s.id)})}_finalizeEditor(e,t){if(this._editorSession===e){this._editorSession=null,this._closeEditor();try{this._applyEditorResult(e,t)}catch(i){console.warn("[Narrative Graph] edit rejected:",i.message)}this._afterMutation(),e.kind==="node"?this._setSelection([e.id],null):this._setSelection([],e.id),e.dirty&&this._graphSettings().autoSave&&(this.flushSave(),new A("\u5DF2\u81EA\u52A8\u4FDD\u5B58"))}}_cancelEditor(e){if(this._editorSession!==e||(this._editorSession=null,this._closeEditor(),!e.dirty))return;let t=e.snapshot;try{if(e.kind==="node"){let i=m.findNode(this._state,e.id);if(!i)throw new Error(`editor session: unknown node '${e.id}'`);m.setNodeTitle(this._state,e.id,t.title),i.type==="Dialog"?t.turns!==void 0?m.setTurns(i,t.turns):(delete i.turns,m.setNodeBody(this._state,e.id,t.body)):(m.setNodeBody(this._state,e.id,t.body),i.type==="Choice"&&m.setChoiceOptions(i,t.choiceOptions||[],this._state.project.nodes,this._state.project.links))}else m.setLinkRequirements(this._state,e.id,t.requirements||"")}catch(i){console.warn("[Narrative Graph] revert rejected:",i.message)}this._rerenderPreservingCamera(),this._scheduleSave(),this._graphSettings().autoSave&&new A("\u5DF2\u64A4\u9500\u672C\u6B21\u7F16\u8F91")}_isTypingTarget(e){return!!(e&&typeof e.closest=="function"&&e.closest("input, textarea, select, [contenteditable]"))}_handleKeyDown(e){if(this._mergeBubble){e.key==="Enter"?(e.preventDefault(),this._confirmMergeBubble()):e.key==="Escape"&&(e.preventDefault(),this._removeMergeBubble());return}if(e.key===" "&&!this._isTypingTarget(e.target)){this._spaceHeld=!0,e.preventDefault(),this._frameEl&&this._frameEl.classList.add("ng-canvas--space");return}if(!this._isTypingTarget(e.target)){if(e.ctrlKey||e.metaKey){if(this._editorEl)return;let t=e.key.toLowerCase();t==="z"&&!e.shiftKey?(e.preventDefault(),this._undo()):t==="z"&&e.shiftKey||t==="y"?(e.preventDefault(),this._redo()):t==="c"?this._copySelection()&&e.preventDefault():t==="v"&&(e.preventDefault(),this._pasteClipboard());return}if(e.key==="Escape"){this._cancelDrags();return}if(!(e.key!=="Delete"&&e.key!=="Backspace")&&!this._editorEl&&this._state){if(this._selectedNodeIds.size>0){let t=m.entryNodes(this._state).length,i=0,r=0,o=t;for(let s of[...this._selectedNodeIds]){let a=m.findNode(this._state,s);if(a){if(a.type==="Entry"&&o<=1){i++;continue}a.type==="Entry"&&o--;try{m.deleteNode(this._state,s),this._selectedNodeIds.delete(s),r++}catch(l){console.warn("[Narrative Graph] deleteNode rejected:",l.message)}}}i>0&&console.warn(`[Narrative Graph] skipped ${i} Entry node(s) \u2014 file must keep one Entry`),r>0&&(this._setUiSelection(),this._afterMutation())}else if(this._selectedLinkId)try{m.deleteLink(this._state,this._selectedLinkId),this._setSelection([],null),this._afterMutation()}catch(t){console.warn("[Narrative Graph] deleteLink rejected:",t.message)}e.preventDefault()}}}_handleKeyUp(e){e.key===" "&&(this._spaceHeld=!1,this._frameEl&&this._frameEl.classList.remove("ng-canvas--space"))}async _clipboardWrite(e){try{let t=typeof window<"u"?window.navigator:null;if(t&&t.clipboard&&typeof t.clipboard.writeText=="function")return await t.clipboard.writeText(e),!0}catch{}try{let t=require("electron");if(t&&t.clipboard)return t.clipboard.writeText(e),!0}catch{}return console.warn("[Narrative Graph] \u5199\u5165\u7CFB\u7EDF\u526A\u8D34\u677F\u5931\u8D25"),!1}async _clipboardRead(){try{let e=typeof window<"u"?window.navigator:null;if(e&&e.clipboard&&typeof e.clipboard.readText=="function")return await e.clipboard.readText()}catch{}try{let e=require("electron");if(e&&e.clipboard)return e.clipboard.readText()}catch{}return null}_copySelection(){if(!this._state||this._selectedNodeIds.size===0)return!1;let e=Ke.encodeSelection(this._state,[...this._selectedNodeIds]);return e?(this._clipboardWrite(JSON.stringify(e)),!0):!1}async _pasteClipboard(){if(!this._state)return;let e=await this._clipboardRead(),t=e?Ke.parseEnvelopeText(e):null;if(!t){new A("\u526A\u8D34\u677F\u4E2D\u6CA1\u6709\u53EF\u7C98\u8D34\u7684\u8282\u70B9");return}let i=this._frameEl.getBoundingClientRect(),r=B({x:i.width/2,y:i.height/2},this._viewport.getView());try{let o=Ke.applyPaste(this._state,t,{center:r,knownVariables:this._getVarEntries().map(s=>s&&s.name)});if(o.addedNodeIds.length===0)return;this._afterMutation(),this._setSelection(o.addedNodeIds,null),o.downgradedEntry>0&&new A("\u7C98\u8D34\u7684 Entry \u8282\u70B9\u5DF2\u964D\u7EA7\u4E3A Content\uFF08\u6BCF\u4E2A\u6587\u4EF6\u53EA\u80FD\u6709\u4E00\u4E2A Entry\uFF09"),o.missingVariables.length>0&&new A(`\u7C98\u8D34\u7684\u5185\u5BB9\u5F15\u7528\u4E86 ${o.missingVariables.length} \u4E2A\u672A\u767B\u8BB0\u7684\u5168\u5C40\u53D8\u91CF\uFF1A`+o.missingVariables.join("\u3001"))}catch(o){console.warn("[Narrative Graph] paste rejected:",o.message)}}_undo(){if(!this._history||!this._historyBaseline||!this._state)return;let e=F.undo(this._history,this._historyBaseline);e&&this._applyHistorySnapshot(e.snapshot)}_redo(){if(!this._history||!this._historyBaseline||!this._state)return;let e=F.redo(this._history,this._historyBaseline);e&&this._applyHistorySnapshot(e.snapshot)}_applyHistorySnapshot(e){let t=F.takeSnapshot({project:e.project,ui:e.ui});this._state.project=t.project,(!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={});let i=t.ui||{};this._state.ui.selectedNodeId=i.selectedNodeId!=null?i.selectedNodeId:null,this._state.ui.selectedLinkId=i.selectedLinkId!=null?i.selectedLinkId:null;let r=this._state.project.nodes||[],o=this._state.project.links||[];this._selectedNodeIds=new Set(this._state.ui.selectedNodeId&&r.some(s=>s&&s.id===this._state.ui.selectedNodeId)?[this._state.ui.selectedNodeId]:[]),this._selectedLinkId=this._state.ui.selectedLinkId&&o.some(s=>s&&s.id===this._state.ui.selectedLinkId)?this._state.ui.selectedLinkId:null,this._historyBaseline=F.takeSnapshot(this._state),this._rerenderPreservingCamera(),this._scheduleSave()}_persistView(e,t){this._state&&((!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={}),this._state.ui.view={x:e.x,y:e.y,scale:e.scale},t==="pan"&&(this._dragEndedAt=Date.now()),this._scheduleSave())}_scheduleSave(){this._graphSettings().autoSave&&(this._saveTimer!==null&&clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{this._saveTimer=null,this.requestSave()},Bn))}flushSave(){this._saveTimer!==null&&(clearTimeout(this._saveTimer),this._saveTimer=null),this.requestSave()}};Hn.exports={NarrativeGraphView:Ze,VIEW_TYPE_NARRATIVE_GRAPH:Rn,SAVE_DEBOUNCE:Bn}});var Gn=k((Os,Un)=>{var{PluginSettingTab:ns,Setting:W}=require("obsidian"),{DEFAULT_VARIABLES_PATH:Xn}=ee(),is=Object.freeze({variablesPath:Xn,autoSave:!0,mergeSuggest:!0,mergeThreshold:.35,mergeChoice:!0,stdWidth:440}),Qe=class extends ns{constructor(e,t){super(e,t),this.plugin=t}display(){let{containerEl:e}=this;e.empty(),new W(e).setName("\u81EA\u52A8\u4FDD\u5B58").setDesc("\u7F16\u8F91\u8282\u70B9\u6216\u8FDE\u7EBF\u65F6\u5B9E\u65F6\u5199\u5165 .ncanvas \u6587\u4EF6\uFF082 \u79D2\u9632\u6296\uFF09\uFF0C\u9000\u51FA\u7F16\u8F91\u65F6\u63D0\u793A\u4FDD\u5B58\u7ED3\u679C\u3002\u5173\u95ED\u540E\u9700\u624B\u52A8\u4FDD\u5B58\uFF08Obsidian \u81EA\u5E26\u4FDD\u5B58\u547D\u4EE4\u6216 Ctrl+S\uFF09\u3002").addToggle(t=>t.setValue(this.plugin.settings.autoSave).onChange(async i=>{this.plugin.settings.autoSave=i,await this.plugin.saveSettings()})),new W(e).setName("\u5168\u5C40\u53D8\u91CF\u8868\u8DEF\u5F84").setDesc("\u53D8\u91CF\u8868\u9762\u677F\u8BFB\u5199\u3001\u4EE5\u53CA narrative-tool \u5BFC\u51FA\u5408\u5E76\u7684\u5168\u5C40\u53D8\u91CF\u8868\uFF08markdown \u8868\u683C\uFF1A\u53D8\u91CF|\u7C7B\u578B|\u521D\u59CB\u503C|\u5907\u6CE8\uFF09\u3002").addText(t=>t.setPlaceholder(Xn).setValue(this.plugin.settings.variablesPath).onChange(async i=>{this.plugin.settings.variablesPath=i,await this.plugin.saveSettings()})),new W(e).setName("\u62D6\u62FD\u5408\u5E76\u63D0\u793A").setDesc("\u62D6\u52A8\u5361\u7247\u843D\u5230\u540C\u7C7B\u5361\u7247\u4E0A\u65F6\uFF0C\u5F39\u51FA\u786E\u8BA4\u6C14\u6CE1\u8BE2\u95EE\u662F\u5426\u5408\u5E76\u3002").addToggle(t=>t.setValue(this.plugin.settings.mergeSuggest).onChange(async i=>{this.plugin.settings.mergeSuggest=i,await this.plugin.saveSettings()})),new W(e).setName("\u5408\u5E76\u63D0\u793A\u91CD\u53E0\u9608\u503C").setDesc("\u91CD\u53E0\u9762\u79EF\u5360\u8F83\u5C0F\u5361\u7247\u7684\u6BD4\u4F8B\u8FBE\u5230\u8BE5\u503C\u624D\u63D0\u793A\u5408\u5E76\uFF08\u62D6\u52A8\u5361\u7247\u4E2D\u5FC3\u538B\u4F4F\u5BF9\u65B9\u65F6\u4E0D\u53D7\u6B64\u9650\uFF09\u3002").addSlider(t=>t.setLimits(.1,.8,.05).setValue(this.plugin.settings.mergeThreshold).setDynamicTooltip().onChange(async i=>{this.plugin.settings.mergeThreshold=i,await this.plugin.saveSettings()})),new W(e).setName("\u5141\u8BB8\u5408\u5E76 Choice \u5361\u7247").setDesc("\u5173\u95ED\u540E\uFF0C\u62D6\u62FD\u5408\u5E76\u53EA\u5BF9 Content/Dialog \u751F\u6548\uFF0CChoice \u9009\u9879\u6C38\u4E0D\u5E76\u5361\u3002").addToggle(t=>t.setValue(this.plugin.settings.mergeChoice).onChange(async i=>{this.plugin.settings.mergeChoice=i,await this.plugin.saveSettings()})),new W(e).setName("\u6807\u51C6\u5361\u7247\u5BBD\u5EA6").setDesc("\u300C\u5C3A\u5BF8\u6574\u7406\u300D\u7EDF\u4E00 Content/Dialog \u5BBD\u5EA6\u7684\u76EE\u6807\u503C\uFF08px\uFF09\uFF1B\u9AD8\u5EA6\u4EA4\u8FD8\u81EA\u52A8\u6491\u9AD8\u3002").addSlider(t=>t.setLimits(320,900,10).setValue(this.plugin.settings.stdWidth).setDynamicTooltip().onChange(async i=>{this.plugin.settings.stdWidth=i,await this.plugin.saveSettings()}))}};Un.exports={DEFAULT_SETTINGS:is,NarrativeGraphSettingTab:Qe}});var Wn=k((Ps,rs)=>{rs.exports=`/* Narrative Graph \u2014 canvas view styles (Phase 11 M1a, NG-08/NG-09) */

.narrative-graph-view {
    padding: 0;
    height: 100%;
    overflow: hidden;
}

.narrative-graph-error {
    color: var(--text-error);
    padding: 12px 16px;
}

/* ---------------------------------------------------------------------------
 * Frame + world transform stack
 * ------------------------------------------------------------------------- */

.ng-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--background-primary);
    /* UAT-6 #2: faint dot grid. Tile position/size are driven by viewport.js
     * (derived from the world translate/scale); the 40px default below only
     * covers the first paint before the camera applies. */
    background-image: radial-gradient(circle,
        color-mix(in srgb, var(--text-faint) 55%, transparent) 1.2px,
        transparent 1.2px);
    background-size: 40px 40px;
    /* UAT-5: default arrow at rest; grab only while Space is held,
     * grabbing only during an active pan gesture. */
    cursor: default;
}

.ng-canvas--space {
    cursor: grab;
}

.ng-canvas--panning,
.ng-canvas--panning * {
    cursor: grabbing !important;
}

.ng-canvas__warning {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: 4px 12px;
    border-radius: 6px;
    background: var(--background-modifier-error);
    color: var(--text-on-accent);
    font-size: var(--font-ui-smaller);
    pointer-events: auto;
}

.ng-world {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    width: 0;
    height: 0;
}

.ng-edges {
    position: absolute;
    overflow: visible;
    pointer-events: none;
}

.ng-edge__path {
    fill: none;
    stroke: var(--text-faint);
    stroke-width: 2;
}

/* Fat invisible hit path: makes thin edges clickable (M1b selection) */
.ng-edge__hit {
    fill: none;
    stroke: transparent;
    stroke-width: 14;
    pointer-events: stroke;
}

/* M3 polish: hover highlight aids picking edges out of dense graphs.
 * Placed before .is-selected so the selection style wins (equal
 * specificity \u2014 source order decides). */
.ng-edge:hover .ng-edge__path {
    stroke: var(--text-muted);
    stroke-width: 3;
}

.ng-edge.is-selected .ng-edge__path {
    stroke: var(--interactive-accent);
    stroke-width: 3;
}

/* Target-end drag handle (toPort): rendered for every edge but shown only
 * while the edge is selected. The edge layer is pointer-events: none, so the
 * handle opts back in explicitly (same trick as .ng-edge__hit). */
.ng-edge-end-handle {
    display: none;
    fill: var(--background-primary);
    stroke: var(--interactive-accent);
    stroke-width: 2;
    cursor: crosshair;
    pointer-events: all;
}

.ng-edge.is-selected .ng-edge-end-handle {
    display: block;
}

.ng-edge-end-handle:hover {
    fill: var(--interactive-accent);
}

/* Live ghost bezier while dragging a new link from a port */
.ng-edge__ghost {
    fill: none;
    stroke: var(--interactive-accent);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    pointer-events: none;
}

.ng-edge__label {
    fill: var(--text-muted);
    font-size: 12px;
    paint-order: stroke;
    stroke: var(--background-primary);
    stroke-width: 4;
}

.ng-edge__condition {
    fill: var(--text-faint);
    font-size: 11px;
    font-family: var(--font-monospace);
    paint-order: stroke;
    stroke: var(--background-primary);
    stroke-width: 4;
}

/* ---------------------------------------------------------------------------
 * Nodes \u2014 auto height (NG-08): min-height only, content flows naturally,
 * long text is never clipped or scrolled inside a node. Exception: nodes
 * manually resized in narrative-graph carry \`ng-node--fixed\` (UAT-6 #5) \u2014
 * stored height honored, body scrolls (rules in the resize section below).
 * ------------------------------------------------------------------------- */

.ng-node {
    position: absolute;
    min-height: 48px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    overflow: visible;
    cursor: default;
    user-select: none;
}

.ng-node.is-selected {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 1px;
}

.ng-node__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--background-modifier-border);
    font-weight: 600;
}

.ng-node__marker {
    color: var(--text-accent);
}

.ng-node__title {
    flex: 1;
    overflow-wrap: anywhere;
}

.ng-node__badge {
    font-size: var(--font-ui-smaller);
    font-weight: 400;
    color: var(--text-faint);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 0 4px;
}

/* Node id badge (n3 \u2026): quiet monospaced tag at the header's right edge */
.ng-node-id {
    font-size: var(--font-ui-smaller);
    font-weight: 400;
    font-family: var(--font-monospace);
    color: var(--text-faint);
    opacity: 0.7;
    flex: 0 0 auto;
}

.ng-node__body {
    padding: 6px 10px 8px;
}

.ng-node__text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

/* Dialog turns (NG-05): one \`speaker: line\` row per turn */
.ng-node__turn {
    display: block;
    margin: 2px 0;
}

.ng-node__speaker {
    color: var(--text-accent);
    font-weight: 600;
    margin-right: 4px;
}

/* Choice options */
.ng-node__option {
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
}

/* Type accents */
.ng-node--entry {
    border-color: var(--color-green);
}

.ng-node--end {
    border-color: var(--color-red);
    background: var(--background-primary);
}

.ng-node--choice {
    border-color: var(--color-yellow);
}

.ng-node--dialog {
    border-color: var(--color-blue);
}

.ng-node--unsupported {
    opacity: 0.75;
    border-style: dashed;
}

/* ---------------------------------------------------------------------------
 * Ports (M1b link creation; UAT-6 #1 four-side handles)
 * ------------------------------------------------------------------------- */

.ng-port {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--background-primary);
    border: 2px solid var(--text-faint);
    cursor: crosshair;
    z-index: 2;
    /* Dot CENTER sits on the anchor point: non-option dots are inline-
     * positioned at the stored port side/t (renderer.js buildPortDot),
     * so edges end exactly at the visible dot (UAT-5). */
    transform: translate(-50%, -50%);
}

.ng-port:hover {
    border-color: var(--interactive-accent);
    background: var(--interactive-accent);
    transform: translate(-50%, -50%) scale(1.3);
}

/* UAT-6 #1 (native .canvas): side handles are invisible by default \u2014 shown
 * while hovering their node, and on ALL nodes during a link drag (drop
 * targets). Opacity (not display) keeps geometry measurable for the
 * edge-endpoint == handle-center contract. */
.ng-port--side {
    opacity: 0;
    pointer-events: none;
    transition: opacity 90ms ease;
    z-index: 3;
}

.ng-node:hover .ng-port--side,
.ng-canvas--link-drag .ng-port--side {
    opacity: 1;
    pointer-events: auto;
}

/* Per-option Choice output dots (UAT-8 #2): direct children of the NODE
 * ROOT, not the option row \u2014 a fixed-size node's body is a scroll container
 * (overflow-y: auto below) whose horizontal clip edge would cut the dot's
 * outer half (and overflow-clip-margin does not relax a scroll container's
 * clip \u2014 verified in Chrome). measureNode() pins each dot's \`top\` to its
 * option row's measured offset; \`top: 0\` is only the pre-measure fallback.
 * left: 100% + translate(-50%) puts the dot CENTER on the node's right
 * edge \u2014 exactly where layoutEdge anchors the link. */
.ng-node > .ng-port--out {
    left: 100%;
    top: 0;
    transform: translate(-50%, -50%);
}

.ng-node > .ng-port--out:hover {
    transform: translate(-50%, -50%) scale(1.3);
}

/* ---------------------------------------------------------------------------
 * Resize affordance (UAT-6 #5, revised UAT-7, extended UAT-8): the whole
 * border band of ANY node (selected or merely hovered) is the live resize
 * hit zone, hit-tested by coordinates in canvas-view.js (geometry
 * resizeZoneAt) with a live cursor. Only the four corner squares remain in
 * the DOM \u2014 pure decoration, pointer-events: none, so they never steal the
 * gesture from the coordinate hit test.
 * ------------------------------------------------------------------------- */

.ng-resize {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid var(--background-primary);
    background: var(--interactive-accent);
    display: none;
    z-index: 1;
    pointer-events: none;
}

.ng-node.is-selected .ng-resize {
    display: block;
}

/* UAT-8 #1: resize works on ANY node without selecting it first (native
 * .canvas) \u2014 the corner squares show on hover as the affordance. */
.ng-node:hover .ng-resize {
    display: block;
}

.ng-resize--nw { left: -7px; top: -7px; }
.ng-resize--ne { right: -7px; top: -7px; }
.ng-resize--sw { left: -7px; bottom: -7px; }
.ng-resize--se { right: -7px; bottom: -7px; }

/* Fixed-size nodes (manualSize marker \u2014 UAT-6 #5): honor the stored height,
 * scroll overflowing content inside the body instead of regrowing.
 * UAT-8 #2/#4: the node container stays overflow: visible (inherited from
 * .ng-node) so port dots and corner decorations are never clipped; ONLY the
 * inner body scrolls. Choice option dots live outside the body (see the
 * ports section), so nothing protrudes horizontally and no spurious
 * horizontal scrollbar appears. */
.ng-node--fixed {
    display: flex;
    flex-direction: column;
}

.ng-node--fixed .ng-node__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ---------------------------------------------------------------------------
 * Toolbar (M1b node creation; UAT-6 #3: \u4E2D\u6587\u6807\u7B7E + \u5927\u53F7\u6309\u94AE + \u5206\u7EC4)
 * ------------------------------------------------------------------------- */

.ng-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
}

.ng-toolbar__btn {
    padding: 6px 14px;
    font-size: var(--font-ui-small);
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-normal);
    cursor: pointer;
}

.ng-toolbar__btn:hover {
    background: var(--background-modifier-hover);
}

/* Node-creation group: accent-tinted so it reads as one distinct cluster */
.ng-toolbar__btn--add {
    background: color-mix(in srgb, var(--interactive-accent) 16%, var(--background-secondary));
    border-color: color-mix(in srgb, var(--interactive-accent) 45%, var(--background-modifier-border));
    font-weight: 600;
}

.ng-toolbar__btn--add:hover {
    background: color-mix(in srgb, var(--interactive-accent) 28%, var(--background-secondary));
}

/* Divider between the creation cluster and utility buttons (\u53D8\u91CF\u8868) */
.ng-toolbar__divider {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--background-modifier-border);
}

/* Ctrl/Cmd+F node search box + hit counter */
.ng-toolbar__search {
    display: flex;
    align-items: center;
    gap: 4px;
}

.ng-toolbar__search-input {
    width: 140px;
    padding: 4px 8px;
    font-size: var(--font-ui-small);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-secondary);
    color: var(--text-normal);
}

.ng-toolbar__search-input:focus {
    border-color: var(--interactive-accent);
}

.ng-toolbar__search-count {
    min-width: 32px;
    text-align: right;
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
}

/* Prev/next hit buttons: compact siblings of the regular toolbar buttons */
.ng-toolbar__btn--search-nav {
    padding: 3px 9px;
    line-height: 1.2;
    font-weight: 600;
}

.ng-toolbar__btn--search-nav:disabled {
    opacity: 0.4;
    cursor: default;
}

.ng-toolbar__btn--search-nav:disabled:hover {
    background: var(--background-secondary);
}

/* Search hit highlight on nodes: warm ring, brighter on the current hit.
 * Box-shadow (not outline) so it composes with the selection outline. */
.ng-node.ng-node--search-hit {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-yellow) 55%, transparent);
}

.ng-node.ng-node--search-current {
    box-shadow: 0 0 0 3px var(--color-yellow),
        0 0 14px color-mix(in srgb, var(--color-yellow) 60%, transparent);
}

/* ---------------------------------------------------------------------------
 * Layout tools (MED \u5E03\u5C40): \u5DE6\u4E0A\u89D2\u6D6E\u52A8\u5C0F\u53F7\u5DE5\u5177\u6761\u2014\u2014\u6392\u5E03\u5C40/\u5408\u5E76\u5F00\u5173/\u5C3A\u5BF8\u6574\u7406
 * ------------------------------------------------------------------------- */

.ng-layout-tools {
    position: absolute;
    top: 8px;
    left: 12px;
    z-index: 40;
    display: flex;
    gap: 6px;
}

.ng-layout-tools__btn {
    padding: 4px 12px;
    font-size: 14px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-muted);
    opacity: 0.85;
    cursor: pointer;
}

.ng-layout-tools__btn:hover {
    opacity: 1;
    color: var(--text-normal);
    background: var(--background-modifier-hover);
}

/* \u5408\u5E76\u63D0\u793A\u5173\u95ED\u6001\uFF1A\u865A\u7EBF\u7070\u5B57 */
.ng-layout-tools__btn.is-off {
    border-style: dashed;
    color: var(--text-faint);
}

/* ---------------------------------------------------------------------------
 * Inline editor panels (M1b)
 * ------------------------------------------------------------------------- */

.ng-editor {
    position: absolute;
    z-index: 20;
    width: 320px;
    max-height: 70%;
    overflow-y: auto;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--interactive-accent);
    background: var(--background-primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: default;
}

.ng-editor__heading {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
    font-weight: 600;
    /* \u6807\u9898\u680F\u5373\u9762\u677F\u62D6\u62FD\u628A\u624B\uFF08_placeEditor \u6302 pointerdown\uFF09 */
    cursor: move;
    user-select: none;
}

.ng-editor input[type="text"],
.ng-editor textarea,
.ng-editor select {
    width: 100%;
    box-sizing: border-box;
    font-size: var(--font-ui-small);
    background: var(--background-secondary);
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 4px 6px;
}

.ng-editor textarea {
    resize: none;
    overflow: hidden;
    font-family: inherit;
}

.ng-editor__turn-row,
.ng-editor__effect-row,
.ng-editor__option-head {
    display: flex;
    gap: 4px;
    align-items: flex-start;
    margin-bottom: 4px;
}

.ng-editor__speaker {
    flex: 0 0 90px;
}

.ng-editor__effect-op {
    flex: 0 0 90px;
}

.ng-editor__effects {
    margin: 4px 0 4px 12px;
}

.ng-editor__option-row {
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 6px;
    margin-bottom: 6px;
}

.ng-editor__row-del {
    flex: 0 0 auto;
    padding: 2px 8px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
}

.ng-editor__row-del:hover {
    color: var(--text-error);
}

.ng-editor__row-add {
    align-self: flex-start;
    padding: 2px 10px;
    font-size: var(--font-ui-smaller);
    border-radius: 4px;
    border: 1px dashed var(--background-modifier-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
}

.ng-editor__footer {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    margin-top: 4px;
    /* \u9762\u677F\u5185\u5BB9\u8D85\u9AD8\u6EDA\u52A8\u65F6 footer \u5E38\u9A7B\u5E95\u90E8\u53EF\u89C1\uFF08\u786E\u5B9A/\u53D6\u6D88\u59CB\u7EC8\u70B9\u5F97\u5230\uFF09 */
    position: sticky;
    bottom: 0;
    background: var(--background-primary);
    padding-top: 4px;
}

.ng-editor--link {
    width: 280px;
}

/* ---------------------------------------------------------------------------
 * Type-colored headers (M1b UAT #1: border-only was too subtle \u2014 fill the
 * title bar with the type color, translucent so themes still show through)
 * ------------------------------------------------------------------------- */

.ng-node__header {
    border-radius: 7px 7px 0 0;
}

.ng-node--entry .ng-node__header {
    background: color-mix(in srgb, var(--color-green) 32%, transparent);
}

.ng-node--content .ng-node__header {
    background: var(--background-modifier-hover);
}

.ng-node--dialog .ng-node__header {
    background: color-mix(in srgb, var(--color-blue) 32%, transparent);
}

.ng-node--choice .ng-node__header {
    background: color-mix(in srgb, var(--color-yellow) 32%, transparent);
}

.ng-node--end .ng-node__header {
    background: color-mix(in srgb, var(--color-red) 32%, transparent);
}

.ng-node--unsupported .ng-node__header {
    background: var(--background-modifier-border);
}

/* ---------------------------------------------------------------------------
 * M4: \u62D6\u62FD\u5408\u5E76\u786E\u8BA4\u6C14\u6CE1\uFF08\u7EAF DOM \u8986\u76D6\u5C42\uFF0C\u4E0D\u53C2\u4E0E pointer \u624B\u52BF\u94FE\uFF09
 * ------------------------------------------------------------------------- */

.ng-merge-bubble {
    position: absolute;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--interactive-accent);
    background: var(--background-primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
}

.ng-merge-bubble__text {
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ng-merge-bubble__btn {
    padding: 2px 10px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-normal);
    cursor: pointer;
}

.ng-merge-bubble__btn:hover {
    background: var(--background-modifier-hover);
}

.ng-merge-bubble__btn--ok {
    background: color-mix(in srgb, var(--interactive-accent) 20%, var(--background-secondary));
    border-color: color-mix(in srgb, var(--interactive-accent) 45%, var(--background-modifier-border));
    font-weight: 600;
}

/* ---------------------------------------------------------------------------
 * Marquee selection rect (M1b UAT: left-drag on empty canvas = box select)
 * ------------------------------------------------------------------------- */

.ng-marquee {
    position: absolute;
    z-index: 15;
    border: 1px solid var(--interactive-accent);
    background: color-mix(in srgb, var(--interactive-accent) 15%, transparent);
    pointer-events: none;
}

/* Text selection must never fight drags (pointerdown preventDefault is
 * forbidden \u2014 see canvas-view.js UAT root-cause note) */
.ng-canvas {
    user-select: none;
}

/* ---------------------------------------------------------------------------
 * Debug overlay (window.__ngDebug = true): port anchors + edge midpoints
 * ------------------------------------------------------------------------- */

.ng-debug__from {
    fill: var(--color-green);
    pointer-events: none;
}

.ng-debug__to {
    fill: var(--color-orange);
    pointer-events: none;
}

.ng-debug__mid {
    stroke: var(--color-purple);
    stroke-width: 2;
    pointer-events: none;
}

/* ---------------------------------------------------------------------------
 * Variables panel (M2a, NG-06): global Variables.md editable grid
 * ------------------------------------------------------------------------- */

.ng-vars-panel {
    position: absolute;
    top: 40px;
    right: 8px;
    z-index: 10;
    width: 420px;
    max-height: 70%;
    overflow-y: auto;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    cursor: default;
}

.ng-vars-panel--hidden {
    display: none;
}

.ng-vars-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.ng-vars-panel__title {
    font-size: var(--font-ui-smaller);
    font-weight: 600;
    color: var(--text-faint);
}

.ng-vars-panel__close,
.ng-vars-panel__del {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
}

.ng-vars-panel__close:hover,
.ng-vars-panel__del:hover {
    color: var(--text-normal);
}

.ng-vars-panel__grid {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-ui-smaller);
}

.ng-vars-panel__grid th {
    text-align: left;
    color: var(--text-faint);
    font-weight: 600;
    padding: 2px 4px;
}

.ng-vars-panel__grid td {
    padding: 2px 4px;
}

.ng-vars-panel__grid input[type="text"],
.ng-vars-panel__grid select {
    width: 100%;
    box-sizing: border-box;
    font-size: var(--font-ui-smaller);
}

.ng-vars-panel__footer {
    margin-top: 6px;
}

.ng-vars-panel__add {
    padding: 2px 10px;
    font-size: var(--font-ui-smaller);
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-normal);
    cursor: pointer;
}

.ng-vars-panel__add:hover {
    background: var(--background-modifier-hover);
}

.ng-vars-panel__warnings {
    margin-top: 6px;
    color: var(--text-warning, var(--color-yellow));
    font-size: var(--font-ui-smaller);
    white-space: pre-wrap;
}


/* ---------------------------------------------------------------------------
 * M2b (NG-07): condition builder + speaker autocomplete
 * ------------------------------------------------------------------------- */

.ng-cond {
    margin: 4px 0;
    font-size: var(--font-ui-smaller);
}

.ng-cond__row {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 4px;
}

.ng-cond__clause-type {
    flex: 0 0 64px;
}

.ng-cond__key {
    flex: 1 1 80px;
    min-width: 60px;
}

.ng-cond__op {
    flex: 0 0 76px;
}

.ng-cond__value {
    flex: 1 1 70px;
    min-width: 50px;
    display: flex;
}

.ng-cond__val {
    width: 100%;
}

.ng-cond__periods {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
}

.ng-cond__period {
    display: flex;
    gap: 3px;
    align-items: center;
    color: var(--text-muted);
}

.ng-cond__del {
    flex: 0 0 auto;
    padding: 2px 8px;
    border: none;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
}

.ng-cond__del:hover {
    color: var(--text-error);
}

.ng-cond__bar {
    display: flex;
    gap: 6px;
    align-items: center;
}

.ng-cond__add,
.ng-cond__comb {
    padding: 2px 10px;
    font-size: var(--font-ui-smaller);
    border-radius: 4px;
    border: 1px dashed var(--background-modifier-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
}

.ng-cond__add:hover,
.ng-cond__comb:hover {
    color: var(--text-normal);
    border-color: var(--text-muted);
}

.ng-cond__note {
    color: var(--text-warning, var(--color-yellow));
    margin: 2px 0;
}

.ng-cond__raw {
    margin-top: 4px;
}

.ng-cond__raw summary {
    color: var(--text-faint);
    cursor: pointer;
    font-size: var(--font-ui-smaller);
}

/* Speaker autocomplete dropdown (inside the turn-row, anchored below the
 * speaker input) */
.ng-editor__turn-row {
    position: relative;
}

.ng-ac {
    position: absolute;
    z-index: 25;
    top: 100%;
    left: 0;
    min-width: 90px;
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.ng-ac__item {
    padding: 3px 8px;
    color: var(--text-normal);
    cursor: pointer;
}

.ng-ac__item:hover,
.ng-ac__item--active {
    background: var(--background-modifier-hover);
}
`});var{Plugin:os,Notice:K}=require("obsidian"),{NarrativeGraphView:et,VIEW_TYPE_NARRATIVE_GRAPH:Kn}=Yn(),{DEFAULT_SETTINGS:ss,NarrativeGraphSettingTab:as}=Gn(),ie=ee(),ls=Wn(),ds="narrative-graph-styles";module.exports=class extends os{async onload(){console.log("[Narrative Graph] loaded v"+this.manifest.version),await this.loadSettings(),this.addSettingTab(new as(this.app,this));let e=document.createElement("style");e.id=ds,e.textContent=ls,document.head.appendChild(e),this.register(()=>e.remove()),this.registerView(Kn,t=>{let i=new et(t);return i.plugin=this,i}),this.registerExtensions(["ncanvas"],Kn),this.addCommand({id:"merge-file-variables",name:"\u5C06\u5F53\u524D\u5BF9\u8BDD\u7684\u5C40\u90E8\u53D8\u91CF\u5E76\u5165\u5168\u5C40\u8868",callback:()=>this.mergeFileVariablesIntoGlobal()}),this.addCommand({id:"toggle-layout",name:"\u5207\u6362\u6392\u5E03\u5C40\uFF08\u6A2A\u6392 \u21C4 \u65B9\u5F62\uFF09",callback:()=>this._graphViewAction(t=>t.applyLayoutMode("toggle"))}),this.addCommand({id:"layout-row",name:"\u6392\u5E03\u8BBE\u4E3A\u6A2A\u6392\uFF08\u5DF2\u662F\u6A2A\u6392\u65F6\u6D88\u9664\u91CD\u53E0\uFF09",callback:()=>this._graphViewAction(t=>t.applyLayoutMode("row"))}),this.addCommand({id:"layout-square",name:"\u6392\u5E03\u8BBE\u4E3A\u65B9\u5F62\uFF08\u5DF2\u662F\u65B9\u5F62\u65F6\u6D88\u9664\u91CD\u53E0\uFF09",callback:()=>this._graphViewAction(t=>t.applyLayoutMode("square"))}),this.addCommand({id:"tidy-sizes",name:"\u6574\u7406\u6846\u4F53\u5C3A\u5BF8\uFF08\u4E00\u952E\u9002\u914D\u5168\u90E8\u5361\u7247\uFF09",callback:()=>this._graphViewAction(t=>t.tidyNodeSizes())}),this.addCommand({id:"repair-canvas",name:"\u4FEE\u590D\u753B\u5E03\u7ED3\u6784\uFF08\u60AC\u7A7A\u8FDE\u7EBF\uFF09",callback:()=>this._graphViewAction(t=>t.repairCanvas())}),this.addCommand({id:"merge-overlapping",name:"\u5408\u5E76\u5F53\u524D\u91CD\u53E0\u7684\u540C\u7C7B\u8282\u70B9",callback:()=>this._graphViewAction(t=>t.mergeOverlappingNodes())})}async loadSettings(){this.settings=Object.assign({},ss,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}_activeGraphView(){if(typeof this.app.workspace.getActiveViewOfType=="function"){let t=this.app.workspace.getActiveViewOfType(et);if(t)return t}let e=this.app.workspace.activeLeaf;return e&&e.view instanceof et?e.view:null}_graphViewAction(e){let t=this._activeGraphView();if(!t||!t._state||!t._state.project){new K("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A .ncanvas \u5BF9\u8BDD\u6587\u4EF6");return}e(t)}async mergeFileVariablesIntoGlobal(){let e=this._activeGraphView();if(!e||!e._state||!e._state.project){new K("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A .ncanvas \u5BF9\u8BDD\u6587\u4EF6");return}let t=e._state.project,i=t.variables&&typeof t.variables=="object"?t.variables:{};if(Object.keys(i).length===0){new K("\u5F53\u524D\u6587\u4EF6\u6CA1\u6709\u5C40\u90E8\u53D8\u91CF\u53EF\u5E76\u5165");return}try{let r=this.settings.variablesPath&&this.settings.variablesPath.trim()||ie.DEFAULT_VARIABLES_PATH,o=this.app.vault.getAbstractFileByPath(r),s;o?s=await this.app.vault.read(o):(s=ie.EMPTY_VARIABLES_FILE,await this.app.vault.create(r,s),o=this.app.vault.getAbstractFileByPath(r));let{entries:a}=ie.parseVariablesTable(s),l=ie.mergeFileVariables(a,i);if(l.length===0){new K("\u6240\u6709\u5C40\u90E8\u53D8\u91CF\u5DF2\u5B58\u5728\u4E8E\u5168\u5C40\u8868\uFF0C\u65E0\u9700\u5E76\u5165");return}let c=ie.serializeVariablesTable(s,a.concat(l));await this.app.vault.modify(o,c);for(let d of l)delete t.variables[d.name];e._afterMutation(),new K(`\u5DF2\u5E76\u5165 ${l.length} \u4E2A\u53D8\u91CF\u5230 ${r}\uFF1A`+l.map(d=>d.name).join("\u3001"))}catch(r){console.warn("[Narrative Graph] \u5408\u5E76\u53D8\u91CF\u5931\u8D25:",r.message),new K(`\u5408\u5E76\u53D8\u91CF\u5931\u8D25\uFF1A${r.message}`)}}};
