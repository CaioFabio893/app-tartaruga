declare module 'leaflet' {
 type Ponto=[number,number];
 interface Mapa {setView(p:Ponto,z:number):Mapa;fitBounds(p:Ponto[],o:{padding:Ponto;maxZoom:number}):Mapa;remove():void}
 interface Camada {addTo(m:Mapa):Camada;bindTooltip(s:string,o?:{permanent?:boolean;direction?:string}):Camada;on(e:string,f:()=>void):Camada}
 export function map(el:HTMLElement):Mapa;
 export function tileLayer(url:string,op:{maxZoom:number;attribution:string}):Camada;
 export function circleMarker(p:Ponto,op:{radius:number;color:string;fillColor:string;fillOpacity:number}):Camada;
 export function circle(p:Ponto,op:{radius:number;color:string;weight:number;fillOpacity:number}):Camada;
 export namespace control {function scale(o:{imperial:boolean}):Camada}
}
