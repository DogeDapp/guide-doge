(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{"+iG/":function(t,i,s){"use strict";s.r(i),s.d(i,"ChartSummarizationModule",(function(){return u}));var n=s("ofXK"),e=s("fXoL");function r(t,i){if(1&t&&(e.Tb(0,"li"),e.zc(1),e.gc(2,"number"),e.Ob(3,"p",4),e.Sb()),2&t){const t=i.$implicit;e.Cb(1),e.Bc(" (",e.ic(2,2,t.validity,"1.2-2"),") "),e.Cb(2),e.lc("innerHTML",t.text,e.qc)}}function o(t,i){if(1&t&&(e.Tb(0,"ul"),e.xc(1,r,4,5,"li",3),e.Sb()),2&t){const t=e.fc();e.Cb(1),e.lc("ngForOf",t.summaries)}}function a(t,i){1&t&&e.zc(0,"No summaries available.")}s("sNer");let c=(()=>{class t{constructor(t,i){this.host=t,this.zone=i}get datum(){return this.host.data[0]}get querySumaries(){return this.datum.querySummaries}get hasSummaries(){return this.summaries&&this.summaries.length>0}ngOnInit(){this.summaries=this.querySumaries?this.querySumaries().filter(({validity:t})=>{var i;return t>=(null!==(i=this.validityThreshold)&&void 0!==i?i:0)}).sort(({validity:t},{validity:i})=>i-t):[]}}return t.\u0275fac=function(i){return new(i||t)(e.Nb("host"),e.Nb(e.A))},t.\u0275cmp=e.Hb({type:t,selectors:[["app-summarization"]],inputs:{enabled:"enabled",validityThreshold:"validityThreshold"},decls:4,vars:2,consts:[[1,"summaries"],[4,"ngIf","ngIfElse"],["elseBlock",""],[4,"ngFor","ngForOf"],[1,"summary",3,"innerHTML"]],template:function(t,i){if(1&t&&(e.Tb(0,"div",0),e.xc(1,o,2,1,"ul",1),e.xc(2,a,1,0,"ng-template",null,2,e.yc),e.Sb()),2&t){const t=e.oc(3);e.Cb(1),e.lc("ngIf",i.hasSummaries)("ngIfElse",t)}},directives:[n.t,n.s],pipes:[n.g],styles:["[_nghost-%COMP%]{padding:1.5rem;display:block}[_nghost-%COMP%]:not(:first-child){border-top:1px solid #dadce0}[_nghost-%COMP%]   .summaries[_ngcontent-%COMP%]{font-size:16px;line-height:2em}[_nghost-%COMP%]   .summary[_ngcontent-%COMP%]{display:inline-block;margin:0}[_nghost-%COMP%]   .summary[_ngcontent-%COMP%]:first-letter{text-transform:uppercase}"]}),t})(),u=(()=>{class t{constructor(){this.A11yComponent=c}}return t.\u0275mod=e.Lb({type:t}),t.\u0275inj=e.Kb({factory:function(i){return new(i||t)},imports:[[n.c]]}),t})()}}]);