/* Every emoji on the site is replaced by an icon drawn in code (inline SVG, 24×24).
   Works for static HTML and for everything added later (watched with a MutationObserver).
   Chess symbols (♔♖♟…), stars ★☆ and ticks ✓ are plain text characters and stay as they are. */
(function(){
'use strict';
const C=(cx,cy,r,f,ex='')=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${ex}/>`;
const NS='stroke="none"';
const FACE=`<circle cx="12" cy="12" r="10" fill="#FFCA28"/>`;
const BOX=c=>`<rect x="2" y="2" width="20" height="20" rx="5" fill="${c}"/>`;
const WHITE=d=>`<g fill="none" stroke="#fff" stroke-width="2.2">${d}</g>`;
const flagPole=f=>`<path d="M5 2.5v19" stroke-width="2"/><path d="M5.5 3.5h13l-3 4.5 3 4.5h-13z" fill="${f}"/>`;
const skull=`<path d="M12 2.5c-4.7 0-8 3.2-8 7.6 0 2.6 1.2 4.4 2.8 5.5v3.4h10.4v-3.4c1.6-1.1 2.8-2.9 2.8-5.5 0-4.4-3.3-7.6-8-7.6z" fill="#ECEFF1"/>${C(8.8,10.5,2,'#263238')}${C(15.2,10.5,2,'#263238')}<path d="M12 13l-1 2h2z" fill="#263238"/><path d="M10 19v2.5M14 19v2.5" fill="none"/>`;
const star=`<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#FFC107"/>`;
const medal=`<path d="M7 2h4l2 6H9zM17 2h-4l-2 6h4z" fill="#42A5F5"/>${C(12,15,6.5,'#FFC107')}<path d="M12 11.5l1.1 2.3 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#FFF8E1" ${NS}/>`;
const dragon=`<path d="M3 15c2-6 7-9 12-8l4-4 1 4 3 1-3 2c0 5-4 9-9 9-4 0-7-1-8-4z" fill="#43A047"/>${C(17,8.5,1,'#FFEB3B',NS)}<path d="M7 14c2 1 4 1 6 0M9 17c2 .5 3 .5 5 0" fill="none" stroke="#A5D6A7"/>`;
const bird=(f,e)=>`<path d="M3 13c2-4 6-6 10-5l3-3 1 3c3 1 5 3 5 6-3 0-5 2-9 2-4 0-8-1-10-3z" fill="${f}"/>${C(16.5,9.5,.9,e,NS)}<path d="M21.5 8.5l1.5-.5" fill="none" stroke="#FFA000" stroke-width="1.6"/><path d="M8 12c2 2 5 2 7 0" fill="none" stroke="${e}" stroke-width="1"/>`;
const eye=`<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="#fff"/>${C(12,12,4,'#3E8ED0')}${C(12,12,1.8,'#1a1a1a')}${C(13.3,10.7,.8,'#fff',NS)}`;
const gear=`<path d="M10.5 2h3l.5 2.6 2.2 1 2.2-1.5 2.1 2.1-1.5 2.2 1 2.2 2.6.5v3l-2.6.5-1 2.2 1.5 2.2-2.1 2.1-2.2-1.5-2.2 1-.5 2.6h-3l-.5-2.6-2.2-1-2.2 1.5-2.1-2.1 1.5-2.2-1-2.2L2 13.5v-3l2.6-.5 1-2.2-1.5-2.2 2.1-2.1 2.2 1.5 2.2-1z" fill="#90A4AE"/>${C(12,12,3.5,'#ECEFF1')}`;
const warn=`<path d="M12 2.8L1.8 20.5h20.4z" fill="#FFC107"/><path d="M12 9v5.5" stroke-width="2.4"/>${C(12,17.6,1.3,'#3E2723',NS)}`;
const swords=`<path d="M3.5 2.5l11 11-2 2-11-11V2.5z" fill="#CFD8DC"/><path d="M20.5 2.5l-11 11 2 2 11-11V2.5z" fill="#CFD8DC"/><path d="M6.5 15.5l2 2M17.5 15.5l-2 2" fill="none" stroke-width="2.4"/><path d="M5.5 19.5l2-2M18.5 19.5l-2-2" fill="none" stroke="#8D6E63" stroke-width="2.6"/>`;
const comet=`<path d="M3 3l10 6-2 2zM3 7.5l9 3-1.5 1.5zM7.5 3l3 9-1.5 1.5z" fill="#FFB74D" ${NS}/>${C(15.5,15.5,5.5,'#FF7043')}${C(14,14,1.8,'#FFCCBC',NS)}`;
const bell=`<path d="M12 3a6 6 0 0 0-6 6v4.5L4 17h16l-2-3.5V9a6 6 0 0 0-6-6z" fill="#FFC107"/><path d="M10 19.5a2 2 0 0 0 4 0" fill="#FFA000"/>`;
const chart=(d,c)=>`<rect x="2.5" y="2.5" width="19" height="19" rx="2" fill="#fff"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.2"/>`;
const mag=`${C(10,10,6.5,'#B3E5FC')}<path d="M15 15l6 6" stroke-width="3"/>`;

const E={
 '✅':`<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#4CAF50"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" stroke-width="2.6"/>`,
 '❌':`<path d="M6 6l12 12M18 6L6 18" stroke="#E53935" stroke-width="4" fill="none"/>`,
 '👁':eye,
 '🧠':`<path d="M12 4.5c-1.2-1.6-4.3-1.6-5.3.6-2.3.2-3.5 2.6-2.6 4.4-1.6 1.4-1.2 4.2.8 5 .1 2.3 2.4 3.6 4.4 2.8 1 1.6 3.4 1.6 4.4 0z" fill="#F48FB1"/><path d="M12 4.5c1.2-1.6 4.3-1.6 5.3.6 2.3.2 3.5 2.6 2.6 4.4 1.6 1.4 1.2 4.2-.8 5-.1 2.3-2.4 3.6-4.4 2.8-1 1.6-3.4 1.6-4.4 0z" fill="#F8BBD0"/><path d="M8 9c1 .2 1.6 1 1.5 2M7 14c1.2-.6 2.4 0 2.6 1M16 9c-1 .2-1.6 1-1.5 2M17 14c-1.2-.6-2.4 0-2.6 1" fill="none"/>`,
 '💡':`<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.7.6 1.1 1.4 1.1 2.2h5.4c0-.8.4-1.6 1.1-2.2A6.5 6.5 0 0 0 12 2.5z" fill="#FFD54F"/><rect x="9.3" y="16.5" width="5.4" height="3" rx="1" fill="#B0BEC5"/><path d="M10.5 21.5h3M10 9.5l2 3 2-3" fill="none"/>`,
 '🧩':`<path d="M4 8h4a2.2 2.2 0 1 1 4 0h4v4a2.2 2.2 0 1 1 0 4v4H4v-4a2.2 2.2 0 1 0 0-4z" fill="#66BB6A"/>`,
 '🌪':`<g fill="none" stroke="#90A4AE" stroke-width="2.4"><path d="M3 5h18M5 9h14M7.5 13h9M10 17h5M11.5 21h2"/></g>`,
 '⏱':`${C(12,13.5,8,'#ECEFF1')}<rect x="10" y="2" width="4" height="3" rx="1" fill="#90A4AE"/><path d="M12 13.5V9M12 13.5l3 2" fill="none" stroke="#E53935" stroke-width="2"/><path d="M18.5 6.5l1.5-1.5" fill="none"/>`,
 '⚠':warn,
 '⚡':`<path d="M13.5 1.5L4.5 13.5h6l-1.5 9 9-12h-6z" fill="#FFCA28"/>`,
 '🔁':BOX('#42A5F5')+WHITE('<path d="M6.5 11V9.5a2 2 0 0 1 2-2h8.5M15 5.5l2 2-2 2M17.5 13v1.5a2 2 0 0 1-2 2H7M9 18.5l-2-2 2-2"/>'),
 '🪵':`<rect x="3" y="7" width="15" height="10" fill="#A1673B"/><ellipse cx="18" cy="12" rx="3" ry="5" fill="#E2B477"/><ellipse cx="18" cy="12" rx="1.3" ry="2.3" fill="none"/><path d="M5 10h8M6 14h9" fill="none"/>`,
 '🌐':`${C(12,12,9.5,'#42A5F5')}<g fill="none"><ellipse cx="12" cy="12" rx="4" ry="9.5"/><path d="M2.5 12h19M4 7h16M4 17h16"/></g>`,
 '🔄':BOX('#42A5F5')+WHITE('<path d="M17 9.5A5.5 5.5 0 0 0 7 9M17 5.5v4h-4M7 14.5a5.5 5.5 0 0 0 10 .5M7 18.5v-4h4"/>'),
 '🔥':`<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-4.4-3.5-6.8-4.3-11.3-2.4 1.6-3.6 4-3.4 6.6C10.3 9 9.4 7.6 9.3 6 6.5 8.4 4.5 11.4 4.5 14.8 4.5 19 7.6 22 12 22z" fill="#FF7043"/><path d="M12 22c2.2 0 3.7-1.5 3.7-3.6 0-2.4-2-3.6-2.5-6-1.6 1.2-2 2.9-2 4.2-.8-.6-1.3-1.4-1.4-2.4C8.6 15.6 8.3 17 8.3 18.4 8.3 20.5 9.8 22 12 22z" fill="#FFD54F"/>`,
 '🔍':mag,'🔎':mag,
 '⚔':swords,
 '📏':`<g transform="rotate(-30 12 12)"><rect x="1.5" y="8" width="21" height="8" rx="1" fill="#FFD54F"/><path d="M5 8v3M8 8v2M11 8v3M14 8v2M17 8v3M20 8v2" fill="none"/></g>`,
 '📋':`<rect x="4.5" y="4" width="15" height="18" rx="2" fill="#BCAAA4"/><rect x="7" y="6.5" width="10" height="13" fill="#fff"/><rect x="8.5" y="2.5" width="7" height="3.5" rx="1" fill="#90A4AE"/><path d="M9 10h6M9 13h6M9 16h4" fill="none"/>`,
 '🏆':`<path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" fill="none" stroke="#FFB300" stroke-width="2"/><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#FFC107"/><path d="M10.5 13h3v4h-3z" fill="#FFB300"/><rect x="7" y="17" width="10" height="4" rx="1" fill="#8D6E63"/>`,
 '📖':`<path d="M2 5.5c3-1 6.5-1 10 1v14c-3.5-2-7-2-10-1z" fill="#fff"/><path d="M22 5.5c-3-1-6.5-1-10 1v14c3.5-2 7-2 10-1z" fill="#E3F2FD"/><path d="M4.5 9c1.8-.3 3.6 0 5 .7M4.5 12.5c1.8-.3 3.6 0 5 .7M19.5 9c-1.8-.3-3.6 0-5 .7M19.5 12.5c-1.8-.3-3.6 0-5 .7" fill="none"/>`,
 '🛡':`<path d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10.5-4.5-1.7-8-5.5-8-10.5v-6z" fill="#5C6BC0"/><path d="M12 5.2l5.5 2v4.3c0 3.6-2.4 6.3-5.5 7.6z" fill="#9FA8DA" ${NS}/>`,
 '👑':`<path d="M3 18L2 7l5.5 5L12 4l4.5 8L22 7l-1 11z" fill="#FFD54A"/><rect x="3" y="18" width="18" height="3" rx="1" fill="#FFC928"/>${C(12,14.5,1.6,'#FF3B5C')}${C(7.5,15.5,1.2,'#3BB2FF')}${C(16.5,15.5,1.2,'#3BFF8A')}`,
 '🎁':`<rect x="3" y="9" width="18" height="4" rx="1" fill="#EF5350"/><rect x="4.5" y="13" width="15" height="8.5" fill="#E53935"/><rect x="10.5" y="9" width="3" height="12.5" fill="#FFD54F"/><path d="M12 9C10 4.5 5.5 5 6.5 8 7 9 12 9 12 9zM12 9c2-4.5 6.5-4 5.5-1-.5 1-5.5 1-5.5 1z" fill="#FFD54F"/>`,
 '👹':`<path d="M5.5 8L3 2.5 8.5 5.5M18.5 8L21 2.5l-5.5 3" fill="#FFF3E0"/>${C(12,13,8.5,'#E53935')}<path d="M7.5 11l3 1M16.5 11l-3 1" fill="none"/><path d="M7.5 16.5c3 2 6 2 9 0z" fill="#fff"/>`,
 '📈':chart('M5 17l4.5-5 3 3L19 7.5M15.5 7.5H19V11','#E53935'),
 '📉':chart('M5 7.5l4.5 5 3-3L19 17M15.5 17H19v-3.5','#1E88E5'),
 '🧑‍🏫':`<rect x="9" y="3" width="13" height="9" rx="1" fill="#2E7D32"/><path d="M11.5 6h7M11.5 8.5h5" fill="none" stroke="#fff" stroke-width="1.2"/>${C(6.5,9,3,'#FFCC80')}<path d="M2 21c0-4 2-6.5 4.5-6.5S11 17 11 21z" fill="#5C6BC0"/><path d="M9 15l4-3" fill="none"/>`,
 '🧮':`<rect x="3" y="3" width="18" height="18" rx="1.5" fill="#FFF3E0" stroke="#8D6E63" stroke-width="2"/><path d="M4 8h16M4 12h16M4 16h16" fill="none"/><g ${NS}>${C(7,8,1.6,'#EF5350')}${C(10.5,8,1.6,'#EF5350')}${C(15,12,1.6,'#42A5F5')}${C(8,12,1.6,'#42A5F5')}${C(12,16,1.6,'#66BB6A')}${C(16.5,16,1.6,'#66BB6A')}</g>`,
 '🎓':`<path d="M12 4L1.5 9 12 14l10.5-5z" fill="#37474F"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5L12 14.5z" fill="#455A64"/><path d="M21 9.5v6" fill="none" stroke="#FFC107" stroke-width="1.6"/>${C(21,16.5,1.2,'#FFC107',NS)}`,
 '👀':`<ellipse cx="7.5" cy="12" rx="5" ry="7" fill="#fff"/><ellipse cx="16.5" cy="12" rx="5" ry="7" fill="#fff"/>${C(9,13,2.4,'#1a1a1a')}${C(18,13,2.4,'#1a1a1a')}`,
 '✋':`<path d="M7 20c-2-2-3.5-4.5-3.5-7 0-1 1.5-1 2 0l1 2V5.5a1.3 1.3 0 0 1 2.6 0V11V3.8a1.3 1.3 0 0 1 2.6 0V11V4.8a1.3 1.3 0 0 1 2.6 0V11.5V7a1.3 1.3 0 0 1 2.6 0v8c0 3.5-2.5 6-6 6-1.6 0-3-.4-3.9-1z" fill="#FFCC80"/>`,
 '❔':`${C(12,12,9.5,'#B0BEC5')}<path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.2-1.4 2.2v.6" fill="none" stroke="#fff" stroke-width="2.2"/>${C(12,17.6,1.3,'#fff',NS)}`,
 '🤔':`${C(12,11,9.5,'#FFCA28')}${C(9,9.5,1.2,'#3E2723',NS)}${C(15,9,1.2,'#3E2723',NS)}<path d="M7.5 7l2.5-.8M14 6.3l2.5.7M10 14.5h4" fill="none"/><path d="M6 21.5c1-2 3-3 5-2.5l1.5-1.5 1 1.2-1.5 2c-1.6 1-3.6 1.3-6 .8z" fill="#FFB300"/>`,
 '😌':FACE+`<path d="M7 10c1 1 2 1 3 0M14 10c1 1 2 1 3 0M8.5 15c2 1.5 5 1.5 7 0" fill="none"/>`,
 '🤫':FACE+`<path d="M7.5 9.5h2.5M14 9.5h2.5M10 15.5h4" fill="none"/><rect x="11" y="11" width="2.6" height="8" rx="1.3" fill="#FFB74D"/>`,
 '😵':FACE+`<path d="M7 8l3 3M10 8l-3 3M14 8l3 3M17 8l-3 3" fill="none"/>${C(12,16,2,'#5D4037')}`,
 '🎨':`<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2-.6-1.3.3-2.5 1.7-2.5H18a4 4 0 0 0 4-4C22 7 17.5 3 12 3z" fill="#FFE0B2"/><g ${NS}>${C(7.5,12,1.7,'#E53935')}${C(9,7.5,1.7,'#FDD835')}${C(14,6.5,1.7,'#43A047')}${C(18,10,1.7,'#1E88E5')}</g>`,
 '💥':`<path d="M12 1.5l2.2 5.5 5.8-2-2.4 5.4 5 3.1-5.8 1.3.9 5.9-5.7-3-3.7 4.7-1-5.9-5.9.5 3.6-4.6-4.6-3.6 5.9-.5-.6-5.9 4.6 3.6z" fill="#FF7043"/><path d="M12 7.5l1.2 3 3.2-.8-1.7 2.8 2.5 2-3.2.3.2 3.2-2.4-2.2-2.4 2.2.2-3.2-3.2-.3 2.5-2-1.7-2.8 3.2.8z" fill="#FFD54F" ${NS}/>`,
 '⭐':star,
 '🌟':`<path d="M12 .5v2.5M12 21v2.5M.5 12H3M21 12h2.5" fill="none" stroke="#FFE082" stroke-width="1.6"/>`+star,
 '📱':`<rect x="6" y="1.5" width="12" height="21" rx="2.5" fill="#455A64"/><rect x="7.5" y="4" width="9" height="14" fill="#81D4FA" ${NS}/>${C(12,20,.9,'#fff',NS)}`,
 '📊':`<rect x="2.5" y="2.5" width="19" height="19" rx="2" fill="#fff"/><g ${NS}><rect x="6" y="12" width="3" height="7" fill="#EF5350"/><rect x="10.5" y="7" width="3" height="12" fill="#42A5F5"/><rect x="15" y="10" width="3" height="9" fill="#66BB6A"/></g>`,
 '💎':`<path d="M6.5 3.5h11L22 9l-10 12L2 9z" fill="#4FC3F7"/><path d="M2 9h20M8.5 9L12 21l3.5-12M6.5 3.5L8.5 9l3.5-5.5L15.5 9l2-5.5" fill="none"/>`,
 '🧱':`<rect x="2" y="4" width="20" height="16" fill="#D84315"/><path d="M2 9.3h20M2 14.6h20M9 4v5.3M16 4v5.3M5.5 9.3v5.3M12.5 9.3v5.3M19 9.3v5.3M9 14.6V20M16 14.6V20" fill="none" stroke="#FFCCBC"/>`,
 '🪤':`<rect x="2" y="13" width="20" height="7" rx="1" fill="#D7A86E"/><path d="M5 13c0-4 2-7 7-7s7 3 7 7M12 6v7" fill="none" stroke="#78909C" stroke-width="2"/>${C(16,16,1.8,'#FFEB3B')}`,
 '☠':skull,'💀':skull,
 '🧭':`${C(12,12,9.5,'#ECEFF1')}<path d="M12 4.5l2.2 7.5h-4.4z" fill="#E53935"/><path d="M12 19.5l-2.2-7.5h4.4z" fill="#546E7A"/>`,
 '🎯':`${C(12,12,9.5,'#fff')}${C(12,12,6.5,'#E53935')}${C(12,12,3.5,'#fff')}${C(12,12,1.5,'#E53935')}`,
 '⏭':BOX('#42A5F5')+`<path d="M5.5 7l6 5-6 5zM11.5 7l6 5-6 5z" fill="#fff" ${NS}/><path d="M18.5 7v10" stroke="#fff" stroke-width="2"/>`,
 '⏮':BOX('#42A5F5')+`<path d="M18.5 7l-6 5 6 5zM12.5 7l-6 5 6 5z" fill="#fff" ${NS}/><path d="M5.5 7v10" stroke="#fff" stroke-width="2"/>`,
 '🎉':`<path d="M3 21l5-14 9 9z" fill="#FFB300"/><path d="M6 13l5 5M5 16.5l2.5 2.5" fill="none"/><g ${NS}>${C(15,4,1.3,'#E53935')}${C(20,9,1.3,'#42A5F5')}${C(19.5,3,1,'#66BB6A')}</g><path d="M12 7c1-2 0-3 1-5M17 12c2-1 3 0 5-1" fill="none" stroke="#AB47BC" stroke-width="1.6"/>`,
 '🔒':`<path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#90A4AE" stroke-width="2.4"/><rect x="4.5" y="10" width="15" height="11.5" rx="2" fill="#FFC107"/>${C(12,15.5,1.6,'#5D4037',NS)}`,
 '🔑':`${C(7.5,12,5,'#FFC107')}${C(6,12,1.6,'#fff')}<path d="M12 12h10M18 12v3.5M21 12v2.5" fill="none" stroke="#FFC107" stroke-width="2.6"/>`,
 '🚩':flagPole('#E53935'),'🏳':flagPole('#fff'),'🏴':flagPole('#212121'),
 '🏁':`<path d="M5 2.5v19" stroke-width="2"/><rect x="5.5" y="3.5" width="14" height="9" fill="#fff"/><g fill="#212121" ${NS}><rect x="5.5" y="3.5" width="3.5" height="3"/><rect x="12.5" y="3.5" width="3.5" height="3"/><rect x="9" y="6.5" width="3.5" height="3"/><rect x="16" y="6.5" width="3.5" height="3"/><rect x="5.5" y="9.5" width="3.5" height="3"/><rect x="12.5" y="9.5" width="3.5" height="3"/></g>`,
 '📻':`<path d="M6 8l12-5" fill="none"/><rect x="2.5" y="8" width="19" height="13" rx="2" fill="#8D6E63"/>${C(8.5,14.5,3.5,'#3E2723')}<path d="M14 12h5M14 15h5M14 18h5" fill="none" stroke="#FFE0B2"/>`,
 '🎬':`<rect x="3" y="9" width="18" height="12" rx="1" fill="#37474F"/><path d="M3 9l1.5-5 17 2.5-1 3z" fill="#ECEFF1"/><path d="M7.5 4.6L7 8.6M12 5.3l-.8 3.7M16.5 6l-.9 3.3" fill="none"/>`,
 '❄':`<g fill="none" stroke="#4FC3F7" stroke-width="2"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/></g>`,
 '🛸':`<path d="M9 16l-2 5M15 16l2 5" fill="none" stroke="#B2FF59" stroke-width="1.6"/><path d="M8 10a4 4 0 0 1 8 0z" fill="#80DEEA"/><ellipse cx="12" cy="12.5" rx="10" ry="3.5" fill="#90A4AE"/><g fill="#FFEB3B" ${NS}>${C(6,12.5,1,'#FFEB3B')}${C(12,13.5,1,'#FFEB3B')}${C(18,12.5,1,'#FFEB3B')}</g>`,
 '⚙':gear,
 '🟩':`<rect x="3" y="3" width="18" height="18" rx="3" fill="#66BB6A"/>`,
 '⬛':`<rect x="3" y="3" width="18" height="18" rx="2" fill="#212121"/>`,
 '⚪':C(12,12,9,'#F5F5F5'),'⚫':C(12,12,9,'#212121'),'🔴':C(12,12,9,'#E53935'),
 '⬇':BOX('#42A5F5')+WHITE('<path d="M12 6v11M7 12.5l5 5 5-5"/>'),
 '➡':BOX('#42A5F5')+WHITE('<path d="M6 12h11M12.5 7l5 5-5 5"/>'),
 '🔀':BOX('#42A5F5')+WHITE('<path d="M5 8h3l8 8h3M5 16h3l2-2M14 10l2-2h3M17 5.5L19.5 8 17 10.5M17 13.5l2.5 2.5-2.5 2.5"/>'),
 '👍':`<path d="M7 10.5h-3v10h3zM7 10.5l4-7.5c1.6 0 2.5 1.2 2 2.8L12.4 9.5H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20.5H7z" fill="#FFCA28"/>`,
 '🔔':bell,'🔕':bell+`<path d="M3 3l18 18" stroke="#E53935" stroke-width="2.6"/>`,
 '🍴':`<path d="M7 2.5v6.5a2 2 0 0 0 4 0V2.5M9 2.5v19" fill="none" stroke="#78909C" stroke-width="1.8"/><path d="M16 21.5V2.5c2.5 1.5 3.5 4.5 3.5 8H16" fill="#B0BEC5"/>`,
 '🚀':`<path d="M7.5 14L4.5 18l3.5-.5zM16.5 14l3 4-3.5-.5z" fill="#E53935"/><path d="M10 15.5l2 6 2-6z" fill="#FF9800"/><path d="M12 2c4 2.5 5.5 7 4.5 12h-9C6.5 9 8 4.5 12 2z" fill="#ECEFF1"/>${C(12,9,2,'#42A5F5')}`,
 '🏰':`<path d="M12 6V2.5l3 1.2-3 1.2" fill="#E53935"/><path d="M3 21V9h3V7h2v2h3V6h2v3h3V7h2v2h3v12z" fill="#B0BEC5"/><path d="M10 21v-4a2 2 0 0 1 4 0v4z" fill="#5D4037"/>`,
 '🐴':`<path d="M8 21l1-6-3 1-2-2 5-8 2-3 1 2 2-1c4 2 5 6 4 11l-1 6z" fill="#A1673B"/>${C(10.5,9,.9,'#1a1a1a',NS)}<path d="M13 5c3 1 5 4 5.5 7" fill="none" stroke="#5D4037" stroke-width="2"/>`,
 '⛪':`<path d="M12 2v4M10 4h4" fill="none"/><path d="M3 21v-7l4-2v9zM21 21v-7l-4-2v9z" fill="#B0BEC5"/><path d="M12 6l5 5v10H7V11z" fill="#ECEFF1"/><path d="M10.5 21v-4a1.5 1.5 0 0 1 3 0v4z" fill="#8D6E63"/>`,
 '♻':`<g fill="none" stroke="#43A047" stroke-width="2.6"><path d="M8 5l2.5-1.5a2 2 0 0 1 2.8.7l2 3.5M20 12l1 2a2 2 0 0 1-1.7 3H15M8 19H4.7A2 2 0 0 1 3 16l2-3.5"/></g><path d="M14 4.5l2 3.5-3.8.3zM15.5 14.5l-2 3 2 2.8zM6.5 12.3l-4 .5 1.5 3.4z" fill="#43A047"/>`,
 '🐦':bird('#42A5F5','#fff'),'🐦‍⬛':bird('#263238','#FFD54F'),
 '🌫':`<g fill="none" stroke="#B0BEC5" stroke-width="2.4"><path d="M3 7h13M6 11.5h15M3 16h14M7 20.5h10"/></g>`,
 '💻':`<rect x="4" y="4" width="16" height="11" rx="1.5" fill="#455A64"/><rect x="5.7" y="5.7" width="12.6" height="7.6" fill="#81D4FA" ${NS}/><path d="M1.5 17.5h21l-1.5 2.5H3z" fill="#B0BEC5"/>`,
 '🦅':`<path d="M2 9c4-2 7-1 10 2 3-3 6-4 10-2-3 1-5 3-6.5 6L12 21l-3.5-6C7 12 5 10 2 9z" fill="#795548"/><path d="M10.5 9.5a2 2 0 0 1 3 0L12 11z" fill="#fff"/><path d="M12 11l1.5 1-1.5.5" fill="#FFB300"/>`,
 '🏅':medal,'🎖':medal,
 '🎲':`<rect x="3" y="3" width="18" height="18" rx="4" fill="#fff"/><g ${NS}>${C(8,8,1.6,'#E53935')}${C(16,16,1.6,'#E53935')}${C(12,12,1.6,'#E53935')}${C(16,8,1.6,'#E53935')}${C(8,16,1.6,'#E53935')}</g>`,
 '📌':`<path d="M14.5 2.5l7 7-2 1-4 4 .5 4-1.5 1.5-3.5-3.5L4.5 22 2 19.5 8.5 13 5 9.5 6.5 8l4 .5 4-4z" fill="#E53935"/>`,
 '🗡':`<path d="M20.5 3.5l-3 6.5-8 8-2.5-2.5 8-8z" fill="#CFD8DC"/><path d="M5 14.5l4.5 4.5M7.5 17L4 20.5" fill="none" stroke="#8D6E63" stroke-width="2.4"/>`,
 '🎭':`<path d="M2.5 4h9v6a4.5 4.5 0 0 1-9 0z" fill="#FFD54F"/><path d="M12.5 9h9v6a4.5 4.5 0 0 1-9 0z" fill="#90CAF9"/><path d="M4.5 7.5h1.5M8 7.5h1.5M5 11.5c1 1 2.5 1 3.5 0M14.5 12.5h1.5M18 12.5h1.5M15 17c1-1 2.5-1 3.5 0" fill="none"/>`,
 '🧲':`<path d="M5 3h4v9a3 3 0 0 0 6 0V3h4v9a7 7 0 0 1-14 0z" fill="#E53935"/><path d="M5 3h4v3H5zM15 3h4v3h-4z" fill="#ECEFF1"/>`,
 '🇮🇹':`<rect x="2" y="5" width="20" height="14" rx="1.5" fill="#fff"/><rect x="2" y="5" width="6.7" height="14" fill="#2E7D32" ${NS}/><rect x="15.3" y="5" width="6.7" height="14" fill="#C62828" ${NS}/><rect x="2" y="5" width="20" height="14" rx="1.5" fill="none"/>`,
 '🇪🇸':`<rect x="2" y="5" width="20" height="14" rx="1.5" fill="#C62828"/><rect x="2" y="8.5" width="20" height="7" fill="#FDD835" ${NS}/><rect x="2" y="5" width="20" height="14" rx="1.5" fill="none"/>`,
 '🌉':`<path d="M2 14c4-6 16-6 20 0" fill="none" stroke="#E53935" stroke-width="2"/><path d="M6 14v6M18 14v6M10 10.5v3.5M14 10.5v3.5" fill="none"/><path d="M2 14h20" stroke-width="2.2"/>`,
 '🏃':`${C(15,4,2.2,'#FFCC80')}<path d="M13.5 7l-3.5 4 3 3-1.5 6M10 11l-4 1M13.5 7l3.5 4 3-1M13 14l4 2 1 4" fill="none" stroke="#1E88E5" stroke-width="2.4"/>`,
 '🤝':`<path d="M2 9l5-2 5 3 5-3 5 2v5l-4 2-4 4-3-1-4-3-5-2z" fill="#FFCC80"/><path d="M8 13l3 3M10 11l3 3M12 9.5l3 3" fill="none"/>`,
 '🐢':`<path d="M5 17.5l-1 2.5M15 17.5l1 2.5" fill="none" stroke-width="2"/>${C(20,12,2.6,'#81C784')}<ellipse cx="11" cy="13" rx="7.5" ry="5.5" fill="#43A047"/><path d="M7 13h8M11 8v10M8 9.5l6 7M14 9.5l-6 7" fill="none" stroke="#A5D6A7" stroke-width="1"/>`,
 '🔮':`<path d="M5.5 22l2-3.5h9l2 3.5z" fill="#8D6E63"/>${C(12,10.5,8,'#AB47BC')}<path d="M8.5 7a4 4 0 0 1 3-2" fill="none" stroke="#fff" stroke-width="1.6"/>`,
 '✏':`<path d="M4 20l1-4.5L16 4.5 19.5 8 8.5 19z" fill="#FFC107"/><path d="M16 4.5l2-2 3.5 3.5-2 2z" fill="#F48FB1"/><path d="M4 20l1-4.5 3.5 3.5z" fill="#FFE0B2"/>`,
 '🆕':`<rect x="1.5" y="5" width="21" height="14" rx="3" fill="#1E88E5"/><text x="12" y="15.2" font-size="7.5" font-weight="900" text-anchor="middle" fill="#fff" ${NS} font-family="Arial,sans-serif">NEW</text>`,
 '✨':`<path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8z" fill="#FFD54F"/><path d="M18 13l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="#FFD54F"/>`,
 '🛠':`<path d="M14.5 3a4.5 4.5 0 0 0-4 6.3L3 16.8 5.2 19l7.5-7.5A4.5 4.5 0 0 0 19 7.3l-2.7 2.7-2.3-.7-.7-2.3L16 4.3A4.5 4.5 0 0 0 14.5 3z" fill="#90A4AE"/>`,
 '🔗':`<g fill="none" stroke="#78909C" stroke-width="2.6"><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6L11.5 7M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.5-1.5"/></g>`,
 '⏳':`<path d="M7 3c0 5 4 6.5 4 9s-4 4-4 9h10c0-5-4-6.5-4-9s4-4 4-9z" fill="#E3F2FD"/><path d="M8.5 20h7c-.3-2.5-2-3.5-3.5-4.5-1.5 1-3.2 2-3.5 4.5zM9.5 7h5c-.5 1.5-1.5 2.4-2.5 3-1-.6-2-1.5-2.5-3z" fill="#FFB74D" ${NS}/><path d="M6 2.5h12M6 21.5h12" stroke-width="2"/>`,
 '🏠':`<path d="M5 10v11h14V10l-7-6z" fill="#FFE082"/><path d="M10 21v-6h4v6z" fill="#8D6E63"/><path d="M2.5 11.5L12 3l9.5 8.5h-3L12 6l-6.5 5.5z" fill="#E53935"/>`,
 '📦':`<path d="M3 7.5L12 3l9 4.5v10L12 22l-9-4.5z" fill="#D7A86E"/><path d="M3 7.5l9 4.5 9-4.5M12 12v10M7.5 5.3l9 4.5" fill="none"/>`,
 '🐉':dragon,'🐲':dragon,
 '🗺':`<path d="M2 5l6-2 8 3 6-2v15l-6 2-8-3-6 2z" fill="#A5D6A7"/><path d="M8 3v15M16 6v15" fill="none"/><path d="M11 9l2 2M13 9l-2 2" fill="none" stroke="#E53935" stroke-width="1.6"/>`,
 '📚':`<rect x="3" y="4" width="4.5" height="17" fill="#E53935"/><rect x="8" y="6" width="4.5" height="15" fill="#1E88E5"/><path d="M13.5 7.5l4.3-1.2 3.7 13.5-4.3 1.2z" fill="#43A047"/>`,
 '💰':`<path d="M9 3h6l-1.5 3h-3z" fill="#C8A165"/><path d="M10 6.5h4C19 9 21 13 20 17c-.6 2.5-3 4-8 4s-7.4-1.5-8-4c-1-4 1-8 6-10.5z" fill="#D7A86E"/><text x="12" y="17.5" font-size="8" font-weight="900" text-anchor="middle" fill="#5D4037" ${NS} font-family="Arial,sans-serif">$</text>`,
 '🏝':`<path d="M2 19c3-2 7-3 10-3s7 1 10 3v2.5H2z" fill="#4FC3F7"/><ellipse cx="11" cy="17.5" rx="7" ry="2.3" fill="#FFE082"/><path d="M12 17c0-5 .5-8 2-11" fill="none" stroke="#8D6E63" stroke-width="2"/><path d="M14 6c-3-2-6-1-7 1 3-.5 5 0 7-1zM14 6c3-2 6-1 7 1-3-.5-5 0-7-1zM14 6c-1 3-3 4-5 5 1-2 3-4 5-5z" fill="#43A047"/>`,
 '🤏':`<path d="M6 21c-1.5-2-2-4-2-6s1-4 3-5l3-1V4a1.5 1.5 0 0 1 3 0v6l4-4a1.5 1.5 0 0 1 2 2l-3 4c2 0 3 2 2 4l-2 3c-1 2-3 3-5 3z" fill="#FFCC80"/>`,
 '🔊':`<path d="M3 9h4l5-4.5v15L7 15H3z" fill="#78909C"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke-width="2"/>`,
 '💬':`<path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#ECEFF1"/><g ${NS}>${C(8,10.5,1.2,'#78909C')}${C(12,10.5,1.2,'#78909C')}${C(16,10.5,1.2,'#78909C')}</g>`,
 '🏹':`<path d="M5 3c8 2 14 8 16 16" fill="none" stroke="#8D6E63" stroke-width="2.4"/><path d="M5 3l16 16" fill="none" stroke="#CFD8DC"/><path d="M3 21L17 7" fill="none" stroke-width="1.6"/><path d="M17 7l1-3 2 2zM3 21l1.5-3.5L6.5 19z" fill="#E53935"/>`,
 '🍃':`<path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="#66BB6A"/><path d="M4 20L15 9" fill="none"/>`,
 '🦖':`<path d="M3 20l2-6c1-3 3-4 5-4h3l1-4c.5-2 2-3 4-3h2c1 0 2 1 2 2v1l-3 1 2 1v2h-4l-1 4c-.5 2-2 3-4 3l1 3h-2l-1-2-2 0-1 2H6l1-3c-1 0-2 0-2 1z" fill="#558B2F"/>${C(18,5.5,.9,'#fff',NS)}`,
 '👻':`<path d="M5 21V10a7 7 0 0114 0v11l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z" fill="#E3F2FD"/>${C(9.5,10.5,1.4,'#263238',NS)}${C(14.5,10.5,1.4,'#263238',NS)}<ellipse cx="12" cy="15" rx="1.6" ry="2" fill="#263238"/>`,
 '🎙':`<rect x="9" y="2.5" width="6" height="11" rx="3" fill="#78909C"/><path d="M6 11a6 6 0 0012 0M12 17v4M8.5 21h7" fill="none" stroke="#546E7A" stroke-width="2"/>`,
 '🐒':`<circle cx="5.5" cy="10" r="3" fill="#8D6E63"/><circle cx="18.5" cy="10" r="3" fill="#8D6E63"/><circle cx="12" cy="11" r="7.5" fill="#8D6E63"/><ellipse cx="12" cy="13" rx="5" ry="4.5" fill="#FFCCBC"/>${C(9.8,10.5,1.1,'#212121',NS)}${C(14.2,10.5,1.1,'#212121',NS)}<path d="M10 15.5q2 1.5 4 0" fill="none" stroke="#5D4037" stroke-width="1.2"/>`,
 '💣':`${C(11,14,7.5,'#263238')}<rect x="14" y="4.5" width="4" height="4" rx="1" fill="#455A64" transform="rotate(40 16 6.5)"/><path d="M17.5 5q2-3 4-1" fill="none" stroke="#A1887F" stroke-width="1.5"/>${C(21.3,3.5,1.6,'#FFC107',NS)}<ellipse cx="8.5" cy="11" rx="2" ry="1.2" fill="#607D8B" transform="rotate(-30 8.5 11)"/>`,
 '🕳':`<ellipse cx="12" cy="13" rx="10" ry="6" fill="#7E57C2"/><ellipse cx="12" cy="13" rx="7" ry="4" fill="#12002a"/><path d="M4 12q8-6 16 0" fill="none" stroke="#B39DDB" stroke-width="1.2"/>`,
 '🖱':`<rect x="6" y="3" width="12" height="18" rx="6" fill="#ECEFF1" stroke="#90A4AE" stroke-width="1.2"/><path d="M12 3v6M6.5 9h11" stroke="#90A4AE" stroke-width="1.2" fill="none"/>`,
 '🔦':`<path d="M3 14l7-7 5 5-7 7z" fill="#455A64"/><path d="M10 7l3-3 7 7-3 3z" fill="#90A4AE"/><path d="M14 3l7 7" stroke="#FFF176" stroke-width="2.5"/><path d="M17 1.5l4 1M22.5 6l-1 4" stroke="#FFEB3B" stroke-width="1.5"/>`,
 '🐔':`<ellipse cx="11" cy="15" rx="8" ry="6" fill="#FAFAFA" stroke="#BDBDBD"/>${C(16,8,4,'#FAFAFA','stroke="#BDBDBD"')}<path d="M14 4q1.5-3 3 0q1.5-2.5 2.5 1" fill="#E53935"/><path d="M19.5 8l3 1-3 1.2z" fill="#FFB300"/>${C(17,7.4,.8,'#212121',NS)}<path d="M9 21v2M13 21v2" stroke="#FF9800" stroke-width="1.5"/>`,
 '🌿':`<path d="M4 21C8 13 14 7 21 3" fill="none" stroke="#558B2F" stroke-width="1.8"/><path d="M9 15c-4 0-6-2-6-4 3 0 5 1 6 4zM13 10c0-4 2-6 4-6 0 3-1 5-4 6zM15 9c4 0 6 2 6 3-3 1-5 0-6-3z" fill="#7CB342"/>`,
 '🚬':`<rect x="2" y="13" width="15" height="4" rx="1" fill="#ECEFF1"/><rect x="14" y="13" width="3" height="4" fill="#FF8A65"/><path d="M19 12q2-2 0-4t0-5" fill="none" stroke="#B0BEC5" stroke-width="1.5"/>`,
 '🍌':`<path d="M4 6c1 9 7 14 16 13 0 1-1 2-2 2C10 22 4 16 3 7z" fill="#FFD54F"/><path d="M3 5l1.5 1.5" stroke="#6D4C41" stroke-width="2"/>`,
 '⏰':`${C(12,13,8,'#E53935')}${C(12,13,6,'#FFF')}<path d="M12 9v4l3 2" fill="none" stroke="#263238" stroke-width="1.6"/><path d="M4 6l3-3M20 6l-3-3" stroke="#E53935" stroke-width="2"/>`,
 '🌀':`<path d="M12 12m-1 0a1 1 0 112 0 3 3 0 01-6 0 5 5 0 0110 0 7 7 0 01-14 0 9 9 0 0118 0" fill="none" stroke="#42A5F5" stroke-width="2"/>`,
 '🚪':`<rect x="5" y="2.5" width="14" height="19" rx="1" fill="#8D6E63"/><rect x="7.5" y="5" width="9" height="6" rx="1" fill="#A1887F"/>${C(16,13,1,'#FFC107',NS)}`,
 '🖐':`<path d="M7 12V5.5a1.5 1.5 0 013 0V11V3.5a1.5 1.5 0 013 0V11V4.5a1.5 1.5 0 013 0V12v-4a1.5 1.5 0 013 0v7c0 4-3 7-7 7h-1c-3 0-5-2-6-4l-2-4a1.5 1.5 0 012.5-1.5z" fill="#FFCC80" stroke="#E0A060" stroke-width=".8"/>`,
 '🐣':`<path d="M5 13h14l-1.5 6c-.5 2-2.5 3-5.5 3s-5-1-5.5-3z" fill="#FFF3D6" stroke="#D7C39A"/><path d="M5 13l2-2 2 2 2-2 2 2 2-2 2 2 2-2" fill="none" stroke="#D7C39A"/>${C(12,8,4.5,'#FFEB3B')}<path d="M15.5 8l2.5 .8-2.5 .8z" fill="#FF9800"/>${C(13.3,7,.8,'#212121',NS)}`,
 '🌋':`<path d="M10 7c-1-2 0-4 2-4.5 2 .5 3 2.5 2 4.5" fill="#B0BEC5"/><path d="M2 21l6.5-11h7L22 21z" fill="#795548"/><path d="M8.5 10h7l-1.5 2.5-2-1-2 1z" fill="#FF7043"/>`,
 '☕':`<path d="M8 6c-.6-1 .6-2 0-3M12 6c-.6-1 .6-2 0-3" fill="none" stroke="#B0BEC5"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke-width="2"/><path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="#ECEFF1"/><rect x="5.5" y="9.5" width="10" height="2" fill="#6D4C41" ${NS}/>`,
 '🌈':`<g fill="none" stroke-width="2.2"><path d="M2.5 19a9.5 9.5 0 0 1 19 0" stroke="#E53935"/><path d="M5 19a7 7 0 0 1 14 0" stroke="#FDD835"/><path d="M7.5 19a4.5 4.5 0 0 1 9 0" stroke="#43A047"/><path d="M10 19a2 2 0 0 1 4 0" stroke="#1E88E5"/></g>`,
 '☀':`<path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" fill="none" stroke="#FFC107" stroke-width="2.2"/>${C(12,12,5,'#FFC107')}`,
 '☄':comet,
 '🔌':`<path d="M8 2.5v4M16 2.5v4M12 17.5v4.5" stroke-width="2.4"/><path d="M5 6.5h14v4a7 7 0 0 1-14 0z" fill="#90A4AE"/>`,
 '💛':`<path d="M12 21C5 16 2 12.5 2 8.5A5 5 0 0 1 12 6a5 5 0 0 1 10 2.5c0 4-3 7.5-10 12.5z" fill="#FFD54F"/>`,
 '🤖':`<path d="M12 7V3.5M4 12H2.5v3H4M20 12h1.5v3H20" fill="none"/>${C(12,3,1.3,'#E53935')}<rect x="4" y="7" width="16" height="13" rx="3" fill="#90A4AE"/>${C(9,13,2,'#4FC3F7')}${C(15,13,2,'#4FC3F7')}<path d="M9 17.5h6" fill="none"/>`,
 '👥':`${C(16.5,7.5,3,'#B0BEC5')}<path d="M14 13.6c4-.8 7.5 1.4 7.5 5.9h-4z" fill="#B0BEC5"/>${C(9,8,3.5,'#78909C')}<path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5z" fill="#78909C"/>`,
 '💪':`<path d="M4 20.5c-.8-3 .2-6 2.5-8.5L9 6.5c.5-1.6 1.8-3 3.6-3 1.6 0 2.4 1.2 1.9 2.6L13 8.5c2.6-1.2 5.6-.6 7 1.8 1.6 2.8.6 6.4-2.4 8.2-3.6 2.2-9 2.6-13.6 2z" fill="#FFCA28"/><path d="M13 8.5c-1.2.6-2 1.6-2.3 2.8M9 14c2 .8 4.5.6 6.4-.6" fill="none"/>`,
 '📤':`<path d="M3 13h5l1.5 3h5L16 13h5v8H3z" fill="#90CAF9"/><path d="M12 12V3M8.5 6.5L12 3l3.5 3.5" fill="none" stroke="#1E88E5" stroke-width="2.2"/>`,
};

/* outlines take the text colour: light on dark panels, dark on light speech bubbles */
const G='stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"';
const norm=s=>s.replace(/️/g,'');
const RX=/(?:[\u{1F1E6}-\u{1F1FF}]{2}|[\u{1F000}-\u{1FAFF}⌀-⏿☀-➿⬀-⯿](?:️)?(?:‍[\u{1F000}-\u{1FAFF}☀-➿⬀-⯿](?:️)?)*)/gu;
const HAS=/[\u{1F000}-\u{1FAFF}⌀-⏿☀-➿⬀-⯿]/u;
const svgOf=k=>`<svg class="ei" viewBox="0 0 24 24" role="img" aria-label="${k}"><g ${G}>${E[k]}</g></svg>`;
window.EMOJI_ICON=k=>E[norm(k)]?svgOf(norm(k)):null;
const SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CANVAS:1,NOSCRIPT:1};

function fixText(t){
  const p=t.parentNode;if(!p||SKIP[p.nodeName]||p.closest&&p.closest('svg'))return;
  const s=t.data;if(!HAS.test(s))return;
  /* <option> cannot hold pictures: drop the emoji there */
  if(p.nodeName==='OPTION'||p.nodeName==='TITLE'){const n=s.replace(RX,m=>E[norm(m)]?'':m).replace(/^\s+/,'');if(n!==s)t.data=n;return}
  RX.lastIndex=0;let m,last=0,frag=null;
  while((m=RX.exec(s))){const k=norm(m[0]);if(!E[k])continue;
    frag=frag||document.createDocumentFragment();
    if(m.index>last)frag.appendChild(document.createTextNode(s.slice(last,m.index)));
    const w=document.createElement('span');w.className='eiw';w.innerHTML=svgOf(k);frag.appendChild(w.firstChild);last=m.index+m[0].length}
  if(!frag)return;
  if(last<s.length)frag.appendChild(document.createTextNode(s.slice(last)));
  p.replaceChild(frag,t);
}
function fix(root){
  if(!root)return;
  if(root.nodeType===3){fixText(root);return}
  if(root.nodeType!==1||SKIP[root.nodeName]||root.nodeName==='svg')return;
  if(!HAS.test(root.textContent||''))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const list=[];let n;while((n=w.nextNode()))list.push(n);
  list.forEach(fixText);
}
window.iconizeEmoji=fix;
const css=document.createElement('style');
css.textContent='.ei{width:1.2em;height:1.2em;vertical-align:-.24em;display:inline-block;flex-shrink:0;overflow:visible}';
document.head.appendChild(css);
fix(document.body);
/* everything that appears later (coach messages, panels, toasts, animations) */
let pend=new Set(),sched=false;
const flush=()=>{sched=false;const a=[...pend];pend.clear();a.forEach(n=>{if(n.isConnected)fix(n)})};
new MutationObserver(ms=>{for(const m of ms){
    if(m.type==='characterData')pend.add(m.target);
    else for(const n of m.addedNodes){if(n.nodeType===1&&n.nodeName==='svg')continue;pend.add(n)}}
  if(pend.size&&!sched){sched=true;queueMicrotask(flush)}
}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
