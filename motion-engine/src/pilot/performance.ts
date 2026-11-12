import {ActorFrame,Vec2,solveTwoBone} from "./motion";

export type PerformanceCue={
 start:number;end:number;actor:"host"|"guest";kind:"speak"|"listen"|"react"|"point"|"pickup"|"hold"|"release";
 intensity?:number;target?:Vec2;propId?:string;
};
export type PerformanceFrame={
 speaking:number;mouth:number;blink:number;brow:number;gesture:number;lookAt?:Vec2;
 handTarget?:Vec2;heldProp?:string;propOwner?:string;expression:"neutral"|"surprise"|"confident";
};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ramp=(frame:number,start:number,end:number,edge=8)=>{
 return clamp((frame-start)/Math.min(edge,Math.max(1,(end-start)/2)))*
 clamp((end-frame)/Math.min(edge,Math.max(1,(end-start)/2)));
};
export function validatePerformance(cues:readonly PerformanceCue[],duration:number){
 for(const c of cues){
  if(!Number.isInteger(c.start)||!Number.isInteger(c.end)||c.start<0||c.end<=c.start||c.end>duration)throw Error("Invalid performance cue");
  if((c.kind==="pickup"||c.kind==="release")&&!c.propId)throw Error("Prop action needs propId");
  if((c.kind==="point"||c.kind==="pickup")&&!c.target)throw Error("Target required");
 }
}
export function evaluatePerformance(cues:readonly PerformanceCue[],frame:number,actor:"host"|"guest",motion:ActorFrame):PerformanceFrame{
 let speaking=0,gesture=0,lookAt:Vec2|undefined,handTarget:Vec2|undefined;
 let expression:PerformanceFrame["expression"]="neutral",heldProp:string|undefined;
 // Persistent prop ownership is reconstructed from past events, not mutable render state.
 for(const c of cues){
  if(c.actor!==actor||frame<c.start)continue;
  if(c.kind==="pickup"&&frame>=c.end)heldProp=c.propId;
  if(c.kind==="release"&&frame>=c.end&&heldProp===c.propId)heldProp=undefined;
  if(frame>=c.end)continue;
  const strength=ramp(frame,c.start,c.end)*(c.intensity??1);
  if(c.kind==="speak")speaking=Math.max(speaking,strength);
  if(c.kind==="react"){expression="surprise";gesture=Math.max(gesture,strength*.35);}
  if(c.kind==="point"||c.kind==="pickup"){
   gesture=Math.max(gesture,strength);
   handTarget=c.target;
   lookAt=c.target;
  }
  if(c.kind==="listen"&&c.target)lookAt=c.target;
 }
 // Stylized, deterministic speech envelope; actual phoneme alignment is a later integration.
 const mouth=speaking*(.24+.76*Math.abs(Math.sin(frame*.48)*Math.cos(frame*.13)));
 const blink=(frame%107>=103&&frame%107<=106)?1:0;
 const brow=expression==="surprise"?.85:speaking*.18;
 // Hand reach is clamped by the same two-bone arm limits as the rig.
 if(handTarget){
  const shoulder={x:motion.position.x+motion.facing*43,y:motion.position.y-183};
  handTarget=solveTwoBone(shoulder,handTarget,78,79).foot;
 }
 return {speaking,mouth,blink,brow,gesture,lookAt,handTarget,heldProp,expression};
}
export function propPosition(cues:readonly PerformanceCue[],frame:number,propId:string,initial:Vec2,actorFrames:Record<"host"|"guest",ActorFrame>):{position:Vec2;owner?:string}{
 let owner:"host"|"guest"|undefined;
 for(const c of cues){
  if(c.propId!==propId||frame<c.end)continue;
  if(c.kind==="pickup")owner=c.actor;
  if(c.kind==="release"&&owner===c.actor)owner=undefined;
 }
 if(!owner)return {position:initial};
 const a=actorFrames[owner];
 return {position:{x:a.position.x+a.facing*66,y:a.position.y-115},owner};
}
