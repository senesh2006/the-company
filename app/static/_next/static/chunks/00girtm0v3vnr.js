(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,98183,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={assign:function(){return l},searchParamsToUrlQuery:function(){return o},urlQueryToSearchParams:function(){return i}};for(var n in a)Object.defineProperty(r,n,{enumerable:!0,get:a[n]});function o(e){let t={};for(let[r,a]of e.entries()){let e=t[r];void 0===e?t[r]=a:Array.isArray(e)?e.push(a):t[r]=[e,a]}return t}function s(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function i(e){let t=new URLSearchParams;for(let[r,a]of Object.entries(e))if(Array.isArray(a))for(let e of a)t.append(r,s(e));else t.set(r,s(a));return t}function l(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,a]of r.entries())e.append(t,a)}return e}},18967,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={DecodeError:function(){return g},MiddlewareNotFoundError:function(){return k},MissingStaticPage:function(){return v},NormalizeError:function(){return x},PageNotFoundError:function(){return b},SP:function(){return m},ST:function(){return y},WEB_VITALS:function(){return o},execOnce:function(){return s},getDisplayName:function(){return d},getLocationOrigin:function(){return u},getURL:function(){return c},isAbsoluteUrl:function(){return l},isResSent:function(){return f},loadGetInitialProps:function(){return h},normalizeRepeatedSlashes:function(){return p},stringifyError:function(){return _}};for(var n in a)Object.defineProperty(r,n,{enumerable:!0,get:a[n]});let o=["CLS","FCP","FID","INP","LCP","TTFB"];function s(e){let t,r=!1;return(...a)=>(r||(r=!0,t=e(...a)),t)}let i=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>i.test(e);function u(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function c(){let{href:e}=window.location,t=u();return e.substring(t.length)}function d(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function f(e){return e.finished||e.headersSent}function p(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function h(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await h(t.Component,t.ctx)}:{};let a=await e.getInitialProps(t);if(r&&f(r))return a;if(!a)throw Object.defineProperty(Error(`"${d(e)}.getInitialProps()" should resolve to an object. But found "${a}" instead.`),"__NEXT_ERROR_CODE",{value:"E1025",enumerable:!1,configurable:!0});return a}let m="u">typeof performance,y=m&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class g extends Error{}class x extends Error{}class b extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class v extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class k extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function _(e){return JSON.stringify({message:e.message,stack:e.stack})}},33525,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},7670,e=>{"use strict";e.s(["clsx",0,function(){for(var e,t,r=0,a="",n=arguments.length;r<n;r++)(e=arguments[r])&&(t=function e(t){var r,a,n="";if("string"==typeof t||"number"==typeof t)n+=t;else if("object"==typeof t)if(Array.isArray(t)){var o=t.length;for(r=0;r<o;r++)t[r]&&(a=e(t[r]))&&(n&&(n+=" "),n+=a)}else for(a in t)t[a]&&(n&&(n+=" "),n+=a);return n}(e))&&(a&&(a+=" "),a+=t);return a}])},84026,e=>{"use strict";let t=(0,e.i(56420).default)("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);e.s(["ShieldCheck",0,t],84026)},4139,e=>{"use strict";let t=(0,e.i(56420).default)("terminal",[["path",{d:"M12 19h8",key:"baeox8"}],["path",{d:"m4 17 6-6-6-6",key:"1yngyt"}]]);e.s(["Terminal",0,t],4139)},16327,e=>{"use strict";let t=(0,e.i(56420).default)("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);e.s(["ChevronDown",0,t],16327)},74544,e=>{"use strict";let t=(0,e.i(56420).default)("clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]);e.s(["Clock",0,t],74544)},35829,e=>{"use strict";let t=(0,e.i(56420).default)("minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);e.s(["Minus",0,t],35829)},94690,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(7471),n=e.i(9165);let o=(0,r.createContext)(void 0);e.s(["AuthProvider",0,function({children:e}){let[s,i]=(0,r.useState)(null),[l,u]=(0,r.useState)(null),[c,d]=(0,r.useState)(!0),[f,p]=(0,r.useState)((0,a.isSupabaseConfigured)()),h=(0,r.useCallback)(async()=>{if((0,a.isSupabaseConfigured)())return a.supabase;try{let e=await fetch(`${(0,n.getBaseUrl)()}/api/v1/config`);if(e.ok){let t=await e.json();if(t?.supabaseUrl&&t?.supabaseKey&&!t.supabaseUrl.includes("placeholder-project")){let e=(0,a.updateSupabaseClient)(t.supabaseUrl,t.supabaseKey);return p(!0),e}}}catch(e){console.warn("Could not load runtime Supabase config:",e)}return a.supabase},[]),m=()=>{{let e=localStorage.getItem("companyos_demo_token"),t=localStorage.getItem("companyos_demo_user"),r=localStorage.getItem("companyos_demo_biz_id")||"00000000-0000-0000-0000-000000000001";if(e)try{let a=t?JSON.parse(t):{},n={id:a.id||r,email:a.email||"demo@thecompany.ai",business_id:r,user_metadata:a.user_metadata||{full_name:"Demo Evaluator / Judge",is_demo:!0},app_metadata:{provider:"demo_1click_access",role:"authenticated"},aud:"authenticated",created_at:new Date().toISOString()},o={access_token:e,token_type:"bearer",user:n,expires_in:604800,expires_at:Math.floor(Date.now()/1e3)+604800};return i(n),u(o),!0}catch(e){console.warn("Error restoring demo session:",e)}}return!1};(0,r.useEffect)(()=>{let e;return(async()=>{let t=await h();if(!(0,a.isSupabaseConfigured)()){m()||(i(null),u(null)),d(!1);return}try{let{data:e}=await t.auth.getSession();e?.session?(u(e.session),i(e.session.user),window.location.hash.includes("access_token")&&window.history.replaceState(null,"",window.location.pathname)):m()||(u(null),i(null))}catch(e){console.error("Failed to get Supabase session:",e),m()}finally{d(!1)}let{data:{subscription:r}}=t.auth.onAuthStateChange((e,t)=>{t?(u(t),i(t?.user??null),d(!1),window.location.hash.includes("access_token")&&window.history.replaceState(null,"",window.location.pathname)):(m()||(u(null),i(null)),d(!1))});e=()=>r.unsubscribe()})(),()=>{e&&e()}},[h]);let y=async(e,t)=>{localStorage.removeItem("companyos_logged_out"),localStorage.removeItem("companyos_demo_token"),localStorage.removeItem("companyos_demo_user");let r=await h();if(!(0,a.isSupabaseConfigured)())return{error:{message:"Authentication is not configured"}};let{error:n}=await r.auth.signInWithPassword({email:e,password:t});return{error:n}},g=async(e,t,r)=>{localStorage.removeItem("companyos_logged_out"),localStorage.removeItem("companyos_demo_token"),localStorage.removeItem("companyos_demo_user");let n=await h();if(!(0,a.isSupabaseConfigured)())return{error:{message:"Authentication is not configured"}};let{error:o}=await n.auth.signUp({email:e,password:t,options:{data:{full_name:r||e.split("@")[0]}}});return{error:o}},x=async(e,t)=>{localStorage.removeItem("companyos_logged_out"),localStorage.removeItem("companyos_demo_token"),localStorage.removeItem("companyos_demo_user");let r=await h();if(!(0,a.isSupabaseConfigured)())return{error:{message:"Authentication is not configured"}};let n=window.location.origin,o=t||"/",s=n?`${n}${o.startsWith("/")?o:`/${o}`}`:void 0,{error:i}=await r.auth.signInWithOAuth({provider:e,options:{redirectTo:s}});return{error:i}},b=async()=>{localStorage.removeItem("companyos_logged_out");try{let e=await n.api.demoLogin();if(e?.access_token){let t=e.business_id||"00000000-0000-0000-0000-000000000001";localStorage.setItem("companyos_demo_token",e.access_token),localStorage.setItem("companyos_demo_user",JSON.stringify(e.user)),localStorage.setItem("companyos_demo_biz_id",t);let r={id:e.user?.id||t,email:e.user?.email||"demo@thecompany.ai",business_id:t,user_metadata:e.user?.user_metadata||{full_name:"Demo Evaluator / Judge",is_demo:!0},app_metadata:{provider:"demo_1click_access",role:"authenticated"},aud:"authenticated",created_at:new Date().toISOString()},a={access_token:e.access_token,token_type:"bearer",user:r,expires_in:604800,expires_at:Math.floor(Date.now()/1e3)+604800};return i(r),u(a),{success:!0}}return{error:{message:"No access token received from demo login endpoint."}}}catch(e){return console.error("Demo login error:",e),{error:{message:e?.message||"Failed to initialize 1-click demo access."}}}},v=async()=>{try{let e=await h();(0,a.isSupabaseConfigured)()&&await e.auth.signOut()}catch(e){console.error("Signout error:",e)}i(null),u(null),localStorage.setItem("companyos_logged_out","true"),localStorage.removeItem("companyos_demo_token"),localStorage.removeItem("companyos_demo_user"),localStorage.removeItem("companyos_demo_biz_id"),sessionStorage.clear(),window.location.href="/login"};return(0,t.jsx)(o.Provider,{value:{user:s,session:l,isLoading:c,isConfigured:f,signInWithPassword:y,signUpWithPassword:g,signInWithOAuth:x,signInAsDemo:b,signOut:v},children:e})},"useAuth",0,function(){let e=(0,r.useContext)(o);if(void 0===e)throw Error("useAuth must be used within an AuthProvider");return e}])},63676,e=>{"use strict";let t=(0,e.i(56420).default)("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);e.s(["X",0,t],63676)},7219,e=>{"use strict";let t=(0,e.i(56420).default)("trending-up",[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]]);e.s(["TrendingUp",0,t],7219)},71567,e=>{"use strict";let t=(0,e.i(56420).default)("bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);e.s(["Bot",0,t],71567)},65489,e=>{"use strict";let t=(0,e.i(56420).default)("megaphone",[["path",{d:"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",key:"q8bfy3"}],["path",{d:"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14",key:"1853fq"}],["path",{d:"M8 6v8",key:"15ugcq"}]]);e.s(["Megaphone",0,t],65489)},81193,e=>{"use strict";let t=(0,e.i(56420).default)("briefcase",[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]]);e.s(["Briefcase",0,t],81193)},24071,e=>{"use strict";let t=(0,e.i(56420).default)("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);e.s(["ChevronLeft",0,t],24071)},18566,(e,t,r)=>{t.exports=e.r(76562)},68877,e=>{"use strict";let t=(0,e.i(56420).default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["ArrowRight",0,t],68877)},95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={formatUrl:function(){return i},formatWithValidation:function(){return u},urlObjectKeys:function(){return l}};for(var n in a)Object.defineProperty(r,n,{enumerable:!0,get:a[n]});let o=e.r(90809)._(e.r(98183)),s=/https?|ftp|gopher|file/;function i(e){let{auth:t,hostname:r}=e,a=e.protocol||"",n=e.pathname||"",i=e.hash||"",l=e.query||"",u=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?u=t+e.host:r&&(u=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(u+=":"+e.port)),l&&"object"==typeof l&&(l=String(o.urlQueryToSearchParams(l)));let c=e.search||l&&`?${l}`||"";return a&&!a.endsWith(":")&&(a+=":"),e.slashes||(!a||s.test(a))&&!1!==u?(u="//"+(u||""),n&&"/"!==n[0]&&(n="/"+n)):u||(u=""),i&&"#"!==i[0]&&(i="#"+i),c&&"?"!==c[0]&&(c="?"+c),n=n.replace(/[?#]/g,encodeURIComponent),c=c.replace("#","%23"),`${a}${u}${n}${c}${i}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function u(e){return i(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return n}});let a=e.r(71645);function n(e,t){let r=(0,a.useRef)(null),n=(0,a.useRef)(null);return(0,a.useCallback)(a=>{if(null===a){let e=r.current;e&&(r.current=null,e());let t=n.current;t&&(n.current=null,t())}else e&&(r.current=o(e,a)),t&&(n.current=o(t,a))},[e,t])}function o(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return o}});let a=e.r(18967),n=e.r(52817);function o(e){if(!(0,a.isAbsoluteUrl)(e))return!0;try{let t=(0,a.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,n.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={default:function(){return g},useLinkStatus:function(){return b}};for(var n in a)Object.defineProperty(r,n,{enumerable:!0,get:a[n]});let o=e.r(90809),s=e.r(43476),i=o._(e.r(71645)),l=e.r(95057),u=e.r(8372),c=e.r(18581),d=e.r(18967),f=e.r(5550);e.r(33525);let p=e.r(88540),h=e.r(91949),m=e.r(73668),y=e.r(9396);function g(t){var r,a;let n,o,g,[b,v]=(0,i.useOptimistic)(h.IDLE_LINK_STATUS),k=(0,i.useRef)(null),{href:_,as:w,children:S,prefetch:M=null,passHref:j,replace:O,shallow:P,scroll:C,onClick:E,onMouseEnter:I,onTouchStart:A,legacyBehavior:N=!1,onNavigate:T,transitionTypes:R,ref:L,unstable_dynamicOnHover:U,...$}=t;n=S,N&&("string"==typeof n||"number"==typeof n)&&(n=(0,s.jsx)("a",{children:n}));let z=i.default.useContext(u.AppRouterContext),D=!1!==M,Y=!1!==M?null===(a=M)||"auto"===a?y.FetchStrategy.PPR:y.FetchStrategy.Full:y.FetchStrategy.PPR,B="string"==typeof(r=w||_)?r:(0,l.formatUrl)(r);if(N){if(n?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});o=i.default.Children.only(n)}let F=N?o&&"object"==typeof o&&o.ref:L,X=i.default.useCallback(e=>(null!==z&&(k.current=(0,h.mountLinkInstance)(e,B,z,Y,D,v)),()=>{k.current&&((0,h.unmountLinkForCurrentNavigation)(k.current),k.current=null),(0,h.unmountPrefetchableInstance)(e)}),[D,B,z,Y,v]),V={ref:(0,c.useMergedRef)(X,F),onClick(t){N||"function"!=typeof E||E(t),N&&o.props&&"function"==typeof o.props.onClick&&o.props.onClick(t),!z||t.defaultPrevented||function(t,r,a,n,o,s,l){if("u">typeof window){let u,{nodeName:c}=t.currentTarget;if("A"===c.toUpperCase()&&((u=t.currentTarget.getAttribute("target"))&&"_self"!==u||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,m.isLocalURL)(r)){n&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),s){let e=!1;if(s({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:d}=e.r(99781);i.default.startTransition(()=>{d(r,n?"replace":"push",!1===o?p.ScrollBehavior.NoScroll:p.ScrollBehavior.Default,a.current,l)})}}(t,B,k,O,C,T,R)},onMouseEnter(e){N||"function"!=typeof I||I(e),N&&o.props&&"function"==typeof o.props.onMouseEnter&&o.props.onMouseEnter(e),z&&D&&(0,h.onNavigationIntent)(e.currentTarget,!0===U)},onTouchStart:function(e){N||"function"!=typeof A||A(e),N&&o.props&&"function"==typeof o.props.onTouchStart&&o.props.onTouchStart(e),z&&D&&(0,h.onNavigationIntent)(e.currentTarget,!0===U)}};return(0,d.isAbsoluteUrl)(B)?V.href=B:N&&!j&&("a"!==o.type||"href"in o.props)||(V.href=(0,f.addBasePath)(B)),g=N?i.default.cloneElement(o,V):(0,s.jsx)("a",{...$,...V,children:n}),(0,s.jsx)(x.Provider,{value:b,children:g})}e.r(84508);let x=(0,i.createContext)(h.IDLE_LINK_STATUS),b=()=>(0,i.useContext)(x);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},32781,e=>{"use strict";let t=(0,e.i(56420).default)("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);e.s(["Loader2",0,t],32781)},67965,e=>{"use strict";let t=(0,e.i(56420).default)("cable",[["path",{d:"M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z",key:"trhst0"}],["path",{d:"M17 21v-2",key:"ds4u3f"}],["path",{d:"M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10",key:"1mo9zo"}],["path",{d:"M21 21v-2",key:"eo0ou"}],["path",{d:"M3 5V3",key:"1k5hjh"}],["path",{d:"M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z",key:"1dd30t"}],["path",{d:"M7 5V3",key:"1t1388"}]]);e.s(["Cable",0,t],67965)},57443,70812,e=>{"use strict";var t=e.i(56420);let r=(0,t.default)("user-plus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);e.s(["UserPlus",0,r],57443);let a=(0,t.default)("bell",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]]);e.s(["Bell",0,a],70812)},28574,e=>{"use strict";let t=(0,e.i(56420).default)("brain-circuit",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]]);e.s(["BrainCircuit",0,t],28574)},21357,e=>{"use strict";let t=(0,e.i(56420).default)("play",[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]);e.s(["Play",0,t],21357)},28523,e=>{"use strict";let t=(0,e.i(56420).default)("pause",[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]);e.s(["Pause",0,t],28523)},30747,e=>{"use strict";let t={easeOutExpo:[.16,1,.3,1],easeOutQuart:[.25,1,.5,1],easeInExpo:[.7,0,.84,0],easeInOutQuint:[.83,0,.17,1],spring:{type:"spring",stiffness:300,damping:28},springSoft:{type:"spring",stiffness:220,damping:26},springTight:{type:"spring",stiffness:400,damping:30}},r={instant:.12,fast:.18,normal:.25,slow:.35,page:.4};r.normal,t.easeOutExpo,r.normal,t.easeOutExpo,r.normal,t.easeOutExpo,t.springTight,t.springTight,e.s(["durations",0,r,"easings",0,t])},53752,9642,e=>{"use strict";var t=e.i(43476),r=e.i(71645);e.s(["AssistantAvatar",0,function({className:e="",faceColor:a="#ffffff",featureColor:n="#0c0c0c"}){let o=(0,r.useRef)(null),[s,i]=(0,r.useState)(1),[l,u]=(0,r.useState)({});return(0,r.useEffect)(()=>{if(u({"--anim-delay":`-${20*Math.random()}s`,"--face-color":a,"--feature-color":n}),!o.current)return;let e=o.current.getBoundingClientRect();i(Math.min(e.width,e.height)/240);let t=new ResizeObserver(e=>{for(let t of e){let{width:e,height:r}=t.contentRect;i(Math.min(e,r)/240)}});return t.observe(o.current),()=>t.disconnect()},[a,n]),(0,t.jsxs)("div",{ref:o,className:`relative flex items-center justify-center overflow-hidden bg-transparent rounded-full shrink-0 ${e}`,style:l,children:[(0,t.jsx)("style",{children:`
        .face-assistant {
          width: 240px;
          height: 240px;
          background-color: var(--face-color, #ffffff);
          border-radius: 50%;
          position: relative;
          overflow: hidden; 
          perspective: 450px; 
          box-shadow: 0 0 40px rgba(0, 210, 255, 0.15), inset 0 0 20px rgba(0, 210, 255, 0.1);
          border: 2px solid rgba(0, 210, 255, 0.3);
        }

        .head-assistant {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          animation: head-turn-assistant 12s infinite ease-in-out var(--anim-delay, 0s);
        }

        .glasses-wrapper {
          position: absolute;
          width: 140px;
          height: 50px;
          top: 75px;
          left: 50px; 
          transform: translateZ(105px); 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .glass-lens {
          width: 55px;
          height: 55px;
          border: 3px solid #00d2ff; 
          border-radius: 12px;
          background-color: rgba(0, 210, 255, 0.05); 
        }

        .glass-bridge {
          width: 24px;
          height: 3px;
          background-color: #00d2ff;
          margin-top: -15px; 
        }

        .eye-wrapper-assistant {
          position: absolute;
          width: 30px; 
          height: 55px;
          top: 75px;
        }

        .eye-wrapper-assistant.left {
          left: 65px; 
          transform: translateZ(90px) rotateY(-10deg);
        }

        .eye-wrapper-assistant.right {
          left: 135px; 
          transform: translateZ(90px) rotateY(10deg);
        }

        .eye-assistant {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 50px; 
          transform-origin: center center;
          animation: eye-blink-assistant 8s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-wrapper-assistant {
          position: absolute;
          width: 24px; 
          height: 12px;
          top: 155px; 
          left: 108px; 
          animation: mouth-idle-assistant 4s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-assistant {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 5px 5px 20px 20px;
          transform-origin: center top;
          animation: mouth-express-assistant 6s infinite ease-in-out var(--anim-delay, 0s);
        }

        @keyframes head-turn-assistant {
          0%   { transform: rotateX(-5deg) rotateY(-15deg); }
          15%  { transform: rotateX(2deg) rotateY(-25deg); }
          30%  { transform: rotateX(-10deg) rotateY(20deg); }
          45%  { transform: rotateX(15deg) rotateY(30deg) rotateZ(-5deg); }
          60%  { transform: rotateX(15deg) rotateY(30deg) rotateZ(-5deg); }
          75%  { transform: rotateX(5deg) rotateY(40deg); }
          85%  { transform: rotateX(-10deg) rotateY(-15deg) rotateZ(5deg); }
          100% { transform: rotateX(-5deg) rotateY(-15deg); }
        }

        @keyframes eye-blink-assistant {
          0%, 45%  { transform: scaleY(1); }
          47%      { transform: scaleY(0.1); } 
          49%, 75% { transform: scaleY(1); }    
          77%      { transform: scaleY(0.1); } 
          79%      { transform: scaleY(1); }
          81%      { transform: scaleY(0.1); } 
          83%, 100%{ transform: scaleY(1); }
        }

        @keyframes mouth-idle-assistant {
          0%, 100% { transform: translateZ(85px) rotateX(-10deg) translateY(0px); }
          50%      { transform: translateZ(85px) rotateX(-10deg) translateY(2px); }
        }

        @keyframes mouth-express-assistant {
          0%, 20% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 5px 5px 20px 20px; 
          }
          35% { 
            transform: scale(1.2, 1.4) translate(0, 2px); 
            border-radius: 10px 10px 25px 25px; 
          }
          50%, 60% { 
            transform: scale(0.8, 1.5) translate(0, 0); 
            border-radius: 20px; 
          }
          80% { 
            transform: scale(1.1, 0.6) translate(0, -2px); 
            border-radius: 5px 5px 10px 10px; 
          }
          100% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 5px 5px 20px 20px;
          }
        }
      `}),(0,t.jsx)("div",{style:{transform:`scale(${s})`,transformOrigin:"center center",width:"240px",height:"240px",position:"absolute"},children:(0,t.jsx)("div",{className:"face-assistant",children:(0,t.jsxs)("div",{className:"head-assistant",children:[(0,t.jsxs)("div",{className:"glasses-wrapper",children:[(0,t.jsx)("div",{className:"glass-lens"}),(0,t.jsx)("div",{className:"glass-bridge"}),(0,t.jsx)("div",{className:"glass-lens"})]}),(0,t.jsx)("div",{className:"eye-wrapper-assistant left",children:(0,t.jsx)("div",{className:"eye-assistant"})}),(0,t.jsx)("div",{className:"eye-wrapper-assistant right",children:(0,t.jsx)("div",{className:"eye-assistant"})}),(0,t.jsx)("div",{className:"mouth-wrapper-assistant",children:(0,t.jsx)("div",{className:"mouth-assistant"})})]})})})]})}],53752);let a=(0,e.i(56420).default)("layout-grid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);e.s(["LayoutGrid",0,a],9642)}]);