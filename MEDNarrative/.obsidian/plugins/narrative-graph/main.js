// narrative-graph v0.1.0 - Narrative Toolchain
var b=(n,e)=>()=>{try{return e||n((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};var U=b((ys,Re)=>{var yn=Object.freeze(["Entry","Content","Dialog","Choice","End"]),bn=Object.freeze(["Marker","Event"]),vn="End",xn=Object.freeze(["set","add","subtract","toggle"]),En=Object.freeze({input:Object.freeze({side:"left",t:.5}),output:Object.freeze({side:"right",t:.5})});function wn(){return{input:{side:"left",t:.5},output:{side:"right",t:.5}}}Re.exports={SAVED_STATE_VERSION:1,NODE_TYPES:yn,ENGINE_ONLY_NODE_TYPES:bn,END_NODE_TYPE:vn,EFFECT_OPS:xn,DEFAULT_PORTS:En,defaultPorts:wn}});var Ye=b((bs,Ue)=>{var{SAVED_STATE_VERSION:He}=U(),kn=Object.freeze(["id","type","title","body","x","y","choices","choiceOptions","choiceRevealMode","cast","turns","customFields","ports","frameId","width","height"]),Cn=Object.freeze(["id","from","to","choiceIndex","choiceOptionId","label","requirements","toPort"]);function O(n){return n!==null&&typeof n=="object"&&!Array.isArray(n)}function Sn(n){return n===void 0?void 0:JSON.parse(JSON.stringify(n))}function Be(n){let e=[];if(!O(n))return["saved-state root must be an object"];if(n.version!==He&&e.push(`saved-state version must be ${He}, got ${JSON.stringify(n.version)}`),!O(n.project))return e.push("missing project object"),e;let t=n.project;if(!Array.isArray(t.nodes))return e.push("missing project.nodes array"),e;let i=t.links||[];if(!Array.isArray(i))return e.push("project.links must be an array"),e;let r=new Set;for(let s of t.nodes){if(!O(s)){e.push("project.nodes contains a non-object entry");continue}let o=s.id!==void 0?`'${s.id}'`:"(missing id)";if(typeof s.id!="string"||s.id.length===0){e.push(`node ${o}: missing or invalid id`);continue}r.has(s.id)&&e.push(`node '${s.id}': duplicate node id`),r.add(s.id),(typeof s.type!="string"||s.type.length===0)&&e.push(`node '${s.id}': missing or invalid type`)}for(let s of i){if(!O(s)){e.push("project.links contains a non-object entry");continue}let o=s.id!==void 0?`'${s.id}'`:"(missing id)";(typeof s.id!="string"||s.id.length===0)&&e.push(`link ${o}: missing or invalid id`),r.has(s.from)||e.push(`link ${o}: 'from' references unknown node '${s.from}'`),r.has(s.to)||e.push(`link ${o}: 'to' references unknown node '${s.to}'`)}return e}function Nn(n){let e;if(typeof n=="string")try{e=JSON.parse(n)}catch(t){throw new SyntaxError(`Invalid .ncanvas JSON: ${t.message}`)}else if(O(n))e=n;else throw new SyntaxError("Invalid .ncanvas: input must be JSON text or an object");return{state:e,errors:Be(e)}}function In(n){let e=O(n)&&O(n.state)?n.state:n;if(!O(e)||!O(e.project))throw new Error("Cannot serialize: not a saved-state object");let t=Sn(e);return JSON.stringify(t,null,2)}Ue.exports={parseSavedState:Nn,serializeSavedState:In,validateSavedState:Be,KNOWN_NODE_FIELDS:kn,KNOWN_LINK_FIELDS:Cn}});var pe=b((vs,Ge)=>{function ue(n,e,t,i){let r=i-1;for(let s of n){if(typeof s!="string")continue;let o=s.match(e);if(o){let a=parseInt(o[1],10);a>r&&(r=a)}}return t+(r+1)}function An(n){let e=Array.isArray(n)?n.map(t=>t&&t.id):[];return ue(e,/^n(\d+)$/,"n",0)}function Ln(n){let e=Array.isArray(n)?n.map(t=>t&&t.id):[];return ue(e,/^l(\d+)$/,"l",0)}function Tn(n){let e=[];if(Array.isArray(n)){for(let t of n)if(t&&Array.isArray(t.choiceOptions))for(let i of t.choiceOptions)i&&typeof i.id=="string"&&e.push(i.id)}return ue(e,/^opt_(\d+)$/,"opt_",1)}Ge.exports={nextNodeId:An,nextLinkId:Ln,nextOptionId:Tn}});var Q=b((xs,Xe)=>{function Dn(n){return Array.isArray(n)?n.filter(e=>e&&typeof e.line=="string").map(e=>`${e.speaker}: ${e.line}`).join(`
`):""}function Pn(n,e){if(!e)return null;for(let t of[":","\uFF1A"])if(n.startsWith(e+t))return n.slice(e.length+1).replace(/^\s+/,"");return null}function Mn(n){if(!n||typeof n!="object")return[];if(Array.isArray(n.turns)&&n.turns.length>0)return n.turns;let e=typeof n.body=="string"?n.body:"";if(e.trim().length===0)return[];let t=(typeof n.title=="string"?n.title:"").trim(),i=[];for(let r of e.split(`
`)){if(r.trim().length===0)continue;let s=Pn(r,t);i.push({speaker:t,line:s!==null?s:r})}return i}Xe.exports={flattenTurns:Dn,deriveTurns:Mn}});var fe=b((Es,Je)=>{var We=Object.freeze(["left","right","top","bottom"]);function Ke(n){return We.includes(n)}function zn(n){if(!n||typeof n!="object"||!Ke(n.side))return null;let e=Number.isFinite(n.t)?Math.min(1,Math.max(0,n.t)):.5;return{side:n.side,t:e}}Je.exports={PORT_SIDES:We,isPortSide:Ke,normalizePort:zn}});var it=b((ws,nt)=>{var{NODE_TYPES:On,END_NODE_TYPE:qn,defaultPorts:Ze}=U(),{nextNodeId:Vn,nextLinkId:Fn,nextOptionId:Qe}=pe(),{flattenTurns:$n}=Q(),{PORT_SIDES:ge,normalizePort:jn}=fe(),et=Object.freeze({Entry:"Start",Content:"Content",Dialog:"Dialog",Choice:"Choice",End:"End"}),ee=Object.freeze({Dialog:200});function Rn(n){return ee[n]||260}function tt(n){if(!n||typeof n!="object"||!n.project)throw new Error("ops: not a saved-state object");return n.project}function te(n){let e=tt(n);return Array.isArray(e.nodes)||(e.nodes=[]),e.nodes}function ne(n){let e=tt(n);return Array.isArray(e.links)||(e.links=[]),e.links}function H(n,e){return te(n).find(t=>t&&t.id===e)}function _e(n,e){return ne(n).find(t=>t&&t.id===e)}function me(n){return te(n).filter(e=>e&&e.type==="Entry")}function Hn(n,e,t,i){if(!On.includes(e))throw new Error(`addNode: unsupported node type '${e}'`);let r=te(n);if(e==="Entry"&&me(n).length>0)throw new Error("addNode: file already has an Entry node");let s={id:Vn(r),type:e,title:et[e],body:"",x:Number.isFinite(t)?Math.round(t):0,y:Number.isFinite(i)?Math.round(i):0};if(ee[e]&&(s.width=ee[e]),r.push(s),e==="Dialog")s.turns=[{speaker:"",line:""}];else if(e==="Choice"){s.choices=[],s.choiceOptions=[];for(let o=0;o<2;o++)s.choiceOptions.push({id:Qe(r),label:"",requires:"",effects:[]}),s.choices.push("")}return s}function Bn(n,e){let t=te(n),i=t.findIndex(a=>a&&a.id===e);if(i<0)throw new Error(`deleteNode: unknown node '${e}'`);if(t[i].type==="Entry"&&me(n).length<=1)throw new Error("deleteNode: cannot delete the last Entry node");t.splice(i,1);let s=ne(n),o=s.filter(a=>a&&a.from!==e&&a.to!==e);s.length=0,s.push(...o)}function Un(n,e,t,i){let r=H(n,e);if(!r)throw new Error(`moveNode: unknown node '${e}'`);r.x=Number.isFinite(t)?Math.round(t):r.x,r.y=Number.isFinite(i)?Math.round(i):r.y}function Yn(n,e,t){let i=H(n,e);if(!i)throw new Error(`resizeNode: unknown node '${e}'`);i.x=Math.round(t.x),i.y=Math.round(t.y),i.width=Math.round(t.width),i.height=Math.round(t.height),i.manualSize=!0}function Gn(n,e,t){let i=H(n,e);if(!i)throw new Error(`setNodeTitle: unknown node '${e}'`);i.title=String(t??"")}function Xn(n,e,t){let i=H(n,e);if(!i)throw new Error(`setNodeBody: unknown node '${e}'`);i.body=String(t??"")}function Wn(n,e){if(!n||typeof n!="object")throw new Error("setTurns: not a node object");let t=(Array.isArray(e)?e:[]).map(i=>({speaker:String(i&&i.speaker!=null?i.speaker:"").trim(),line:String(i&&i.line!=null?i.line:"").trim()})).filter(i=>i.speaker.length>0||i.line.length>0);n.turns=t,n.body=$n(t)}function Kn(n,e,t){if(!n||typeof n!="object")throw new Error("setChoiceOptions: not a node object");let i=Array.isArray(t)?t:[n],r=new Map((Array.isArray(n.choiceOptions)?n.choiceOptions:[]).filter(o=>o&&typeof o.id=="string").map(o=>[o.id,o])),s=[];for(let o of Array.isArray(e)?e:[]){let a=o&&typeof o.id=="string"&&r.has(o.id)?r.get(o.id):{id:Qe([...i,{choiceOptions:s}])};a.label=String(o&&o.label!=null?o.label:""),a.requires=String(o&&o.requires!=null?o.requires:""),a.effects=(Array.isArray(o&&o.effects)?o.effects:[]).filter(l=>l&&typeof l=="object").map(l=>({trigger:String(l.trigger||"onChoose"),op:String(l.op||"set"),key:String(l.key!=null?l.key:""),value:String(l.value!=null?l.value:"")})),s.push(a)}n.choiceOptions=s,n.choices=s.map(o=>o.label)}function Jn(n,e,t,i,r){let s=H(n,e),o=H(n,t);if(!s)throw new Error(`addLink: unknown source node '${e}'`);if(!o)throw new Error(`addLink: unknown target node '${t}'`);if(e===t)throw new Error("addLink: self-links are not allowed");if(s.type===qn)throw new Error("addLink: End nodes have no output port");if(o.type==="Entry")throw new Error("addLink: Entry nodes have no input port");let a=ne(n),l=i!=null?String(i):null;if(a.some(h=>h&&h.from===e&&h.to===t&&(h.choiceOptionId!=null?String(h.choiceOptionId):null)===l))throw new Error("addLink: duplicate link (same from/to/choiceOptionId)");let d={id:Fn(a),from:e,to:t};if(s.type==="Choice"){if(!l)throw new Error("addLink: Choice sources require a choiceOptionId");let h=Array.isArray(s.choiceOptions)?s.choiceOptions:[],u=h.findIndex(p=>p&&p.id===l);if(u<0)throw new Error(`addLink: node '${e}' has no option '${l}'`);d.choiceOptionId=l,d.choiceIndex=u,d.label=h[u].label||""}else if(l)throw new Error("addLink: only Choice sources may carry a choiceOptionId");return r&&s.type!=="Choice"&&ge.includes(r.fromSide)&&((!s.ports||typeof s.ports!="object")&&(s.ports=Ze()),s.ports.output={side:r.fromSide,t:.5}),r&&ge.includes(r.toSide)&&((!o.ports||typeof o.ports!="object")&&(o.ports=Ze()),o.ports.input={side:r.toSide,t:.5},d.toPort={side:r.toSide,t:Number.isFinite(r.toT)?Math.min(1,Math.max(0,r.toT)):.5}),a.push(d),d}function Zn(n,e){let t=ne(n),i=t.findIndex(r=>r&&r.id===e);if(i<0)throw new Error(`deleteLink: unknown link '${e}'`);t.splice(i,1)}function Qn(n,e,t){let i=_e(n,e);if(!i)throw new Error(`setLinkRequirements: unknown link '${e}'`);let r=String(t??"").trim();r.length>0?i.requirements=r:delete i.requirements}function ei(n,e,t){let i=_e(n,e);if(!i)throw new Error(`setLinkToPort: unknown link '${e}'`);let r=jn(t);r?i.toPort=r:delete i.toPort}nt.exports={DEFAULT_TITLES:et,DEFAULT_NODE_WIDTHS:ee,PORT_SIDES:ge,defaultWidthFor:Rn,findNode:H,findLink:_e,entryNodes:me,addNode:Hn,deleteNode:Bn,moveNode:Un,resizeNode:Yn,setNodeTitle:Gn,setNodeBody:Xn,setTurns:Wn,setChoiceOptions:Kn,addLink:Jn,deleteLink:Zn,setLinkRequirements:Qn,setLinkToPort:ei}});var xe=b((ks,ot)=>{var ye=Object.freeze(["===","!==",">=","<=",">","<"]),be=0,ve=3;function ti(n){let e=[],t=0,i=s=>/[A-Za-z_$]/.test(s),r=s=>/[A-Za-z0-9_$.]/.test(s);for(;t<n.length;){let s=n[t];if(/\s/.test(s)){t++;continue}let o=n.slice(t,t+2),a=n.slice(t,t+3);if(a==="==="||a==="!=="){e.push({t:"op",v:a}),t+=3;continue}if(o==="&&"||o==="||"||o===">="||o==="<="||o==="=="){e.push({t:o==="=="?"badop":"op",v:o}),t+=2;continue}if(s===">"||s==="<"){e.push({t:"op",v:s}),t++;continue}if(s==="!"){e.push({t:"!"}),t++;continue}if(s==="("){e.push({t:"("}),t++;continue}if(s===")"){e.push({t:")"}),t++;continue}if(s===","){e.push({t:","}),t++;continue}if(s==='"'||s==="'"){let l=s,c=t+1,d="",h=!1;for(;c<n.length;){let u=n[c];if(u==="\\"&&c+1<n.length){let p=n[c+1];p==="n"?d+=`
`:p==="t"?d+="	":d+=p,c+=2;continue}if(u===l){h=!0,c++;break}d+=u,c++}if(!h)return null;e.push({t:"string",value:d}),t=c;continue}if(/[0-9]/.test(s)||s==="-"&&/[0-9]/.test(n[t+1]||"")){let l=t+(s==="-"?1:0);for(;l<n.length&&/[0-9.]/.test(n[l]);)l++;let c=Number(n.slice(t,l));if(Number.isNaN(c))return null;e.push({t:"number",value:c}),t=l;continue}if(i(s)){let l=t;for(;l<n.length&&r(n[l]);)l++;let c=n.slice(t,l);c==="true"||c==="false"?e.push({t:"bool",value:c==="true"}):e.push({t:"ident",v:c}),t=l;continue}return null}return e}function ni(n){let e=0,t=()=>n[e],i=()=>n[e++];function r(){return s()}function s(){let h=o();if(!h)return null;for(;t()&&t().t==="op"&&t().v==="||";){i();let u=o();if(!u)return null;h={type:"logical",operator:"||",left:h,right:u}}return h}function o(){let h=a();if(!h)return null;for(;t()&&t().t==="op"&&t().v==="&&";){i();let u=a();if(!u)return null;h={type:"logical",operator:"&&",left:h,right:u}}return h}function a(){let h=t();if(!h)return null;if(h.t==="!"){i();let u=a();return u?{type:"unary",operator:"!",argument:u}:null}if(h.t==="("){i();let u=r();return!u||!t()||t().t!==")"?null:(i(),{type:"group",expression:u})}return l()}function l(){let h=c();if(!h)return null;let u=t();if(u&&u.t==="op"&&ye.includes(u.v)){i();let p=c();return p?{type:"binary",operator:u.v,left:h,right:p}:null}return u&&u.t==="badop"?null:h}function c(){let h=t();if(!h)return null;if(h.t==="ident"){if(i(),t()&&t().t==="("){i();let u=[];if(t()&&t().t!==")")for(;;){let p=c();if(!p||p.type!=="literal")return null;if(u.push(p),t()&&t().t===","){i();continue}break}return!t()||t().t!==")"?null:(i(),{type:"call",name:h.v,args:u})}return{type:"identifier",path:h.v}}return h.t==="number"?(i(),{type:"literal",kind:"number",value:h.value}):h.t==="string"?(i(),{type:"literal",kind:"string",value:h.value}):h.t==="bool"?(i(),{type:"literal",kind:"bool",value:h.value}):null}let d=r();return!d||e!==n.length?null:d}function Y(n){if(!n||n.type!=="call"||n.name!=="at_period"||n.args.length!==1)return null;let e=n.args[0];if(e.kind!=="number")return null;let t=e.value;return Number.isInteger(t)&&t>=be&&t<=ve?t:null}function ie(n,e){return n.type==="logical"&&n.operator===e?[...ie(n.left,e),...ie(n.right,e)]:[n]}function ii(n){return!n||n.type!=="literal"?null:n.kind==="bool"?n.value?"true":"false":n.kind==="number"?String(n.value):JSON.stringify(n.value)}function rt(n){if(!n)return null;if(n.type==="identifier")return{type:"state",key:n.path,op:"truthy",value:""};if(n.type==="unary"&&n.operator==="!"&&n.argument.type==="identifier")return{type:"state",key:n.argument.path,op:"falsy",value:""};if(n.type==="call"){let e=Y(n);return e===null?null:{type:"period",periods:[e]}}if(n.type==="binary"){if(n.left.type!=="identifier")return null;let e=ii(n.right);return e===null?null:{type:"state",key:n.left.path,op:n.operator,value:e}}if(n.type==="group"){let e=n.expression,t=e.type==="logical"&&e.operator==="||"?ie(e,"||"):[e];return t.length===0||t.some(i=>Y(i)===null)?null:{type:"period",periods:t.map(Y)}}return null}function ri(n){if(n.type==="logical"){let t=ie(n,n.operator);if(n.operator==="||"&&t.every(r=>Y(r)!==null))return{clauses:[{type:"period",periods:t.map(Y)}],combinator:"&&"};let i=t.map(rt);return i.some(r=>r===null)?null:{clauses:i,combinator:n.operator}}let e=rt(n);return e?{clauses:[e],combinator:"&&"}:null}function si(n){let e=String(n??"").trim();if(!e)return{clauses:[],combinator:"&&"};let t=ti(e);if(!t||t.length===0)return{raw:e};let i=ni(t);if(!i)return{raw:e};let r=ri(i);return r?{clauses:oi(r.clauses),combinator:r.combinator}:{raw:e}}function oi(n){return n.map(e=>e.type==="period"?{type:"period",periods:st(e.periods)}:{type:"state",key:e.key,op:e.op,value:e.value})}function st(n){let e=Array.isArray(n)?n:[n];return[...new Set(e.map(Number).filter(t=>Number.isInteger(t)&&t>=be&&t<=ve))].sort((t,i)=>t-i)}function ai(n){return!n||!Array.isArray(n.clauses)?n&&typeof n.raw=="string"?n.raw:"":n.clauses.map(li).filter(Boolean).join(n.combinator==="||"?" || ":" && ")}function li(n){if(!n)return"";if(n.type==="period"){let i=st(n.periods);if(i.length===0)return"";let r=i.map(s=>`at_period(${s})`);return r.length===1?r[0]:`(${r.join(" || ")})`}let e=String(n.key||"").trim();if(!e)return"";if(n.op==="truthy")return e;if(n.op==="falsy")return`!${e}`;if(!ye.includes(n.op))return"";let t=String(n.value===void 0||n.value===null?"":n.value).trim();return t?`${e} ${n.op} ${t}`:""}function di(n,e){if(n==="bool")return e===!0||e==="true"?"true":e===!1||e==="false"?"false":null;if(n==="number"){let t=String(e).trim();return t!==""&&!Number.isNaN(Number(t))?String(Number(t)):null}return JSON.stringify(String(e??""))}ot.exports={STATE_OPS:ye,PERIOD_MIN:be,PERIOD_MAX:ve,parseCondition:si,serializeCondition:ai,formatConditionLiteral:di}});var ct=b((Cs,dt)=>{var{nextNodeId:ci,nextLinkId:hi,nextOptionId:ui}=pe(),pi=xe(),Ee="narrativeGraphClipboard",we=1;function re(n){return n===void 0?void 0:JSON.parse(JSON.stringify(n))}function fi(n,e){let t=n&&n.project,i=t&&Array.isArray(t.nodes)?t.nodes:[],r=t&&Array.isArray(t.links)?t.links:[],s=new Set(Array.isArray(e)?e:[]);if(s.size===0)return null;let o=i.filter(l=>l&&s.has(l.id)).map(l=>re(l));if(o.length===0)return null;let a=r.filter(l=>l&&s.has(l.from)&&s.has(l.to)).map(l=>re(l));return{[Ee]:we,nodes:o,links:a}}function gi(n){if(typeof n!="string"||n.trim()==="")return null;let e;try{e=JSON.parse(n)}catch{return null}return!e||typeof e!="object"||Array.isArray(e)||e[Ee]!==we||!Array.isArray(e.nodes)?null:e}var _i=/\b(?:flag|res)_[A-Za-z0-9_]+/g;function at(n){let e=[],t=String(n||"").trim();if(!t)return e;let i=pi.parseCondition(t);if(Array.isArray(i.clauses)){for(let s of i.clauses)s.type==="state"&&s.key&&e.push(s.key);return e}return t.match(_i)||[]}function lt(n){let e=new Set,t=[],i=r=>{let s=String(r||"").trim();s&&!e.has(s)&&(e.add(s),t.push(s))};for(let r of n&&Array.isArray(n.links)?n.links:[])for(let s of at(r&&r.requirements))i(s);for(let r of n&&Array.isArray(n.nodes)?n.nodes:[]){let s=r&&Array.isArray(r.choiceOptions)?r.choiceOptions:[];for(let o of s){for(let a of at(o&&o.requires))i(a);for(let a of o&&Array.isArray(o.effects)?o.effects:[])a&&a.key&&i(a.key)}}return t}function mi(n,e,t){let i=n&&n.project;if(!i||typeof i!="object")throw new Error("applyPaste: not a saved-state object");Array.isArray(i.nodes)||(i.nodes=[]),Array.isArray(i.links)||(i.links=[]);let r=e&&Array.isArray(e.nodes)?e.nodes:[],s=e&&Array.isArray(e.links)?e.links:[];for(let _ of r)if(!_||typeof _.id!="string"||typeof _.type!="string")throw new Error("applyPaste: envelope node missing id/type");if(r.length===0)return{addedNodeIds:[],addedLinkIds:[],missingVariables:[],downgradedEntry:0};let o=t||{},a=1/0,l=1/0,c=-1/0,d=-1/0;for(let _ of r){let m=Number.isFinite(_.x)?_.x:0,N=Number.isFinite(_.y)?_.y:0;m<a&&(a=m),N<l&&(l=N),m>c&&(c=m),N>d&&(d=N)}let h,u;o.center&&Number.isFinite(o.center.x)&&Number.isFinite(o.center.y)?(h=o.center.x-(a+c)/2,u=o.center.y-(l+d)/2):(h=40,u=40);let p=new Map,f=new Map,C=[...i.nodes],D=[...i.links],S=!i.nodes.some(_=>_&&_.type==="Entry"),K=0,P=[];for(let _ of r){let m=re(_),N=ci(C);if(p.set(_.id,N),m.id=N,m.x=Math.round((Number.isFinite(m.x)?m.x:0)+h),m.y=Math.round((Number.isFinite(m.y)?m.y:0)+u),m.type==="Entry"&&(S?S=!1:(m.type="Content",K++)),C.push(m),Array.isArray(m.choiceOptions)){for(let w of m.choiceOptions)if(w&&typeof w.id=="string"){let L=ui(C);f.set(w.id,L),w.id=L}}i.nodes.push(m),P.push(N)}let J=[];for(let _ of s){if(!_||!p.has(_.from)||!p.has(_.to))continue;let m=re(_);if(m.id=hi(D),m.from=p.get(_.from),m.to=p.get(_.to),m.choiceOptionId!=null){let N=f.get(String(m.choiceOptionId));if(!N)continue;m.choiceOptionId=N}D.push(m),i.links.push(m),J.push(m.id)}let E=new Set(Array.isArray(o.knownVariables)?o.knownVariables:[]),y=lt(e).filter(_=>!E.has(_));return{addedNodeIds:P,addedLinkIds:J,missingVariables:y,downgradedEntry:K}}dt.exports={CLIPBOARD_MARKER:Ee,CLIPBOARD_VERSION:we,encodeSelection:fi,parseEnvelopeText:gi,referencedVariables:lt,applyPaste:mi}});var ut=b((Ss,ht)=>{function yi(n){return{cap:Number.isFinite(n)&&n>0?Math.floor(n):50,undo:[],redo:[]}}function bi(n){let e=n&&n.ui&&typeof n.ui=="object"?n.ui:{};return structuredClone({project:n&&n.project,ui:{selectedNodeId:e.selectedNodeId!=null?e.selectedNodeId:null,selectedLinkId:e.selectedLinkId!=null?e.selectedLinkId:null}})}function vi(n,e){for(n.undo.push(e);n.undo.length>n.cap;)n.undo.shift();n.redo.length=0}function xi(n,e){return n.undo.length===0?null:(n.redo.push(e),{snapshot:n.undo.pop()})}function Ei(n,e){return n.redo.length===0?null:(n.undo.push(e),{snapshot:n.redo.pop()})}ht.exports={DEFAULT_CAP:50,createHistory:yi,takeSnapshot:bi,push:vi,undo:xi,redo:Ei}});var se=b((Ns,kt)=>{function Ce(n){return!Number.isFinite(n)||n<=0?1:Math.min(2.5,Math.max(.15,n))}function wi(n,e){return{x:n.x*e.scale+e.x,y:n.y*e.scale+e.y}}function pt(n,e){return{x:(n.x-e.x)/e.scale,y:(n.y-e.y)/e.scale}}function ki(n,e,t){let i=Ce(n.scale*t),r=pt(e,n);return{x:e.x-r.x*i,y:e.y-r.y*i,scale:i}}function Se(n,e){let t=Number.isFinite(n.width)&&n.width>0?n.width:260;if(n.manualSize&&Number.isFinite(n.height)&&n.height>0)return{width:t,height:n.height};let i=Number.isFinite(e)&&e>0?e:ft(n);return{width:t,height:i}}function ft(n){let e=Number.isFinite(n.width)&&n.width>0?n.width:260,t=Math.max(10,Math.floor((e-24)/13)),i=typeof n.body=="string"?n.body:"",r=0;for(let s of i.split(`
`))r+=Math.max(1,Math.ceil(s.length/t));return Array.isArray(n.choiceOptions)&&n.choiceOptions.length>0&&(r+=n.choiceOptions.length),34+Math.max(1,r)*20+16}function ke(n){switch(n){case"left":return{x:-1,y:0};case"right":return{x:1,y:0};case"top":return{x:0,y:-1};case"bottom":return{x:0,y:1};default:return{x:1,y:0}}}function Ci(n,e,t,i){let r=t||"left",s=Number.isFinite(i)?Math.min(1,Math.max(0,i)):.5;switch(r){case"left":return{x:n.x,y:n.y+e.height*s,side:r};case"right":return{x:n.x+e.width,y:n.y+e.height*s,side:r};case"top":return{x:n.x+e.width*s,y:n.y,side:r};case"bottom":return{x:n.x+e.width*s,y:n.y+e.height,side:r};default:return{x:n.x+e.width,y:n.y+e.height*.5,side:"right"}}}function Si(n,e){let t=n||"left",i=Number.isFinite(e)?Math.min(1,Math.max(0,e)):.5;switch(t){case"left":return{x:0,y:i};case"right":return{x:1,y:i};case"top":return{x:i,y:0};case"bottom":return{x:i,y:1};default:return{x:1,y:.5}}}var gt=Object.freeze(["top","right","bottom","left"]),Ni=Object.freeze({left:"right",right:"left",top:"bottom",bottom:"top"});function Ii(n){return Ni[n]||"left"}function Ai(n){let e=[];for(let t of gt){let i=[];for(let r of["input","output"]){let s=n&&n[r];if(s&&s.side===t){let o=Number.isFinite(s.t)?Math.min(1,Math.max(0,s.t)):.5;i.includes(o)||i.push(o)}}i.length===0&&i.push(.5);for(let r of i)e.push({side:t,t:r})}return e}function Li(n,e,t){let i=Math.abs(t.x-n.x),r=Math.abs(t.x-(n.x+e.width)),s=Math.abs(t.y-n.y),o=Math.abs(t.y-(n.y+e.height)),a="top",l=s;return r<l&&(a="right",l=r),o<l&&(a="bottom",l=o),i<l&&(a="left"),a}function Ti(n,e,t,i){let r=s=>Math.min(1,Math.max(0,s));switch(t){case"left":case"right":return r((i.y-n.y)/Math.max(1,e.height));case"top":case"bottom":return r((i.x-n.x)/Math.max(1,e.width));default:return .5}}function Di(n,e){let t=Math.abs(e.x-n.x),i=Math.abs(e.y-n.y),r=Math.min(160,Math.max(40,Math.max(t,i)/2)),s=ke(n.side),o=ke(e.side),a={x:n.x+s.x*r,y:n.y+s.y*r},l={x:e.x+o.x*r,y:e.y+o.y*r},c=`M ${n.x} ${n.y} C ${a.x} ${a.y}, ${l.x} ${l.y}, ${e.x} ${e.y}`,d={x:(n.x+3*a.x+3*l.x+e.x)/8,y:(n.y+3*a.y+3*l.y+e.y)/8};return{d:c,mid:d}}function Pi(n,e){let t=1/0,i=1/0,r=-1/0,s=-1/0;for(let o of n){if(!Number.isFinite(o.x)||!Number.isFinite(o.y))continue;let a=e?e.get(o.id):void 0,l=Se(o,a&&a.height);t=Math.min(t,o.x),i=Math.min(i,o.y),r=Math.max(r,o.x+l.width),s=Math.max(s,o.y+l.height)}return t===1/0?null:{minX:t,minY:i,maxX:r,maxY:s}}function Mi(n,e,t,i){let r=Number.isFinite(i)?i:60,s=e>0?e:800,o=t>0?t:600,a=Math.max(1,n.maxX-n.minX),l=Math.max(1,n.maxY-n.minY),c=Ce(Math.min((s-r*2)/a,(o-r*2)/l)),d=(n.minX+n.maxX)/2,h=(n.minY+n.maxY)/2;return{x:s/2-d*c,y:o/2-h*c,scale:c}}function _t(n){return!!n&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.scale)&&n.scale>0}function zi(n,e,t,i){if(!_t(n)||!e)return!1;let r=t>0?t:800,s=i>0?i:600,o=e.minX*n.scale+n.x,a=e.minY*n.scale+n.y,l=e.maxX*n.scale+n.x,c=e.maxY*n.scale+n.y;return l>=0&&c>=0&&o<=r&&a<=s}function Oi(n,e){return{x0:Math.min(n.x,e.x),y0:Math.min(n.y,e.y),x1:Math.max(n.x,e.x),y1:Math.max(n.y,e.y)}}function mt(n,e){return{x0:n.x,y0:n.y,x1:n.x+e.width,y1:n.y+e.height}}function yt(n,e){return n.x0<=e.x1&&n.x1>=e.x0&&n.y0<=e.y1&&n.y1>=e.y0}function qi(n,e,t){let i=[];for(let r of n){if(!Number.isFinite(r.x)||!Number.isFinite(r.y))continue;let s=t?t.get(r.id):void 0,o=Se(r,s&&s.height);yt(e,mt(r,o))&&i.push(r.id)}return i}var bt=40;function Vi(n,e){let t=Number.isFinite(e)&&e>0?e:bt,i=n&&Number.isFinite(n.scale)?n.scale:1,r=Math.max(2,t*i),s=n&&Number.isFinite(n.x)?n.x:0,o=n&&Number.isFinite(n.y)?n.y:0;return{backgroundPosition:`${s}px ${o}px`,backgroundSize:`${r}px ${r}px`}}var vt=120,xt=60,Et=8,wt=2;function Fi(n,e,t,i){let r=Number.isFinite(i)&&i>0?i:Et,s=wt;if(e<n.left-s||e>n.right+s||t<n.top-s||t>n.bottom+s)return null;let o=Math.abs(e-n.left),a=Math.abs(e-n.right),l=Math.abs(t-n.top),c=Math.abs(t-n.bottom),d=Math.min(o,a)<=r?o<=a?"w":"e":"",h=Math.min(l,c)<=r?l<=c?"n":"s":"";return!d&&!h?null:h+d}function $i(n){return n?n==="n"||n==="s"?"ns-resize":n==="e"||n==="w"?"ew-resize":n==="ne"||n==="sw"?"nesw-resize":"nwse-resize":""}function ji(n,e,t,i,r){let s=r&&Number.isFinite(r.width)?r.width:vt,o=r&&Number.isFinite(r.height)?r.height:xt,a=n.x,l=n.y,c=n.width,d=n.height;return e.includes("e")&&(c=Math.max(s,n.width+t)),e.includes("s")&&(d=Math.max(o,n.height+i)),e.includes("w")&&(c=Math.max(s,n.width-t),a=n.x+(n.width-c)),e.includes("n")&&(d=Math.max(o,n.height-i),l=n.y+(n.height-d)),{x:Math.round(a),y:Math.round(l),width:Math.round(c),height:Math.round(d)}}kt.exports={MIN_SCALE:.15,MAX_SCALE:2.5,ZOOM_STEP:1.1,DEFAULT_NODE_WIDTH:260,FIT_PADDING:60,GRID_SPACING:bt,MIN_NODE_WIDTH:vt,MIN_NODE_HEIGHT:xt,RESIZE_BORDER:Et,RESIZE_OUTER_SLACK:wt,SIDE_ORDER:gt,clampScale:Ce,worldToScreen:wi,screenToWorld:pt,zoomAtPoint:ki,resolveNodeSize:Se,estimateNodeHeight:ft,sideNormal:ke,portAnchor:Ci,portFraction:Si,sideHandles:Ai,oppositeSide:Ii,nearestSide:Li,sideT:Ti,applyResize:ji,resizeZoneAt:Fi,resizeCursor:$i,gridBackground:Vi,edgePath:Di,nodeBounds:Pi,fitView:Mi,isValidStoredView:_t,viewIntersectsBounds:zi,normalizeRect:Oi,nodeRect:mt,rectsIntersect:yt,nodesInRect:qi}});var At=b((Is,It)=>{var{NODE_TYPES:Ri,DEFAULT_PORTS:Ie}=U(),{normalizePort:Hi}=fe(),{deriveTurns:Bi}=Q(),{DEFAULT_NODE_WIDTH:Ui,resolveNodeSize:Ae,portAnchor:Ne,portFraction:Yi,sideHandles:Gi,edgePath:Xi,nodeBounds:Ct}=se(),Wi="http://www.w3.org/2000/svg",oe=400;function x(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function A(n,e){let t=document.createElementNS(Wi,n);if(e)for(let[i,r]of Object.entries(e))t.setAttribute(i,String(r));return t}function Ki(n){return{Entry:"entry",Content:"content",Dialog:"dialog",Choice:"choice",End:"end"}[n]||"unsupported"}function Ji(n,e,t){let i=x("span",`ng-port ng-port--${n}`);return i.dataset.nodeId=e,t&&(i.dataset.optionId=t),i}function Zi(n,e,t){let i=[];for(let r of Gi(e)){if(t==="Choice"&&r.side==="right")continue;let s=x("span","ng-port ng-port--side");s.dataset.nodeId=n,s.dataset.side=r.side,s.dataset.t=String(r.t);let o=Yi(r.side,r.t);s.style.left=`${o.x*100}%`,s.style.top=`${o.y*100}%`,i.push(s)}return i}var Qi=["ne","nw","se","sw"];function er(){return Qi.map(n=>{let e=x("span",`ng-resize ng-resize--${n}`);return e.dataset.dir=n,e})}function tr(n){let e=x("div",`ng-node ng-node--${Ki(n.type)}`);e.dataset.nodeId=n.id;let t=Number.isFinite(n.width)&&n.width>0?n.width:Ui;e.style.width=`${t}px`,e.style.left=`${n.x||0}px`,e.style.top=`${n.y||0}px`,n.manualSize&&Number.isFinite(n.height)&&n.height>0&&(e.style.height=`${n.height}px`,e.classList.add("ng-node--fixed"));let i=n.ports||Ie;for(let o of Zi(n.id,i,n.type))e.appendChild(o);let r=x("div","ng-node__header");n.type==="Entry"&&r.appendChild(x("span","ng-node__marker","\u25B6")),n.type==="End"&&r.appendChild(x("span","ng-node__marker","\u25A0")),r.appendChild(x("span","ng-node__title",n.title||n.type)),Ri.includes(n.type)||r.appendChild(x("span","ng-node__badge",`${n.type} (unsupported)`)),r.appendChild(x("span","ng-node-id",n.id)),e.appendChild(r);let s=x("div","ng-node__body");if(n.type==="Dialog"){let o=Array.isArray(n.turns)&&n.turns.length>0?n.turns:Bi(n);if(o.length>0)for(let a of o){let l=x("div","ng-node__turn");l.appendChild(x("span","ng-node__speaker",`${a.speaker}:`)),l.appendChild(x("span","ng-node__line",a.line)),s.appendChild(l)}else n.body&&s.appendChild(x("div","ng-node__text",n.body))}else if(n.body&&s.appendChild(x("div","ng-node__text",n.body)),n.type==="Choice"){let a=Array.isArray(n.choiceOptions)&&n.choiceOptions.length>0?n.choiceOptions:Array.isArray(n.choices)?n.choices.map(l=>({label:l})):[];for(let l of a){let c=x("div","ng-node__option",l&&l.label||"(empty option)");l&&l.id&&(c.dataset.optionId=l.id),s.appendChild(c)}for(let l of a)l&&l.id&&e.appendChild(Ji("out",n.id,l.id))}e.appendChild(s);for(let o of er())e.appendChild(o);return e}function St(n,e){let t=typeof n.label=="string"?n.label:"",i=e.get(n.from);if(i&&typeof n.choiceOptionId=="string"&&Array.isArray(i.choiceOptions)){let s=i.choiceOptions.find(o=>o&&o.id===n.choiceOptionId);s&&typeof s.label=="string"&&s.label.length>0&&(t=s.label)}let r=typeof n.requirements=="string"&&n.requirements.trim().length>0?n.requirements.trim():"";return{label:t,requirements:r}}function Le(n,e,t){let i=e.get(n.from),r=e.get(n.to);if(!i||!r)return null;let s=Ae(i,t.get(i.id)&&t.get(i.id).height),o=Ae(r,t.get(r.id)&&t.get(r.id).height),a=i.ports||Ie,l=r.ports||Ie,c=t.get(i.id),d=a.output&&a.output.t;n.choiceOptionId&&c&&c.optionT&&Number.isFinite(c.optionT[n.choiceOptionId])&&(d=c.optionT[n.choiceOptionId]);let h=Ne(i,s,a.output&&a.output.side,d),u=Hi(n.toPort),p=u?Ne(r,o,u.side,u.t):Ne(r,o,l.input&&l.input.side,l.input&&l.input.t),{d:f,mid:C}=Xi(h,p),{label:D,requirements:S}=St(n,e);return{d:f,mid:C,from:h,to:p,label:D,requirements:S}}function nr(n,e){let t=n.querySelector(".ng-edge__path"),i=n.querySelector(".ng-edge__hit");t&&t.setAttribute("d",e.d),i&&i.setAttribute("d",e.d);let r=n.querySelector(".ng-edge-end-handle");r&&(r.setAttribute("cx",String(e.to.x)),r.setAttribute("cy",String(e.to.y)));let s=n.querySelector(".ng-edge__label");s&&(s.setAttribute("x",String(e.mid.x)),s.setAttribute("y",String(e.mid.y-6)),s.textContent=e.label,s.style.display=e.label?"":"none");let o=n.querySelector(".ng-edge__condition");o&&(o.setAttribute("x",String(e.mid.x)),o.setAttribute("y",String(e.mid.y+(e.label?12:-6))),o.textContent=e.requirements,o.style.display=e.requirements?"":"none")}function ir(n,e){let t=A("g",{class:"ng-edge","data-link-id":n.id});t.appendChild(A("path",{class:"ng-edge__hit",d:e.d})),t.appendChild(A("path",{class:"ng-edge__path",d:e.d})),t.appendChild(A("circle",{class:"ng-edge-end-handle",cx:e.to.x,cy:e.to.y,r:6}));let i=A("text",{class:"ng-edge__label",x:e.mid.x,y:e.mid.y-6,"text-anchor":"middle"});i.textContent=e.label,e.label||(i.style.display="none"),t.appendChild(i);let r=A("text",{class:"ng-edge__condition",x:e.mid.x,y:e.mid.y+(e.label?12:-6),"text-anchor":"middle"});return r.textContent=e.requirements,e.requirements||(r.style.display="none"),t.appendChild(r),t}function rr(n,e,t){let i=new Map(n.map(h=>[h.id,h])),r=Ct(n,t),s=new Map;if(!r)return{svg:A("svg",{class:"ng-edges"}),edgeEls:s};let o=r.minX-oe,a=r.minY-oe,l=r.maxX-r.minX+oe*2,c=r.maxY-r.minY+oe*2,d=A("svg",{class:"ng-edges",viewBox:`${o} ${a} ${l} ${c}`});d.style.left=`${o}px`,d.style.top=`${a}px`,d.style.width=`${l}px`,d.style.height=`${c}px`;for(let h of e){let u=Le(h,i,t);if(!u)continue;let p=ir(h,u);s.set(h.id,p),d.appendChild(p)}if(typeof window<"u"&&window.__ngDebug){let h=A("g",{class:"ng-debug"});for(let u of e){let p=Le(u,i,t);if(!p)continue;h.appendChild(A("circle",{class:"ng-debug__from",cx:p.from.x,cy:p.from.y,r:5})),h.appendChild(A("circle",{class:"ng-debug__to",cx:p.to.x,cy:p.to.y,r:5}));let f=A("path",{class:"ng-debug__mid",d:`M ${p.mid.x-6} ${p.mid.y} L ${p.mid.x+6} ${p.mid.y} M ${p.mid.x} ${p.mid.y-6} L ${p.mid.x} ${p.mid.y+6}`});h.appendChild(f)}d.appendChild(h)}return{svg:d,edgeEls:s}}function Nt(n,e){let t=e.offsetHeight>0?e.offsetHeight:void 0,i=Ae(n,t),r={width:i.width,height:i.height};if(n.type==="Choice"&&t){let s={};for(let o of e.querySelectorAll(".ng-node__option[data-option-id]")){let a=o.offsetTop+o.offsetHeight/2;if(Number.isFinite(a)){s[o.dataset.optionId]=a/t;let l=e.querySelector(`:scope > .ng-port--out[data-option-id="${o.dataset.optionId}"]`);l&&(l.style.top=`${a}px`)}}r.optionT=s}return r}function sr(n,e,t){n.textContent="";let i=x("div","ng-canvas");if(n.appendChild(i),t&&t.length>0){let p=x("div","ng-canvas__warning",`File has ${t.length} parse problem(s) \u2014 rendering valid parts only.`);p.title=t.join(`
`),i.appendChild(p)}let r=e.project||{},s=Array.isArray(r.nodes)?r.nodes:[],o=Array.isArray(r.links)?r.links:[],a=x("div","ng-world");i.appendChild(a);let l=document.createDocumentFragment(),c=new Map;for(let p of s){let f=tr(p);c.set(p.id,f),l.appendChild(f)}a.appendChild(l);let d=new Map;for(let p of s)d.set(p.id,Nt(p,c.get(p.id)));let{svg:h,edgeEls:u}=rr(s,o,d);return a.insertBefore(h,a.firstChild),{worldEl:a,frameEl:i,svgEl:h,nodeEls:c,edgeEls:u,sizes:d,bounds:Ct(s,d)}}It.exports={renderCanvas:sr,layoutEdge:Le,applyEdgeLayout:nr,resolveEdgeLabels:St,measureNode:Nt}});var Tt=b((As,Lt)=>{var ae=xe(),or=0,ar=["\u4E0A\u5348","\u4E0B\u5348","\u9EC4\u660F","\u6DF1\u591C"],lr=[["===","\u7B49\u4E8E"],["!==","\u4E0D\u7B49\u4E8E"],[">=","\u2265"],["<=","\u2264"],[">","\uFF1E"],["<","\uFF1C"],["truthy","\u4E3A\u771F"],["falsy","\u4E3A\u5047"]];function v(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function dr(n,e,t){let i=t&&t.getVariables||(()=>[]),r=`ng-cond-vars-${++or}`,s=v("div","ng-cond"),o=v("div","ng-cond__rows"),a=v("div","ng-cond__bar"),l=v("div","ng-cond__note","\u8868\u8FBE\u5F0F\u8F83\u590D\u6742\uFF0C\u4EC5\u652F\u6301\u6587\u672C\u7F16\u8F91");l.style.display="none";let c=v("details","ng-cond__raw"),d=v("summary","","\u6587\u672C\u7F16\u8F91");c.appendChild(d),c.appendChild(e);let h=v("button","ng-cond__add","+ \u5B50\u53E5");h.type="button";let u=v("button","ng-cond__comb");u.type="button",a.appendChild(h),a.appendChild(u),s.appendChild(o),s.appendChild(a),s.appendChild(l),s.appendChild(c),n.insertBefore(s,e.parentNode===n?e:null),e.parentNode!==c&&c.appendChild(e);let p=document.createElement("datalist");p.id=r,s.appendChild(p);let f=ae.parseCondition(e.value),C=!Array.isArray(f.clauses);function D(E){let y=i().find(_=>_&&_.name===E);return y?y.type:""}function S(){e.value=ae.serializeCondition(f)}function K(){p.textContent="";for(let E of i()){if(!E||!E.name)continue;let y=document.createElement("option");y.value=E.name,p.appendChild(y)}}function P(){if(C=!Array.isArray(f.clauses),l.style.display=C?"":"none",o.style.display=C?"none":"",a.style.display=C?"none":"",C){c.open=!0;return}u.textContent=f.combinator==="||"?"\u4EFB\u4E00\u6EE1\u8DB3 (||)":"\u5168\u90E8\u6EE1\u8DB3 (&&)",K(),o.textContent="",f.clauses.forEach((E,y)=>o.appendChild(J(E,y)))}function J(E,y){let _=v("div","ng-cond__row"),m=v("select","ng-cond__clause-type");for(let[w,L]of[["state","\u53D8\u91CF"],["period","\u65F6\u95F4\u6BB5"]]){let I=v("option","",L);I.value=w,E.type===w&&(I.selected=!0),m.appendChild(I)}if(m.addEventListener("change",()=>{f.clauses[y]=m.value==="period"?{type:"period",periods:[]}:{type:"state",key:"",op:"===",value:""},P(),S()}),_.appendChild(m),E.type==="period"){let w=v("span","ng-cond__periods");ar.forEach((L,I)=>{let j=v("label","ng-cond__period"),T=document.createElement("input");T.type="checkbox",T.checked=E.periods.includes(I),T.addEventListener("change",()=>{let q=new Set(f.clauses[y].periods);T.checked?q.add(I):q.delete(I),f.clauses[y].periods=[...q],S()}),j.appendChild(T),j.appendChild(document.createTextNode(L)),w.appendChild(j)}),_.appendChild(w)}else{let w=v("input","ng-cond__key");w.type="text",w.placeholder="\u53D8\u91CF\u540D",w.value=E.key,w.setAttribute("list",r),w.addEventListener("input",()=>{f.clauses[y].key=w.value.trim(),j(),S()}),_.appendChild(w);let L=v("select","ng-cond__op");for(let[T,q]of lr){let R=v("option","",q);R.value=T,E.op===T&&(R.selected=!0),L.appendChild(R)}L.addEventListener("change",()=>{f.clauses[y].op=L.value,j(),S()}),_.appendChild(L);let I=v("span","ng-cond__value");_.appendChild(I);let j=()=>{I.textContent="";let T=f.clauses[y].op;if(T==="truthy"||T==="falsy"){f.clauses[y].value="";return}let q=D(f.clauses[y].key),R=f.clauses[y].value;if(q==="bool"){let Z=v("select","ng-cond__val");for(let[je,mn]of[["true","true"],["false","false"]]){let he=v("option","",mn);he.value=je,R===je&&(he.selected=!0),Z.appendChild(he)}Z.addEventListener("change",()=>{f.clauses[y].value=Z.value,S()}),I.appendChild(Z);return}let M=v("input","ng-cond__val");M.type="text",q==="number"?(M.placeholder="\u6570\u5B57",M.value=R,M.addEventListener("input",()=>{f.clauses[y].value=M.value.trim(),S()})):(M.placeholder="\u6587\u672C",M.value=cr(R),M.addEventListener("input",()=>{f.clauses[y].value=ae.formatConditionLiteral("string",M.value)||"",S()})),I.appendChild(M)};j()}let N=v("button","ng-cond__del","\xD7");return N.type="button",N.addEventListener("click",()=>{f.clauses.splice(y,1),P(),S()}),_.appendChild(N),_}return h.addEventListener("click",()=>{f.clauses.push({type:"state",key:"",op:"===",value:""}),P(),S()}),u.addEventListener("click",()=>{f.combinator=f.combinator==="||"?"&&":"||",P(),S()}),e.addEventListener("change",()=>{let E=ae.parseCondition(e.value);Array.isArray(E.clauses),f=E,P()}),P(),{syncFromText:P}}function cr(n){let e=String(n||"");if(e.length>=2&&e.startsWith('"'))try{return JSON.parse(e)}catch{return e}return e}Lt.exports={attachConditionBuilder:dr}});var Pt=b((Ls,Dt)=>{function hr(n,e){let t=document.createElement("div");t.className="ng-ac",t.style.display="none",(n.parentElement||n).appendChild(t);let i=[],r=-1,s=!1;function o(){s=!1,r=-1,t.style.display="none"}function a(d){n.value=d.name,o()}function l(){let d=t.children;for(let h=0;h<d.length;h++)d[h].classList.toggle("ng-ac__item--active",h===r)}function c(){let d=n.value.trim().toLowerCase(),h=(e?e():[])||[];i=[];for(let u of h)if(!(!u||!u.name)&&!(d&&u.name.toLowerCase().indexOf(d)===-1)&&(i.push(u),i.length>=8))break;if(i.length===0){o();return}t.textContent="",i.forEach((u,p)=>{let f=document.createElement("div");f.className="ng-ac__item",f.textContent=u.name,f.addEventListener("mousedown",C=>{C.preventDefault(),a(u)}),t.appendChild(f)}),r=-1,s=!0,t.style.display="",l()}n.addEventListener("input",c),n.addEventListener("focus",c),n.addEventListener("blur",o),n.addEventListener("keydown",d=>{if(s)if(d.key==="ArrowDown"||d.key==="ArrowUp"){d.preventDefault(),d.stopPropagation();let h=d.key==="ArrowDown"?1:-1;r=(r+h+i.length)%i.length,l()}else d.key==="Enter"?r>=0&&i[r]&&(d.preventDefault(),d.stopPropagation(),a(i[r])):d.key==="Escape"&&(d.preventDefault(),d.stopPropagation(),o())})}Dt.exports={attachSpeakerAutocomplete:hr}});var qt=b((Ts,Ot)=>{var{EFFECT_OPS:ur}=U(),{deriveTurns:pr}=Q(),{attachConditionBuilder:Mt}=Tt(),{attachSpeakerAutocomplete:fr}=Pt();function k(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!=null&&(i.textContent=t),i}function B(n,e,t){let i=k("input",n);return i.type="text",i.value=e||"",t&&(i.placeholder=t),i}function zt(n,e,t){let i=k("textarea",n);i.value=e||"",i.rows=1,t&&(i.placeholder=t);let r=()=>{i.style.height="auto",i.style.height=`${i.scrollHeight}px`};return i.addEventListener("input",r),setTimeout(r,0),i}function z(n,e,t){let i=k("button",n,e);return i.type="button",i.addEventListener("click",r=>{r.preventDefault(),t()}),i}function gr(n,e,t,i){let r=k("div","ng-editor__turns");n.appendChild(r);let s=o=>{let a=k("div","ng-editor__turn-row"),l=B("ng-editor__speaker",o.speaker,"Speaker"),c=zt("ng-editor__line",o.line,"Line");a.appendChild(l),i&&fr(l,i),a.appendChild(c),a.appendChild(z("ng-editor__row-del","\xD7",()=>{a.remove()})),r.appendChild(a)};for(let o of t.turns)s(o);n.appendChild(z("ng-editor__row-add","+ turn",()=>s({speaker:"",line:""})))}function _r(n){let e=[];for(let t of n.querySelectorAll(".ng-editor__turn-row"))e.push({speaker:t.querySelector(".ng-editor__speaker").value,line:t.querySelector(".ng-editor__line").value});return e}function mr(n,e){let t=k("div","ng-editor__effects");n.appendChild(t);let i=r=>{let s=k("div","ng-editor__effect-row"),o=k("select","ng-editor__effect-op");for(let a of ur){let l=k("option","",a);l.value=a,r.op===a&&(l.selected=!0),o.appendChild(l)}s.appendChild(o),s.appendChild(B("ng-editor__effect-key",r.key,"variable")),s.appendChild(B("ng-editor__effect-value",r.value,"value")),s.appendChild(z("ng-editor__row-del","\xD7",()=>s.remove())),t.appendChild(s)};for(let r of e.effects||[])i(r);n.appendChild(z("ng-editor__row-add","+ effect",()=>i({op:"set",key:"",value:""})))}function yr(n,e,t,i){let r=k("div","ng-editor__options");n.appendChild(r);let s=o=>{let a=k("div","ng-editor__option-row");o.id&&(a.dataset.optionId=o.id);let l=k("div","ng-editor__option-head");l.appendChild(B("ng-editor__option-label",o.label,"Option label"));let c=B("ng-editor__option-requires",o.requires,"requires (e.g. res_coins >= 5)");l.appendChild(c),l.appendChild(z("ng-editor__row-del","\xD7",()=>a.remove())),a.appendChild(l),i&&Mt(a,c,{getVariables:i}),mr(a,o),r.appendChild(a)};for(let o of t.options)s(o);n.appendChild(z("ng-editor__row-add","+ option",()=>s({label:"",requires:"",effects:[]})))}function br(n){let e=[];for(let t of n.querySelectorAll(".ng-editor__option-row")){let i=[];for(let s of t.querySelectorAll(".ng-editor__effect-row"))i.push({trigger:"onChoose",op:s.querySelector(".ng-editor__effect-op").value,key:s.querySelector(".ng-editor__effect-key").value,value:s.querySelector(".ng-editor__effect-value").value});let r={label:t.querySelector(".ng-editor__option-label").value,requires:t.querySelector(".ng-editor__option-requires").value,effects:i};t.dataset.optionId&&(r.id=t.dataset.optionId),e.push(r)}return e}function vr(n,e){let t=k("div","ng-editor");t.dataset.editorFor=n.id,t.appendChild(k("div","ng-editor__heading",`Edit ${n.type} \xB7 ${n.id}`));let i=B("ng-editor__title",n.title,"Title");if(t.appendChild(i),n.type==="Dialog"){let s=Array.isArray(n.turns)&&n.turns.length>0?n.turns:pr(n);gr(t,n,{turns:s.length>0?s:[{speaker:"",line:""}]},e.getSpeakers)}else{let s=zt("ng-editor__body",n.body,n.type==="Choice"?"Prompt text":"Body");if(t.appendChild(s),n.type==="Choice"){let o=(Array.isArray(n.choiceOptions)?n.choiceOptions:[]).map(a=>({id:a.id,label:a.label,requires:a.requires,effects:a.effects}));yr(t,n,{options:o},e.getVariables)}}let r=k("div","ng-editor__footer");return r.appendChild(z("ng-editor__done","Done",()=>{let s={title:i.value};n.type==="Dialog"?s.turns=_r(t):(s.body=t.querySelector(".ng-editor__body").value,n.type==="Choice"&&(s.options=br(t))),e.onCommit(s)})),r.appendChild(z("ng-editor__cancel","Cancel",()=>e.onCancel())),t.appendChild(r),t.addEventListener("keydown",s=>{s.key==="Escape"&&(s.stopPropagation(),e.onCancel())}),t}function xr(n,e){let t=k("div","ng-editor ng-editor--link");t.dataset.editorFor=n.id,t.appendChild(k("div","ng-editor__heading",`Condition \xB7 ${n.id}`));let i=B("ng-editor__requires",n.requirements||"","e.g. flag_honest == true (empty = always)");t.appendChild(i),e.getVariables&&Mt(t,i,{getVariables:e.getVariables});let r=k("div","ng-editor__footer");return r.appendChild(z("ng-editor__done","Done",()=>e.onCommit(i.value))),r.appendChild(z("ng-editor__cancel","Cancel",()=>e.onCancel())),t.appendChild(r),t.addEventListener("keydown",s=>{s.key==="Escape"?(s.stopPropagation(),e.onCancel()):s.key==="Enter"&&(s.preventDefault(),e.onCommit(i.value))}),t}Ot.exports={buildNodeEditor:vr,buildLinkEditor:xr}});var G=b((Ds,Ht)=>{var Er="Variables.md",Vt=Object.freeze(["bool","number","string"]),wr=["# \u5168\u5C40\u53D8\u91CF\u8868","","\u5168 vault \u5171\u4EAB\u7684\u5BF9\u8BDD\u53D8\u91CF\uFF08NG-06\uFF09\u3002\u53D8\u91CF\u540D\u4FDD\u7559 flag_/res_ \u524D\u7F00\uFF08\u9A71\u52A8 MED \u7FFB\u8BD1\uFF09\uFF1B","\u7C7B\u578B \u2208 bool|number|string\uFF1B\u521D\u59CB\u503C\u4E3A\u5B57\u9762\u91CF\uFF08true/false\u3001\u6570\u5B57\u6216\u5B57\u7B26\u4E32\uFF09\u3002","","| \u53D8\u91CF | \u7C7B\u578B | \u521D\u59CB\u503C | \u5907\u6CE8 |","| --- | --- | --- | --- |",""].join(`
`),Ft=["\u53D8\u91CF","\u7C7B\u578B","\u521D\u59CB\u503C","\u5907\u6CE8"];function Te(n){let e=n.trim();return e.length>=2&&e.startsWith("|")&&e.endsWith("|")}function De(n){return n.trim().slice(1,-1).split(/(?<!\\)\|/).map(t=>t.trim().replace(/\\\|/g,"|"))}function kr(n){return String(n??"").replace(/\|/g,"\\|")}function Cr(n){return Te(n)?De(n).every(e=>/^:?-+:?$/.test(e.replace(/\s/g,""))):!1}function Pe(n){if(typeof n=="string"){if(n.startsWith("flag_"))return"bool";if(n.startsWith("res_"))return"number"}return"string"}function $t(n,e){let t=String(e??"").trim();return n==="bool"?/^(true|false)$/i.test(t):n==="number"?t!==""&&!Number.isNaN(Number(t)):!0}function Sr(n,e){let t=String(e??"").trim();if(n==="bool")return/^true$/i.test(t);if(n==="number"){let i=Number(t);return Number.isNaN(i)?t:i}return String(e??"")}function jt(n){for(let e=0;e<n.length-1;e++){if(!Te(n[e]))continue;let t=De(n[e]),i={},r=!0;for(let o of Ft){let a=t.indexOf(o);if(a===-1){r=!1;break}i[o]=a}if(!r||!Cr(n[e+1]))continue;let s=e+2;for(;s<n.length&&Te(n[s]);)s++;return{headerIdx:e,sepIdx:e+1,rowStart:e+2,rowEnd:s,colMap:i}}return null}function Nr(n){let e=String(n||"").split(`
`),t=jt(e);if(!t)return{entries:[],warnings:[]};let i=[];for(let r=t.rowStart;r<t.rowEnd;r++){let s=De(e[r]),o=l=>{let c=t.colMap[l];return c<s.length?s[c]:""},a={name:o("\u53D8\u91CF"),type:o("\u7C7B\u578B").toLowerCase(),initial:o("\u521D\u59CB\u503C"),note:o("\u5907\u6CE8")};!a.name&&!a.type&&!a.initial&&!a.note||i.push(a)}return{entries:i,warnings:Rt(i)}}function Ir(n,e){let t=String(n??""),i=t.split(`
`),r=(e||[]).filter(a=>a&&String(a.name||"").trim()!=="").map(a=>"| "+[a.name,a.type,a.initial,a.note].map(kr).join(" | ")+" |"),s=jt(i);if(!s){let a=["| "+Ft.join(" | ")+" |","| --- | --- | --- | --- |",...r];if(t.trim()==="")return a.join(`
`);let l=i.slice();return l[l.length-1].trim()!==""&&l.push(""),l.push(...a),l.join(`
`)}return i.slice(0,s.rowStart).concat(r,i.slice(s.rowEnd)).join(`
`)}function Rt(n){let e=[],t=new Set;for(let i of n||[]){if(!i)continue;let r=String(i.name||"").trim(),s=r||"(\u672A\u547D\u540D)";if(!r){e.push("\u5B58\u5728\u672A\u586B\u5199\u53D8\u91CF\u540D\u7684\u884C");continue}t.has(r)&&e.push(`\u53D8\u91CF "${r}" \u91CD\u590D\u5B9A\u4E49`),t.add(r);let o=String(i.type||"").trim().toLowerCase();o&&!Vt.includes(o)&&(e.push(`\u53D8\u91CF "${s}" \u7C7B\u578B "${i.type}" \u672A\u77E5\uFF08\u5E94\u4E3A bool|number|string\uFF09\uFF0C\u6309\u524D\u7F00\u63A8\u65AD\u5904\u7406`),o="");let a=o||Pe(r);r.startsWith("flag_")&&a!=="bool"&&e.push(`\u53D8\u91CF "${r}" \u524D\u7F00 flag_ \u8981\u6C42 bool \u7C7B\u578B\uFF0C\u5F53\u524D\u4E3A ${a}`),r.startsWith("res_")&&a!=="number"&&e.push(`\u53D8\u91CF "${r}" \u524D\u7F00 res_ \u8981\u6C42 number \u7C7B\u578B\uFF0C\u5F53\u524D\u4E3A ${a}`),$t(a,i.initial)||e.push(`\u53D8\u91CF "${r}" \u521D\u59CB\u503C "${i.initial}" \u65E0\u6CD5\u6309 ${a} \u89E3\u6790`)}return e}function Ar(n,e){let t=new Set((n||[]).map(r=>r&&r.name)),i=[];for(let[r,s]of Object.entries(e||{})){if(t.has(r))continue;let o,a;typeof s=="boolean"?(a="bool",o=s?"true":"false"):typeof s=="number"?(a="number",o=String(s)):(a=Pe(r),s==null?o="":o=String(s)),i.push({name:r,type:a,initial:o,note:""})}return i}Ht.exports={DEFAULT_VARIABLES_PATH:Er,EMPTY_VARIABLES_FILE:wr,VALID_TYPES:Vt,inferTypeFromPrefix:Pe,isValidInitial:$t,parseInitialValue:Sr,parseVariablesTable:Nr,serializeVariablesTable:Ir,validateEntries:Rt,mergeFileVariables:Ar}});var Yt=b((Ps,Ut)=>{var{validateEntries:Lr}=G(),Bt=["bool","number","string"],Me=class{constructor(e){this._onCommit=e.onCommit,this._onClose=e.onClose;let t=document.createElement("div");t.className="ng-vars-panel ng-vars-panel--hidden";let i=document.createElement("div");i.className="ng-vars-panel__header";let r=document.createElement("span");r.className="ng-vars-panel__title",r.textContent="\u5168\u5C40\u53D8\u91CF";let s=document.createElement("button");s.type="button",s.className="ng-vars-panel__close",s.textContent="\xD7",s.addEventListener("click",()=>this._onClose()),i.appendChild(r),i.appendChild(s),t.appendChild(i);let o=document.createElement("table");o.className="ng-vars-panel__grid";let a=document.createElement("thead"),l=document.createElement("tr");for(let h of["\u53D8\u91CF","\u7C7B\u578B","\u521D\u59CB\u503C","\u5907\u6CE8",""]){let u=document.createElement("th");u.textContent=h,l.appendChild(u)}a.appendChild(l),o.appendChild(a),this._tbody=document.createElement("tbody"),o.appendChild(this._tbody),t.appendChild(o);let c=document.createElement("div");c.className="ng-vars-panel__footer";let d=document.createElement("button");d.type="button",d.className="ng-vars-panel__add",d.textContent="+ \u6DFB\u52A0\u53D8\u91CF",d.addEventListener("click",()=>{let h=this._buildRow({name:"",type:"",initial:"",note:""});this._tbody.appendChild(h);let u=h.querySelector(".ng-vars-panel__name");u&&u.focus()}),c.appendChild(d),this._warningsEl=document.createElement("div"),this._warningsEl.className="ng-vars-panel__warnings",c.appendChild(this._warningsEl),t.appendChild(c),this.el=t}setEntries(e,t){this._tbody.textContent="";for(let i of e||[])this._tbody.appendChild(this._buildRow(i));this.setWarnings(t)}setWarnings(e){this._warningsEl.textContent=(e||[]).join("\uFF1B")}_buildRow(e){let t=document.createElement("tr"),i=document.createElement("td"),r=document.createElement("input");r.className="ng-vars-panel__name",r.type="text",r.placeholder="flag_/res_",r.value=e.name||"",i.appendChild(r),t.appendChild(i);let s=document.createElement("td"),o=document.createElement("select");o.className="ng-vars-panel__type";for(let C of Bt){let D=document.createElement("option");D.value=C,D.textContent=C,o.appendChild(D)}o.value=Bt.includes(e.type)?e.type:"";let a=document.createElement("option");a.value="",a.textContent="(\u63A8\u65AD)",o.insertBefore(a,o.firstChild),s.appendChild(o),t.appendChild(s);let l=document.createElement("td"),c=document.createElement("input");c.className="ng-vars-panel__initial",c.type="text",c.value=e.initial||"",l.appendChild(c),t.appendChild(l);let d=document.createElement("td"),h=document.createElement("input");h.className="ng-vars-panel__note",h.type="text",h.value=e.note||"",d.appendChild(h),t.appendChild(d);let u=document.createElement("td"),p=document.createElement("button");p.type="button",p.className="ng-vars-panel__del",p.textContent="\xD7",p.addEventListener("click",()=>{t.remove(),this._onCommit(this._collectEntries())}),u.appendChild(p),t.appendChild(u);let f=()=>this._onCommit(this._collectEntries());return r.addEventListener("change",f),o.addEventListener("change",f),c.addEventListener("change",f),h.addEventListener("change",f),t}_collectEntries(){let e=[];for(let t of this._tbody.querySelectorAll("tr"))e.push({name:t.querySelector(".ng-vars-panel__name").value.trim(),type:t.querySelector(".ng-vars-panel__type").value,initial:t.querySelector(".ng-vars-panel__initial").value,note:t.querySelector(".ng-vars-panel__note").value});return e}validateCurrent(){return Lr(this._collectEntries())}destroy(){this.el.remove()}};Ut.exports={VariablesPanel:Me}});var Wt=b((Ms,Xt)=>{function Gt(n,e,t){let i=t==null?"Characters":String(t).trim().replace(/\/+$/,"");if(!i)return[];let r=i+"/",s=[];for(let o of n||[]){if(!o||o.extension!=="md"||!o.path.startsWith(r))continue;let a=e(o);if(!a)continue;let l=a.id!==void 0&&a.id!==null&&String(a.id).trim()!==""?String(a.id).trim():o.basename,c=a.name!==void 0&&a.name!==null&&String(a.name).trim()!==""?String(a.name).trim():o.basename;s.push({id:"gc-"+l,name:c,role:a.role,voice:a.voice})}return s}function Tr(n,e){try{let t=n&&n.vault,i=n&&n.metadataCache;return!t||typeof t.getFiles!="function"||!i||typeof i.getFileCache!="function"?[]:Gt(t.getFiles(),r=>{let s=i.getFileCache(r);return s&&s.frontmatter},e)}catch{return[]}}Xt.exports={listSpeakersFromFiles:Gt,loadSpeakers:Tr}});var Qt=b((zs,Zt)=>{var{ZOOM_STEP:Kt,zoomAtPoint:Dr,isValidStoredView:Pr,gridBackground:Mr,GRID_SPACING:zr}=se(),Jt=300,ze=class{constructor(e,t,i,r){this._frameEl=e,this._worldEl=t,this._onNavigate=typeof i=="function"?i:()=>{},this._shouldPan=typeof r=="function"?r:s=>s.button===1,this._view={x:0,y:0,scale:1},this._pan=null,this._zoomTimer=null,this._onWheel=this._handleWheel.bind(this),this._onPointerDown=this._handlePointerDown.bind(this),this._onPointerMove=this._handlePointerMove.bind(this),this._onPointerUp=this._handlePointerUp.bind(this)}attach(){this._frameEl.addEventListener("wheel",this._onWheel,{passive:!1}),this._frameEl.addEventListener("pointerdown",this._onPointerDown)}detach(){this._frameEl.removeEventListener("wheel",this._onWheel),this._frameEl.removeEventListener("pointerdown",this._onPointerDown),this._endPan(),this._zoomTimer!==null&&(clearTimeout(this._zoomTimer),this._zoomTimer=null)}getView(){return{...this._view}}setView(e){Pr(e)&&(this._view={x:e.x,y:e.y,scale:e.scale},this._apply())}_apply(){let{x:e,y:t,scale:i}=this._view;this._worldEl.style.transform=`translate(${e}px, ${t}px) scale(${i})`;let r=Mr(this._view,zr);this._frameEl.style.backgroundPosition=r.backgroundPosition,this._frameEl.style.backgroundSize=r.backgroundSize}_commit(e){this._onNavigate(this.getView(),e)}_handleWheel(e){e.preventDefault();let t=this._frameEl.getBoundingClientRect(),i={x:e.clientX-t.left,y:e.clientY-t.top},r=e.deltaY<0?Kt:1/Kt;this._view=Dr(this._view,i,r),this._apply(),this._zoomTimer!==null&&clearTimeout(this._zoomTimer),this._zoomTimer=setTimeout(()=>{this._zoomTimer=null,this._commit("zoom")},Jt)}_handlePointerDown(e){if(this._shouldPan(e)){if(this._pan={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,viewX:this._view.x,viewY:this._view.y,moved:!1},this._frameEl.classList.add("ng-canvas--panning"),typeof this._frameEl.setPointerCapture=="function")try{this._frameEl.setPointerCapture(e.pointerId)}catch{}this._frameEl.addEventListener("pointermove",this._onPointerMove),this._frameEl.addEventListener("pointerup",this._onPointerUp),this._frameEl.addEventListener("pointercancel",this._onPointerUp),e.button===1&&e.preventDefault()}}_handlePointerMove(e){if(!this._pan||e.pointerId!==this._pan.pointerId)return;let t=e.clientX-this._pan.startX,i=e.clientY-this._pan.startY;Math.abs(t)+Math.abs(i)>2&&(this._pan.moved=!0),this._view.x=this._pan.viewX+t,this._view.y=this._pan.viewY+i,this._apply()}_handlePointerUp(e){if(!this._pan||e.pointerId!==this._pan.pointerId)return;let t=this._pan.moved;this._endPan(),t&&this._commit("pan")}_endPan(){this._pan=null,this._frameEl.classList.remove("ng-canvas--panning"),this._frameEl.removeEventListener("pointermove",this._onPointerMove),this._frameEl.removeEventListener("pointerup",this._onPointerUp),this._frameEl.removeEventListener("pointercancel",this._onPointerUp)}};Zt.exports={Viewport:ze,ZOOM_COMMIT_DELAY:Jt}});var tn=b((Os,en)=>{var Or=Object.freeze(["ui","out-port","port-handle","in-port","node","edge","edge-end-handle","empty"]),qr=Object.freeze(["none","pan","marquee","node-drag","link-drag","resize-drag","end-handle-drag"]);function Vr(n){let{button:e,spaceHeld:t,targetKind:i,portHit:r,resizeZone:s}=n;return i==="ui"?{type:"none"}:i==="out-port"&&e===0?{type:"link-drag"}:i==="port-handle"&&e===0?{type:"link-drag"}:i==="edge-end-handle"&&e===0?{type:"end-handle-drag"}:i==="in-port"?{type:"none"}:e===1?{type:"pan"}:e!==0?{type:"none"}:t?{type:"pan"}:i==="node"?r?{type:"link-drag"}:s?{type:"resize-drag"}:{type:"node-drag"}:i==="empty"||i==="edge"?{type:"marquee"}:{type:"none"}}function Fr(n,e,t){return t?[...new Set([...n,...e])]:[...e]}function $r(n,e,t){let i=[...n];return t||i.includes(e)?i:[e]}en.exports={TARGET_KINDS:Or,GESTURES:qr,decidePointerDown:Vr,mergeMarqueeSelection:Fr,pointerDownSelection:$r}});var hn=b((qs,cn)=>{var{TextFileView:jr,Notice:Oe}=require("obsidian"),{parseSavedState:Rr,serializeSavedState:Hr}=Ye(),g=it(),qe=ct(),V=ut(),{renderCanvas:Br,layoutEdge:le,applyEdgeLayout:de,measureNode:Ur}=At(),{buildNodeEditor:Yr,buildLinkEditor:Gr}=qt(),{VariablesPanel:Xr}=Yt(),F=G(),{loadSpeakers:Wr}=Wt(),{Viewport:Kr}=Qt(),{decidePointerDown:nn,mergeMarqueeSelection:Jr,pointerDownSelection:Zr}=tn(),{fitView:Qr,isValidStoredView:es,viewIntersectsBounds:ts,worldToScreen:ns,screenToWorld:$,edgePath:is,normalizeRect:rn,nodesInRect:rs,resolveNodeSize:ce,nearestSide:sn,sideT:on,oppositeSide:ss,applyResize:os,resizeZoneAt:an,resizeCursor:as}=se(),ln="narrative-graph-view",dn=2e3,Ve=class n extends jr{constructor(e){super(e),this.data="",this._state=null,this._errors=[],this._parseFailure=null,this._viewport=null,this._saveTimer=null,this._frameEl=null,this._worldEl=null,this._svgEl=null,this._nodeEls=new Map,this._edgeEls=new Map,this._sizes=new Map,this._selectedNodeIds=new Set,this._selectedLinkId=null,this._editorEl=null,this._nodeDrag=null,this._linkDrag=null,this._marquee=null,this._resize=null,this._endHandleDrag=null,this._spaceHeld=!1,this._dragEndedAt=0,this._cursorEl=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._searchInputEl=null,this._searchCountEl=null,this._searchPrevEl=null,this._searchNextEl=null,this._varsPanel=null,this._varsVisible=!1,this._varsSaveTimer=null,this._varsLastWrite=null,this._varsModifyRef=null,this._varsEntries=null,this._speakers=null,this._history=null,this._historyBaseline=null,this._onClick=this._handleClick.bind(this),this._onDblClick=this._handleDblClick.bind(this),this._onPointerDown=this._handlePointerDown.bind(this),this._onPointerMove=this._handlePointerMove.bind(this),this._onPointerUp=this._handlePointerUp.bind(this),this._onKeyDown=this._handleKeyDown.bind(this),this._onKeyUp=this._handleKeyUp.bind(this),this._onHoverMove=this._handleHoverMove.bind(this),this._onDocKeyDown=this._handleDocKeyDown.bind(this)}getViewType(){return ln}getDisplayText(){return this.file?this.file.basename:"Narrative Graph"}getViewData(){return this._state?Hr(this._state):this.data}setViewData(e,t){this.data=e,this._parseFailure=null;try{let{state:i,errors:r}=Rr(e);this._state=i,this._errors=r}catch(i){this._state=null,this._errors=[],this._parseFailure=i}this._selectedNodeIds.clear(),this._selectedLinkId=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._render(),this._history=this._state?V.createHistory():null,this._historyBaseline=this._state?V.takeSnapshot(this._state):null,this._state&&(this._ensureVarsEntries(),this._ensureSpeakers())}clear(){this.data="",this._state=null,this._errors=[],this._parseFailure=null,this._selectedNodeIds.clear(),this._selectedLinkId=null,this._searchQuery="",this._searchHits=[],this._searchIndex=-1,this._history=null,this._historyBaseline=null,this._render()}async onOpen(){this.contentEl.tabIndex=-1,this.contentEl.addEventListener("click",this._onClick),this.contentEl.addEventListener("dblclick",this._onDblClick),this.contentEl.addEventListener("pointerdown",this._onPointerDown),this.contentEl.addEventListener("pointermove",this._onHoverMove),this.contentEl.addEventListener("keydown",this._onKeyDown),this.contentEl.addEventListener("keyup",this._onKeyUp),window.addEventListener("keydown",this._onDocKeyDown,!0),this.app&&this.app.vault&&typeof this.app.vault.on=="function"&&(this._varsModifyRef=this.app.vault.on("modify",e=>this._onVaultModify(e)))}async onClose(){this.contentEl.removeEventListener("click",this._onClick),this.contentEl.removeEventListener("dblclick",this._onDblClick),this.contentEl.removeEventListener("pointerdown",this._onPointerDown),this.contentEl.removeEventListener("pointermove",this._onHoverMove),this.contentEl.removeEventListener("keydown",this._onKeyDown),this.contentEl.removeEventListener("keyup",this._onKeyUp),window.removeEventListener("keydown",this._onDocKeyDown,!0),this._cancelDrags(),this._varsModifyRef&&this.app&&this.app.vault&&typeof this.app.vault.offref=="function"&&(this.app.vault.offref(this._varsModifyRef),this._varsModifyRef=null),this._varsSaveTimer!==null&&(clearTimeout(this._varsSaveTimer),this._varsSaveTimer=null),this._saveTimer!==null&&(clearTimeout(this._saveTimer),this._saveTimer=null),this._viewport&&(this._viewport.detach(),this._viewport=null)}_render(){if(this._viewport&&(this._viewport.detach(),this._viewport=null),this._editorEl=null,this._cursorEl=null,this._searchInputEl=null,this._searchCountEl=null,this._searchPrevEl=null,this._searchNextEl=null,this.contentEl.empty(),this.contentEl.addClass("narrative-graph-view"),this._parseFailure){this.contentEl.createEl("p",{cls:"narrative-graph-error",text:String(this._parseFailure.message||this._parseFailure)});return}if(!this._state)return;let e=Br(this.contentEl,this._state,this._errors);this._frameEl=e.frameEl,this._worldEl=e.worldEl,this._svgEl=e.svgEl,this._nodeEls=e.nodeEls,this._edgeEls=e.edgeEls,this._sizes=e.sizes,this._viewport=new Kr(this._frameEl,this._worldEl,(i,r)=>this._persistView(i,r),i=>this._shouldPan(i)),this._viewport.attach();let t=this._state.ui&&this._state.ui.view;if(es(t)&&(!e.bounds||ts(t,e.bounds,this.contentEl.clientWidth,this.contentEl.clientHeight)))this._viewport.setView(t);else if(e.bounds){let i=Qr(e.bounds,this.contentEl.clientWidth,this.contentEl.clientHeight);this._viewport.setView(i)}this._buildToolbar(),this._varsPanel&&this._varsPanel.el&&this._frameEl.appendChild(this._varsPanel.el),this._restoreSelection(),this._refreshSearch(),this._scheduleRelayout()}_rerenderPreservingCamera(){let e=this._viewport?this._viewport.getView():null;this._render(),e&&this._viewport&&this._viewport.setView(e)}_afterMutation(){this._recordHistory(),this._rerenderPreservingCamera(),this._scheduleSave()}_recordHistory(){!this._history||!this._historyBaseline||!this._state||(V.push(this._history,this._historyBaseline),this._historyBaseline=V.takeSnapshot(this._state))}_scheduleRelayout(){(typeof requestAnimationFrame=="function"?requestAnimationFrame:t=>setTimeout(t,0))(()=>this._relayoutEdges())}_relayoutEdges(){if(!this._state||!this._svgEl||!this._svgEl.isConnected)return;let e=this._state.project&&this._state.project.nodes||[],t=!1;for(let r of e){let s=this._nodeEls.get(r.id);if(!s)continue;let o=this._sizes.get(r.id),a=Ur(r,s);s.offsetHeight>0&&o&&(o.height!==a.height||JSON.stringify(o.optionT||null)!==JSON.stringify(a.optionT||null))&&(this._sizes.set(r.id,a),t=!0)}if(!t)return;let i=new Map(e.map(r=>[r.id,r]));for(let r of this._state.project.links||[]){let s=this._edgeEls.get(r.id),o=le(r,i,this._sizes);s&&o&&de(s,o)}}_buildToolbar(){let e=document.createElement("div");e.className="ng-toolbar";let t={Entry:"+\u8D77\u70B9",Content:"+\u5185\u5BB9",Dialog:"+\u5BF9\u8BDD",Choice:"+\u9009\u62E9",End:"+\u7ED3\u5C40"},i=["Content","Dialog","Choice","End"];g.entryNodes(this._state).length===0&&i.unshift("Entry");for(let h of i){let u=document.createElement("button");u.type="button",u.className="ng-toolbar__btn ng-toolbar__btn--add",u.dataset.addType=h,u.textContent=t[h]||`+${h}`,u.addEventListener("click",()=>this._createNode(h)),e.appendChild(u)}let r=document.createElement("span");r.className="ng-toolbar__divider",e.appendChild(r);let s=document.createElement("button");s.type="button",s.className="ng-toolbar__btn ng-toolbar__btn--vars",s.textContent="\u53D8\u91CF\u8868",s.addEventListener("click",()=>this._toggleVarsPanel()),e.appendChild(s);let o=document.createElement("span");o.className="ng-toolbar__search";let a=document.createElement("input");a.type="text",a.className="ng-toolbar__search-input",a.placeholder="\u67E5\u627E\u8282\u70B9\u2026",a.value=this._searchQuery,a.addEventListener("input",()=>this._onSearchInput(a.value)),a.addEventListener("keydown",h=>{h.key==="Enter"?(h.preventDefault(),this._stepSearchHit(h.shiftKey?-1:1)):h.key==="Escape"&&(a.value="",this._onSearchInput(""),this.contentEl.focus({preventScroll:!0}))}),o.appendChild(a);let l=document.createElement("span");l.className="ng-toolbar__search-count",o.appendChild(l);let c=document.createElement("button");c.type="button",c.className="ng-toolbar__btn ng-toolbar__btn--search-nav",c.textContent="\u2039",c.title="\u4E0A\u4E00\u6761 (Shift+Enter)",c.addEventListener("click",()=>{this._stepSearchHit(-1),a.focus()}),o.appendChild(c);let d=document.createElement("button");d.type="button",d.className="ng-toolbar__btn ng-toolbar__btn--search-nav",d.textContent="\u203A",d.title="\u4E0B\u4E00\u6761 (Enter)",d.addEventListener("click",()=>{this._stepSearchHit(1),a.focus()}),o.appendChild(d),e.appendChild(o),this._searchInputEl=a,this._searchCountEl=l,this._searchPrevEl=c,this._searchNextEl=d,this._frameEl.appendChild(e)}_nodeSearchText(e){let t=[e.id,e.title,e.body];if(Array.isArray(e.turns))for(let i of e.turns)i&&t.push(i.speaker,i.line);if(Array.isArray(e.choiceOptions))for(let i of e.choiceOptions)i&&t.push(i.label);return Array.isArray(e.choices)&&t.push(...e.choices),t.filter(i=>typeof i=="string"&&i.length>0).join(`
`).toLowerCase()}_onSearchInput(e){this._searchQuery=String(e??""),this._searchIndex=-1,this._refreshSearch()}_refreshSearch(){let e=this._searchQuery.trim().toLowerCase(),t=this._state&&this._state.project&&this._state.project.nodes||[];this._searchHits=e?t.filter(i=>i&&this._nodeSearchText(i).includes(e)).map(i=>i.id):[],this._searchHits.length===0?this._searchIndex=-1:this._searchIndex>=this._searchHits.length&&(this._searchIndex=0),this._applySearchHighlight(),this._updateSearchCount()}_applySearchHighlight(){for(let[,t]of this._nodeEls)t.classList.remove("ng-node--search-hit","ng-node--search-current");let e=this._searchIndex>=0?this._searchHits[this._searchIndex]:null;for(let t of this._searchHits){let i=this._nodeEls.get(t);i&&(i.classList.add("ng-node--search-hit"),t===e&&i.classList.add("ng-node--search-current"))}}_updateSearchCount(){if(!this._searchCountEl)return;this._searchQuery.trim()?this._searchHits.length===0?this._searchCountEl.textContent="0":this._searchIndex>=0?this._searchCountEl.textContent=`${this._searchIndex+1}/${this._searchHits.length}`:this._searchCountEl.textContent=String(this._searchHits.length):this._searchCountEl.textContent="";let e=this._searchHits.length===0;this._searchPrevEl&&(this._searchPrevEl.disabled=e),this._searchNextEl&&(this._searchNextEl.disabled=e)}_focusSearch(){this._searchInputEl&&(this._searchInputEl.focus(),this._searchInputEl.select())}_isActiveView(){let e=this.app&&this.app.workspace;if(!e)return!0;if(typeof e.getActiveViewOfType=="function"){let i=e.getActiveViewOfType(n);if(i)return i===this}let t=e.activeLeaf;return t&&t.view?t.view===this:t&&!t.view?t===this.leaf:!1}_handleDocKeyDown(e){(e.ctrlKey||e.metaKey)&&(e.key!=="f"&&e.key!=="F"||this._isActiveView()&&(e.preventDefault(),e.stopPropagation(),this._focusSearch()))}_stepSearchHit(e){if(this._searchHits.length===0)return;let t=this._searchHits.length;this._searchIndex=((this._searchIndex+e)%t+t)%t,this._applySearchHighlight(),this._updateSearchCount(),this._centerOnNode(this._searchHits[this._searchIndex])}_centerOnNode(e){let t=g.findNode(this._state,e);if(!t||!this._viewport)return;let i=this._sizes.get(e),r=ce(t,i&&i.height),s=this._viewport.getView(),o=this.contentEl.clientWidth>0?this.contentEl.clientWidth:800,a=this.contentEl.clientHeight>0?this.contentEl.clientHeight:600,l=t.x+r.width/2,c=t.y+r.height/2;this._viewport.setView({x:o/2-l*s.scale,y:a/2-c*s.scale,scale:s.scale}),this._persistView(this._viewport.getView(),"search")}_createNode(e){let t=this._frameEl.getBoundingClientRect(),i=$({x:t.width/2,y:t.height/2},this._viewport.getView());try{let r=g.addNode(this._state,e,i.x-g.defaultWidthFor(e)/2,i.y-40);this._afterMutation(),this._setSelection([r.id],null)}catch(r){console.warn("[Narrative Graph] addNode rejected:",r.message)}}_varsPath(){let e=this.plugin&&this.plugin.settings;return e&&e.variablesPath&&e.variablesPath.trim()||F.DEFAULT_VARIABLES_PATH}_toggleVarsPanel(){this._varsPanel||(this._varsPanel=new Xr({onCommit:e=>this._commitVarsEntries(e),onClose:()=>this._toggleVarsPanel()}),this._frameEl&&this._frameEl.appendChild(this._varsPanel.el)),this._varsVisible=!this._varsVisible,this._varsPanel.el.classList.toggle("ng-vars-panel--hidden",!this._varsVisible),this._varsVisible&&this._refreshVarsPanel()}async _refreshVarsPanel(){let e=this.app&&this.app.vault;if(!(!e||typeof e.getAbstractFileByPath!="function"))try{let t=this._varsPath(),i=e.getAbstractFileByPath(t),r;i?r=await e.read(i):(r=F.EMPTY_VARIABLES_FILE,await e.create(t,r));let{entries:s,warnings:o}=F.parseVariablesTable(r);this._varsEntries=s,this._varsPanel&&this._varsPanel.setEntries(s,o)}catch(t){console.warn("[Narrative Graph] \u8BFB\u53D6\u53D8\u91CF\u8868\u5931\u8D25:",t.message)}}_commitVarsEntries(e){this._varsPanel&&this._varsPanel.setWarnings(F.validateEntries(e)),this._varsSaveTimer!==null&&clearTimeout(this._varsSaveTimer),this._varsSaveTimer=setTimeout(()=>{this._varsSaveTimer=null,this._writeVariables(e)},800)}async _writeVariables(e){let t=this.app&&this.app.vault;if(!(!t||typeof t.getAbstractFileByPath!="function"))try{let i=this._varsPath(),r=t.getAbstractFileByPath(i),s=r?await t.read(r):F.EMPTY_VARIABLES_FILE,o=F.serializeVariablesTable(s,e);this._varsLastWrite=o,this._varsEntries=e,r?await t.modify(r,o):await t.create(i,o)}catch(i){console.warn("[Narrative Graph] \u5199\u5165\u53D8\u91CF\u8868\u5931\u8D25:",i.message)}}async _onVariablesFileModified(e){if(!e||e.path!==this._varsPath())return;let t=this.app&&this.app.vault;if(!(!t||typeof t.read!="function"))try{let i=await t.read(e);if(i===this._varsLastWrite)return;let{entries:r,warnings:s}=F.parseVariablesTable(i);this._varsEntries=r,this._varsPanel&&this._varsVisible&&this._varsPanel.setEntries(r,s)}catch(i){console.warn("[Narrative Graph] \u5237\u65B0\u53D8\u91CF\u8868\u5931\u8D25:",i.message)}}async _ensureVarsEntries(){if(this._varsEntries!==null)return;let e=this.app&&this.app.vault;if(!e||typeof e.getAbstractFileByPath!="function"||typeof e.read!="function"){this._varsEntries=[];return}try{let t=e.getAbstractFileByPath(this._varsPath());if(!t){this._varsEntries=[];return}let{entries:i}=F.parseVariablesTable(await e.read(t));this._varsEntries=i}catch(t){console.warn("[Narrative Graph] \u8BFB\u53D6\u53D8\u91CF\u7F13\u5B58\u5931\u8D25:",t.message),this._varsEntries=[]}}async _ensureSpeakers(){this._speakers===null&&(this._speakers=Wr(this.app))}_getVarEntries(){return this._varsEntries||[]}_getSpeakers(){return this._speakers||[]}_onVaultModify(e){e&&e.path===this._varsPath()?this._onVariablesFileModified(e):e&&this._speakers!==null&&e.extension==="md"&&typeof e.path=="string"&&e.path.startsWith("Characters/")&&(this._speakers=null,this._ensureSpeakers())}_setSelection(e,t){this._selectedNodeIds=new Set(e||[]),this._selectedLinkId=t||null,this._applySelectionClasses(),this._setUiSelection()}_applySelectionClasses(){this._clearResizeCursor();for(let e of this.contentEl.querySelectorAll(".is-selected"))e.classList.remove("is-selected");for(let e of this._selectedNodeIds){let t=this._nodeEls.get(e);t&&t.classList.add("is-selected")}if(this._selectedLinkId){let e=this._edgeEls.get(this._selectedLinkId);e&&e.classList.add("is-selected")}}_setUiSelection(){this._state&&((!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={}),this._state.ui.selectedNodeId=this._selectedNodeIds.size>0?this._selectedNodeIds.values().next().value:null,this._state.ui.selectedLinkId=this._selectedLinkId,this._scheduleSave())}_restoreSelection(){if(this._selectedNodeIds.size===0&&!this._selectedLinkId){let e=this._state&&this._state.ui;e&&e.selectedNodeId&&this._nodeEls.has(e.selectedNodeId)?this._selectedNodeIds=new Set([e.selectedNodeId]):e&&e.selectedLinkId&&this._edgeEls.has(e.selectedLinkId)&&(this._selectedLinkId=e.selectedLinkId)}this._applySelectionClasses()}_classifyTarget(e){if(!e||typeof e.closest!="function")return"empty";if(this._editorEl&&this._editorEl.contains(e)||e.closest(".ng-toolbar")||e.closest(".ng-vars-panel"))return"ui";if(e.closest(".ng-port--out"))return"out-port";let t=e.closest(".ng-port--side");if(t){let r=g.findNode(this._state,t.dataset.nodeId);return r&&r.type!=="End"&&r.type!=="Choice"?"port-handle":"in-port"}let i=e.closest("[data-node-id]");return i&&this._nodeEls.get(i.dataset.nodeId)===i?"node":e.closest(".ng-edge-end-handle")?"edge-end-handle":e.closest(".ng-edge")?"edge":"empty"}_shouldPan(e){let t=this._classifyTarget(e.target);return nn({button:e.button,spaceHeld:this._spaceHeld,targetKind:t}).type==="pan"}_portHandleAt(e,t,i){for(let r of e.querySelectorAll(".ng-port--side")){let s=r.getBoundingClientRect(),o=t-(s.left+s.width/2),a=i-(s.top+s.height/2);if(Math.max(Math.abs(o),Math.abs(a))<=10)return r}return null}_handleHoverMove(e){if(this._nodeDrag||this._linkDrag||this._marquee||this._resize||this._endHandleDrag||!this._state||typeof e.target.closest!="function"){this._clearResizeCursor();return}let t=e.target.closest("[data-node-id]"),i=t&&this._nodeEls.get(t.dataset.nodeId)===t?t:null;if(!i){this._clearResizeCursor();return}this._cursorEl&&this._cursorEl!==i&&this._clearResizeCursor(),i.style.cursor=as(an(i.getBoundingClientRect(),e.clientX,e.clientY)),this._cursorEl=i}_clearResizeCursor(){this._cursorEl&&(this._cursorEl.style.cursor=""),this._cursorEl=null}_handlePointerDown(e){let t=e.target;if(typeof t.closest!="function")return;!(this._editorEl&&this._editorEl.contains(document.activeElement))&&!t.closest("input, textarea, select, button, .ng-vars-panel")&&this.contentEl.focus({preventScroll:!0});let r=this._classifyTarget(t),s=!1,o=null,a=null,l=null;if(r==="node"&&e.button===0){let d=t.closest("[data-node-id]");d&&this._nodeEls.get(d.dataset.nodeId)===d&&(a=d.dataset.nodeId,l=this._portHandleAt(d,e.clientX,e.clientY),s=!!l,s||(o=an(d.getBoundingClientRect(),e.clientX,e.clientY)))}switch(nn({button:e.button,spaceHeld:this._spaceHeld,targetKind:r,portHit:s,resizeZone:o}).type){case"node-drag":{let d=t.closest("[data-node-id]");this._startNodeDrag(e,d.dataset.nodeId);break}case"link-drag":{this._startLinkDrag(e,l||t.closest(".ng-port"));break}case"end-handle-drag":{let d=t.closest(".ng-edge");d&&this._startEndHandleDrag(e,d.getAttribute("data-link-id"));break}case"resize-drag":{this._startResize(e,a,o);break}case"marquee":this._startMarquee(e);break;default:break}}_handlePointerMove(e){this._nodeDrag?this._moveNodeDrag(e):this._linkDrag?this._moveLinkDrag(e):this._marquee?this._moveMarquee(e):this._resize?this._moveResize(e):this._endHandleDrag&&this._moveEndHandleDrag(e)}_handlePointerUp(e){this._nodeDrag?this._endNodeDrag(e):this._linkDrag?this._endLinkDrag(e):this._marquee?this._endMarquee(e):this._resize?this._endResize(e):this._endHandleDrag&&this._endEndHandleDrag(e)}_cancelDrags(){if(this._untrackDrag(),this._nodeDrag=null,this._linkDrag&&(this._linkDrag.ghost.remove(),this._linkDrag=null,this._frameEl&&this._frameEl.classList.remove("ng-canvas--link-drag")),this._marquee&&(this._marquee.rectEl.remove(),this._marquee=null),this._resize){let e=this._resize;this._resize=null;let t=g.findNode(this._state,e.nodeId);if(t&&e.moved){let i=e.origFields;t.x=i.x,t.y=i.y,i.width===void 0?delete t.width:t.width=i.width,i.height===void 0?delete t.height:t.height=i.height,i.manualSize===void 0?delete t.manualSize:t.manualSize=i.manualSize,this._rerenderPreservingCamera()}}if(this._endHandleDrag){let e=this._endHandleDrag;this._endHandleDrag=null;let t=this._state&&g.findLink(this._state,e.linkId);t&&e.moved&&(e.hadToPort?t.toPort={...e.origToPort}:delete t.toPort,this._relayoutLink(e.linkId))}}_startNodeDrag(e,t){if(e.shiftKey)return;let i=Zr(this._selectedNodeIds,t,!1);(i.length!==this._selectedNodeIds.size||i.some(a=>!this._selectedNodeIds.has(a)))&&this._setSelection(i,null);let r=[...this._selectedNodeIds].filter(a=>g.findNode(this._state,a)),s=new Map;for(let a of r){let l=g.findNode(this._state,a);s.set(a,{x:l.x,y:l.y})}let o=(this._state.project.links||[]).filter(a=>a&&(this._selectedNodeIds.has(a.from)||this._selectedNodeIds.has(a.to))).map(a=>a.id);this._nodeDrag={pointerId:e.pointerId,dragIds:r,starts:s,linkIds:o,startClientX:e.clientX,startClientY:e.clientY,scale:this._viewport.getView().scale,moved:!1},this._trackDrag()}_moveNodeDrag(e){let t=this._nodeDrag;if(e.pointerId!==t.pointerId)return;let i=(e.clientX-t.startClientX)/t.scale,r=(e.clientY-t.startClientY)/t.scale;Math.abs(i)+Math.abs(r)>1&&(t.moved=!0);for(let o of t.dragIds){let a=g.findNode(this._state,o),l=t.starts.get(o);a.x=Math.round(l.x+i),a.y=Math.round(l.y+r);let c=this._nodeEls.get(o);c&&(c.style.left=`${a.x}px`,c.style.top=`${a.y}px`)}let s=new Map(this._state.project.nodes.map(o=>[o.id,o]));for(let o of t.linkIds){let a=g.findLink(this._state,o),l=this._edgeEls.get(o),c=a&&le(a,s,this._sizes);l&&c&&de(l,c)}}_endNodeDrag(e){let t=this._nodeDrag;if(this._nodeDrag=null,this._untrackDrag(),t&&t.moved){this._dragEndedAt=Date.now();for(let i of t.dragIds){let r=g.findNode(this._state,i);if(!r)continue;r.x=Math.round(r.x/8)*8,r.y=Math.round(r.y/8)*8;let s=this._nodeEls.get(i);s&&(s.style.left=`${r.x}px`,s.style.top=`${r.y}px`)}this._recordHistory(),this._scheduleSave()}}_startMarquee(e){let t=document.createElement("div");t.className="ng-marquee",this._frameEl.appendChild(t),this._marquee={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,additive:!!e.shiftKey,rectEl:t,moved:!1},this._trackDrag()}_moveMarquee(e){let t=this._marquee;if(e.pointerId!==t.pointerId)return;let i=this._frameEl.getBoundingClientRect(),r={x:t.startX-i.left,y:t.startY-i.top},s={x:e.clientX-i.left,y:e.clientY-i.top};Math.abs(s.x-r.x)+Math.abs(s.y-r.y)>3&&(t.moved=!0);let o=rn(r,s);t.rectEl.style.left=`${o.x0}px`,t.rectEl.style.top=`${o.y0}px`,t.rectEl.style.width=`${o.x1-o.x0}px`,t.rectEl.style.height=`${o.y1-o.y0}px`}_endMarquee(e){let t=this._marquee;if(this._marquee=null,this._untrackDrag(),!t||(t.rectEl.remove(),!t.moved))return;this._dragEndedAt=Date.now();let i=t.additive||!!e.shiftKey,r=this._frameEl.getBoundingClientRect(),s=this._viewport.getView(),o=$({x:t.startX-r.left,y:t.startY-r.top},s),a=$({x:e.clientX-r.left,y:e.clientY-r.top},s),l=rs(this._state.project.nodes||[],rn(o,a),this._sizes),c=Jr(this._selectedNodeIds,l,i);this._setSelection(c,null)}_startLinkDrag(e,t){let i=t.dataset.nodeId,r=t.dataset.optionId||null,s=t.dataset.side||null,o=t.getBoundingClientRect(),a=this._frameEl.getBoundingClientRect(),l=this._viewport.getView(),c=$({x:o.left+o.width/2-a.left,y:o.top+o.height/2-a.top},l),d=document.createElementNS("http://www.w3.org/2000/svg","path");d.setAttribute("class","ng-edge__ghost"),this._svgEl.appendChild(d),this._frameEl.classList.add("ng-canvas--link-drag"),this._linkDrag={pointerId:e.pointerId,fromId:i,optionId:r,fromSide:s,start:c,ghost:d},this._trackDrag()}_moveLinkDrag(e){let t=this._linkDrag;if(e.pointerId!==t.pointerId)return;let i=this._frameEl.getBoundingClientRect(),r=$({x:e.clientX-i.left,y:e.clientY-i.top},this._viewport.getView()),s=t.fromSide||"right",{d:o}=is({x:t.start.x,y:t.start.y,side:s},{x:r.x,y:r.y,side:ss(s)});t.ghost.setAttribute("d",o)}_hitTestLinkTarget(e,t){let i=typeof document.elementFromPoint=="function"?document.elementFromPoint(e,t):null;if(!i||typeof i.closest!="function")return null;let r=i.closest(".ng-port--side");if(r&&this._nodeEls.has(r.dataset.nodeId)){let o=g.findNode(this._state,r.dataset.nodeId);if(o&&o.type!=="Entry"){let a=parseFloat(r.dataset.t);return{nodeId:r.dataset.nodeId,side:r.dataset.side,t:Number.isFinite(a)?a:.5}}return null}let s=i.closest("[data-node-id]");if(s&&this._nodeEls.get(s.dataset.nodeId)===s){let o=g.findNode(this._state,s.dataset.nodeId);if(!o||o.type==="Entry")return null;let a=this._frameEl.getBoundingClientRect(),l=$({x:e-a.left,y:t-a.top},this._viewport.getView()),c=this._sizes.get(o.id),d=ce(o,c&&c.height),h=sn(o,d,l);return{nodeId:o.id,side:h,t:on(o,d,h,l)}}return null}_endLinkDrag(e){let t=this._linkDrag;if(this._linkDrag=null,this._untrackDrag(),this._frameEl&&this._frameEl.classList.remove("ng-canvas--link-drag"),!t)return;t.ghost.remove();let i=this._hitTestLinkTarget(e.clientX,e.clientY);if(i)try{g.addLink(this._state,t.fromId,i.nodeId,t.optionId,{fromSide:t.fromSide,toSide:i.side,toT:i.t}),this._afterMutation()}catch(r){console.warn("[Narrative Graph] addLink rejected:",r.message)}}_relayoutLink(e){if(!this._state)return;let t=g.findLink(this._state,e),i=this._edgeEls.get(e);if(!t||!i)return;let r=new Map(this._state.project.nodes.map(o=>[o.id,o])),s=le(t,r,this._sizes);s&&de(i,s)}_startEndHandleDrag(e,t){let i=g.findLink(this._state,t);if(!i)return;let r=g.findNode(this._state,i.to);r&&(this._endHandleDrag={pointerId:e.pointerId,linkId:t,nodeId:r.id,hadToPort:!!i.toPort,origToPort:i.toPort?{side:i.toPort.side,t:i.toPort.t}:null,moved:!1},this._trackDrag())}_moveEndHandleDrag(e){let t=this._endHandleDrag;if(e.pointerId!==t.pointerId)return;let i=g.findLink(this._state,t.linkId),r=g.findNode(this._state,t.nodeId);if(!i||!r)return;let s=this._frameEl.getBoundingClientRect(),o=$({x:e.clientX-s.left,y:e.clientY-s.top},this._viewport.getView()),a=this._sizes.get(r.id),l=ce(r,a&&a.height),c=sn(r,l,o),d=on(r,l,c,o);i.toPort={side:c,t:d},t.moved=!0,this._relayoutLink(t.linkId)}_endEndHandleDrag(e){let t=this._endHandleDrag;if(this._endHandleDrag=null,this._untrackDrag(),!(!t||!t.moved)){this._dragEndedAt=Date.now();try{let i=g.findLink(this._state,t.linkId);g.setLinkToPort(this._state,t.linkId,i&&i.toPort),this._afterMutation(),this._setSelection([],t.linkId)}catch(i){console.warn("[Narrative Graph] setLinkToPort rejected:",i.message)}}}_startResize(e,t,i){if(!t||!i||!this._nodeEls.get(t))return;let s=g.findNode(this._state,t);if(!s)return;this._selectedNodeIds.has(t)||this._setSelection([t],null);let o=this._sizes.get(t),a=ce(s,o&&o.height);this._resize={pointerId:e.pointerId,nodeId:t,dir:i,startRect:{x:s.x,y:s.y,width:a.width,height:a.height},origFields:{x:s.x,y:s.y,width:s.width,height:s.height,manualSize:s.manualSize},startClientX:e.clientX,startClientY:e.clientY,scale:this._viewport.getView().scale,moved:!1},this._trackDrag()}_moveResize(e){let t=this._resize;if(e.pointerId!==t.pointerId)return;let i=(e.clientX-t.startClientX)/t.scale,r=(e.clientY-t.startClientY)/t.scale;Math.abs(i)+Math.abs(r)>1&&(t.moved=!0);let s=os(t.startRect,t.dir,i,r),o=g.findNode(this._state,t.nodeId);if(!o)return;o.x=s.x,o.y=s.y,o.width=s.width,o.height=s.height;let a=this._nodeEls.get(t.nodeId);a&&(a.classList.add("ng-node--fixed"),a.style.left=`${o.x}px`,a.style.top=`${o.y}px`,a.style.width=`${o.width}px`,a.style.height=`${o.height}px`);let l=this._sizes.get(t.nodeId)||{};this._sizes.set(t.nodeId,{width:s.width,height:s.height,optionT:l.optionT});let c=new Map(this._state.project.nodes.map(d=>[d.id,d]));for(let d of this._state.project.links||[]){if(!d||d.from!==t.nodeId&&d.to!==t.nodeId)continue;let h=this._edgeEls.get(d.id),u=le(d,c,this._sizes);h&&u&&de(h,u)}}_endResize(e){let t=this._resize;if(this._resize=null,this._untrackDrag(),!t||!t.moved)return;this._dragEndedAt=Date.now();let i=g.findNode(this._state,t.nodeId);i&&(g.resizeNode(this._state,t.nodeId,{x:i.x,y:i.y,width:i.width,height:i.height}),this._afterMutation())}_trackDrag(){document.addEventListener("pointermove",this._onPointerMove),document.addEventListener("pointerup",this._onPointerUp),document.addEventListener("pointercancel",this._onPointerUp)}_untrackDrag(){document.removeEventListener("pointermove",this._onPointerMove),document.removeEventListener("pointerup",this._onPointerUp),document.removeEventListener("pointercancel",this._onPointerUp)}_handleClick(e){if(Date.now()-this._dragEndedAt<150)return;let t=e.target;if(typeof t.closest!="function"||this._editorEl&&this._editorEl.contains(t)||t.closest(".ng-toolbar")||t.closest(".ng-port")||t.closest(".ng-resize")||t.closest(".ng-vars-panel"))return;let i=t.closest("[data-node-id]");if(i&&this._nodeEls.get(i.dataset.nodeId)===i){if(e.shiftKey){let s=new Set(this._selectedNodeIds);s.has(i.dataset.nodeId)?s.delete(i.dataset.nodeId):s.add(i.dataset.nodeId),this._setSelection([...s],null)}else this._setSelection([i.dataset.nodeId],null);return}let r=t.closest(".ng-edge");if(r){this._setSelection([],r.getAttribute("data-link-id"));return}this._setSelection([],null)}_handleDblClick(e){if(Date.now()-this._dragEndedAt<150)return;let t=e.target;if(typeof t.closest!="function"||this._editorEl&&this._editorEl.contains(t)||t.closest(".ng-resize"))return;let i=t.closest("[data-node-id]");if(i&&this._nodeEls.get(i.dataset.nodeId)===i){this._openNodeEditor(i.dataset.nodeId);return}let r=t.closest(".ng-edge");r&&this._openLinkEditor(r.getAttribute("data-link-id"),e)}_closeEditor(){this._editorEl&&(this._editorEl.remove(),this._editorEl=null)}_placeEditor(e,t,i){this._closeEditor();let r=this._frameEl.getBoundingClientRect(),s=Math.max(0,r.width-340),o=Math.max(0,r.height-120);e.style.left=`${Math.min(Math.max(0,t),s)}px`,e.style.top=`${Math.min(Math.max(0,i),o)}px`,this._frameEl.appendChild(e),this._editorEl=e;let a=e.querySelector("input, textarea");a&&a.focus()}_openNodeEditor(e){let t=g.findNode(this._state,e);if(!t)return;let i=Yr(t,{onCommit:s=>{this._closeEditor();try{g.setNodeTitle(this._state,e,s.title),s.turns&&g.setTurns(t,s.turns),s.body!==void 0&&g.setNodeBody(this._state,e,s.body),s.options&&g.setChoiceOptions(t,s.options,this._state.project.nodes)}catch(o){console.warn("[Narrative Graph] edit rejected:",o.message)}this._afterMutation(),this._setSelection([e],null)},onCancel:()=>this._closeEditor(),getVariables:()=>this._getVarEntries(),getSpeakers:()=>this._getSpeakers()}),r=ns({x:t.x,y:t.y},this._viewport.getView());this._placeEditor(i,r.x,r.y)}_openLinkEditor(e,t){let i=g.findLink(this._state,e);if(!i)return;let r=Gr(i,{onCommit:o=>{this._closeEditor();try{g.setLinkRequirements(this._state,e,o)}catch(a){console.warn("[Narrative Graph] edit rejected:",a.message)}this._afterMutation(),this._setSelection([],e)},onCancel:()=>this._closeEditor(),getVariables:()=>this._getVarEntries()}),s=this._frameEl.getBoundingClientRect();this._placeEditor(r,t.clientX-s.left,t.clientY-s.top)}_isTypingTarget(e){return!!(e&&typeof e.closest=="function"&&e.closest("input, textarea, select, [contenteditable]"))}_handleKeyDown(e){if(e.key===" "&&!this._isTypingTarget(e.target)){this._spaceHeld=!0,e.preventDefault(),this._frameEl&&this._frameEl.classList.add("ng-canvas--space");return}if(!this._isTypingTarget(e.target)){if(e.ctrlKey||e.metaKey){if(this._editorEl)return;let t=e.key.toLowerCase();t==="z"&&!e.shiftKey?(e.preventDefault(),this._undo()):t==="z"&&e.shiftKey||t==="y"?(e.preventDefault(),this._redo()):t==="c"?this._copySelection()&&e.preventDefault():t==="v"&&(e.preventDefault(),this._pasteClipboard());return}if(e.key==="Escape"){this._cancelDrags();return}if(!(e.key!=="Delete"&&e.key!=="Backspace")&&!this._editorEl&&this._state){if(this._selectedNodeIds.size>0){let t=g.entryNodes(this._state).length,i=0,r=0,s=t;for(let o of[...this._selectedNodeIds]){let a=g.findNode(this._state,o);if(a){if(a.type==="Entry"&&s<=1){i++;continue}a.type==="Entry"&&s--;try{g.deleteNode(this._state,o),this._selectedNodeIds.delete(o),r++}catch(l){console.warn("[Narrative Graph] deleteNode rejected:",l.message)}}}i>0&&console.warn(`[Narrative Graph] skipped ${i} Entry node(s) \u2014 file must keep one Entry`),r>0&&(this._setUiSelection(),this._afterMutation())}else if(this._selectedLinkId)try{g.deleteLink(this._state,this._selectedLinkId),this._setSelection([],null),this._afterMutation()}catch(t){console.warn("[Narrative Graph] deleteLink rejected:",t.message)}e.preventDefault()}}}_handleKeyUp(e){e.key===" "&&(this._spaceHeld=!1,this._frameEl&&this._frameEl.classList.remove("ng-canvas--space"))}async _clipboardWrite(e){try{let t=typeof window<"u"?window.navigator:null;if(t&&t.clipboard&&typeof t.clipboard.writeText=="function")return await t.clipboard.writeText(e),!0}catch{}try{let t=require("electron");if(t&&t.clipboard)return t.clipboard.writeText(e),!0}catch{}return console.warn("[Narrative Graph] \u5199\u5165\u7CFB\u7EDF\u526A\u8D34\u677F\u5931\u8D25"),!1}async _clipboardRead(){try{let e=typeof window<"u"?window.navigator:null;if(e&&e.clipboard&&typeof e.clipboard.readText=="function")return await e.clipboard.readText()}catch{}try{let e=require("electron");if(e&&e.clipboard)return e.clipboard.readText()}catch{}return null}_copySelection(){if(!this._state||this._selectedNodeIds.size===0)return!1;let e=qe.encodeSelection(this._state,[...this._selectedNodeIds]);return e?(this._clipboardWrite(JSON.stringify(e)),!0):!1}async _pasteClipboard(){if(!this._state)return;let e=await this._clipboardRead(),t=e?qe.parseEnvelopeText(e):null;if(!t){new Oe("\u526A\u8D34\u677F\u4E2D\u6CA1\u6709\u53EF\u7C98\u8D34\u7684\u8282\u70B9");return}let i=this._frameEl.getBoundingClientRect(),r=$({x:i.width/2,y:i.height/2},this._viewport.getView());try{let s=qe.applyPaste(this._state,t,{center:r,knownVariables:this._getVarEntries().map(o=>o&&o.name)});if(s.addedNodeIds.length===0)return;this._afterMutation(),this._setSelection(s.addedNodeIds,null),s.downgradedEntry>0&&new Oe("\u7C98\u8D34\u7684 Entry \u8282\u70B9\u5DF2\u964D\u7EA7\u4E3A Content\uFF08\u6BCF\u4E2A\u6587\u4EF6\u53EA\u80FD\u6709\u4E00\u4E2A Entry\uFF09"),s.missingVariables.length>0&&new Oe(`\u7C98\u8D34\u7684\u5185\u5BB9\u5F15\u7528\u4E86 ${s.missingVariables.length} \u4E2A\u672A\u767B\u8BB0\u7684\u5168\u5C40\u53D8\u91CF\uFF1A`+s.missingVariables.join("\u3001"))}catch(s){console.warn("[Narrative Graph] paste rejected:",s.message)}}_undo(){if(!this._history||!this._historyBaseline||!this._state)return;let e=V.undo(this._history,this._historyBaseline);e&&this._applyHistorySnapshot(e.snapshot)}_redo(){if(!this._history||!this._historyBaseline||!this._state)return;let e=V.redo(this._history,this._historyBaseline);e&&this._applyHistorySnapshot(e.snapshot)}_applyHistorySnapshot(e){let t=V.takeSnapshot({project:e.project,ui:e.ui});this._state.project=t.project,(!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={});let i=t.ui||{};this._state.ui.selectedNodeId=i.selectedNodeId!=null?i.selectedNodeId:null,this._state.ui.selectedLinkId=i.selectedLinkId!=null?i.selectedLinkId:null;let r=this._state.project.nodes||[],s=this._state.project.links||[];this._selectedNodeIds=new Set(this._state.ui.selectedNodeId&&r.some(o=>o&&o.id===this._state.ui.selectedNodeId)?[this._state.ui.selectedNodeId]:[]),this._selectedLinkId=this._state.ui.selectedLinkId&&s.some(o=>o&&o.id===this._state.ui.selectedLinkId)?this._state.ui.selectedLinkId:null,this._historyBaseline=V.takeSnapshot(this._state),this._rerenderPreservingCamera(),this._scheduleSave()}_persistView(e,t){this._state&&((!this._state.ui||typeof this._state.ui!="object")&&(this._state.ui={}),this._state.ui.view={x:e.x,y:e.y,scale:e.scale},t==="pan"&&(this._dragEndedAt=Date.now()),this._scheduleSave())}_scheduleSave(){this._saveTimer!==null&&clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{this._saveTimer=null,this.requestSave()},dn)}};cn.exports={NarrativeGraphView:Ve,VIEW_TYPE_NARRATIVE_GRAPH:ln,SAVE_DEBOUNCE:dn}});var fn=b((Vs,pn)=>{var{PluginSettingTab:ls,Setting:ds}=require("obsidian"),{DEFAULT_VARIABLES_PATH:un}=G(),cs=Object.freeze({variablesPath:un}),Fe=class extends ls{constructor(e,t){super(e,t),this.plugin=t}display(){let{containerEl:e}=this;e.empty(),new ds(e).setName("\u5168\u5C40\u53D8\u91CF\u8868\u8DEF\u5F84").setDesc("\u53D8\u91CF\u8868\u9762\u677F\u8BFB\u5199\u3001\u4EE5\u53CA narrative-tool \u5BFC\u51FA\u5408\u5E76\u7684\u5168\u5C40\u53D8\u91CF\u8868\uFF08markdown \u8868\u683C\uFF1A\u53D8\u91CF|\u7C7B\u578B|\u521D\u59CB\u503C|\u5907\u6CE8\uFF09\u3002").addText(t=>t.setPlaceholder(un).setValue(this.plugin.settings.variablesPath).onChange(async i=>{this.plugin.settings.variablesPath=i,await this.plugin.saveSettings()}))}};pn.exports={DEFAULT_SETTINGS:cs,NarrativeGraphSettingTab:Fe}});var gn=b((Fs,hs)=>{hs.exports=`/* Narrative Graph \u2014 canvas view styles (Phase 11 M1a, NG-08/NG-09) */

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
`});var{Plugin:us,Notice:X}=require("obsidian"),{NarrativeGraphView:$e,VIEW_TYPE_NARRATIVE_GRAPH:_n}=hn(),{DEFAULT_SETTINGS:ps,NarrativeGraphSettingTab:fs}=fn(),W=G(),gs=gn(),_s="narrative-graph-styles";module.exports=class extends us{async onload(){console.log("[Narrative Graph] loaded v"+this.manifest.version),await this.loadSettings(),this.addSettingTab(new fs(this.app,this));let e=document.createElement("style");e.id=_s,e.textContent=gs,document.head.appendChild(e),this.register(()=>e.remove()),this.registerView(_n,t=>{let i=new $e(t);return i.plugin=this,i}),this.registerExtensions(["ncanvas"],_n),this.addCommand({id:"merge-file-variables",name:"\u5C06\u5F53\u524D\u5BF9\u8BDD\u7684\u5C40\u90E8\u53D8\u91CF\u5E76\u5165\u5168\u5C40\u8868",callback:()=>this.mergeFileVariablesIntoGlobal()})}async loadSettings(){this.settings=Object.assign({},ps,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}_activeGraphView(){if(typeof this.app.workspace.getActiveViewOfType=="function"){let t=this.app.workspace.getActiveViewOfType($e);if(t)return t}let e=this.app.workspace.activeLeaf;return e&&e.view instanceof $e?e.view:null}async mergeFileVariablesIntoGlobal(){let e=this._activeGraphView();if(!e||!e._state||!e._state.project){new X("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A .ncanvas \u5BF9\u8BDD\u6587\u4EF6");return}let t=e._state.project,i=t.variables&&typeof t.variables=="object"?t.variables:{};if(Object.keys(i).length===0){new X("\u5F53\u524D\u6587\u4EF6\u6CA1\u6709\u5C40\u90E8\u53D8\u91CF\u53EF\u5E76\u5165");return}try{let r=this.settings.variablesPath&&this.settings.variablesPath.trim()||W.DEFAULT_VARIABLES_PATH,s=this.app.vault.getAbstractFileByPath(r),o;s?o=await this.app.vault.read(s):(o=W.EMPTY_VARIABLES_FILE,await this.app.vault.create(r,o),s=this.app.vault.getAbstractFileByPath(r));let{entries:a}=W.parseVariablesTable(o),l=W.mergeFileVariables(a,i);if(l.length===0){new X("\u6240\u6709\u5C40\u90E8\u53D8\u91CF\u5DF2\u5B58\u5728\u4E8E\u5168\u5C40\u8868\uFF0C\u65E0\u9700\u5E76\u5165");return}let c=W.serializeVariablesTable(o,a.concat(l));await this.app.vault.modify(s,c);for(let d of l)delete t.variables[d.name];e._afterMutation(),new X(`\u5DF2\u5E76\u5165 ${l.length} \u4E2A\u53D8\u91CF\u5230 ${r}\uFF1A`+l.map(d=>d.name).join("\u3001"))}catch(r){console.warn("[Narrative Graph] \u5408\u5E76\u53D8\u91CF\u5931\u8D25:",r.message),new X(`\u5408\u5E76\u53D8\u91CF\u5931\u8D25\uFF1A${r.message}`)}}};
