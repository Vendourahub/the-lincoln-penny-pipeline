/** Deterministic scene-blocking primitives. All positions in stage coordinates. */
export type Vec2 = {x:number;y:number};
export type MotionState = "stand"|"walk"|"sit"|"seated"|"reach"|"hold";
export type MotionKey = {frame:number; position:Vec2; state:MotionState; facing?:-1|1; target?:Vec2};
export type ActorFrame = {position:Vec2; state:MotionState; facing:-1|1; walkPhase:number; seated:number; reach:number; target?:Vec2};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(t:number)=>{const x=clamp(t);return x*x*(3-2*x)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function evaluateMotion(keys:readonly MotionKey[],frame:number):ActorFrame {
  if(!keys.length) throw new Error("At least one motion key is required");
  for(let i=0;i<keys.length;i++){
    if(!Number.isFinite(keys[i].frame)||!Number.isFinite(keys[i].position.x)||!Number.isFinite(keys[i].position.y)) throw new Error("Invalid motion key");
    if(i&&keys[i].frame<=keys[i-1].frame) throw new Error("Motion keys must be strictly ordered");
  }
  const idx=Math.max(0,keys.findIndex((k,i)=>i===keys.length-1||frame<keys[i+1].frame));
  const a=keys[idx],b=keys[Math.min(idx+1,keys.length-1)];
  const t=a===b?0:ease((frame-a.frame)/(b.frame-a.frame));
  const position={x:mix(a.position.x,b.position.x,t),y:mix(a.position.y,b.position.y,t)};
  const moving=(Math.hypot(b.position.x-a.position.x,b.position.y-a.position.y)>2)&&a!==b&&frame>=a.frame&&frame<b.frame;
  const state:MotionState=moving?"walk":a.state;
  const facing=a.facing??(moving?(b.position.x>=a.position.x?1:-1):1);
  const seated=a.state==="seated"?1:a.state==="sit"?t:0;
  return {position,state,facing,walkPhase:moving?frame*0.22:0,seated,reach:a.state==="reach"?1:0,target:a.target};
}
export function validateScene(keys:readonly MotionKey[],totalFrames:number):void {
  if(!Number.isInteger(totalFrames)||totalFrames<=0) throw new Error("Invalid scene duration");
  evaluateMotion(keys,0);
  if(keys[0].frame!==0||keys[keys.length-1].frame>totalFrames) throw new Error("Motion keys outside scene");
}
