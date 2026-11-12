/** Source-level motion regression. Run with node tests/motion-regression.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
const Module=require("node:module");
const filename=path.resolve(__dirname,"../src/pilot/motion.ts");
const source=fs.readFileSync(filename,"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(js,filename);
const {evaluateMotion,validateScene,solveTwoBone}=mod.exports;
const keys=[
 {frame:0,position:{x:0,y:0},state:"seated",facing:1},
 {frame:30,position:{x:0,y:0},state:"stand",facing:1},
 {frame:60,position:{x:0,y:0},state:"hold",facing:1},
 {frame:120,position:{x:240,y:0},state:"walk",facing:1},
 {frame:150,position:{x:240,y:0},state:"hold",facing:1}
];
validateScene(keys,150);
assert.equal(evaluateMotion(keys,10).seated,1);
assert.equal(evaluateMotion(keys,30).seated,1);
assert.ok(evaluateMotion(keys,45).seated>0&&evaluateMotion(keys,45).seated<1);
assert.equal(evaluateMotion(keys,60).seated,0);
assert.equal(evaluateMotion(keys,90).state,"walk");
assert.ok(evaluateMotion(keys,90).position.x>0&&evaluateMotion(keys,90).position.x<240);
assert.equal(evaluateMotion(keys,120).position.x,240);
assert.equal(evaluateMotion(keys,140).walkPhase,0);
assert.deepEqual(evaluateMotion(keys,95),evaluateMotion(keys,95));
assert.throws(()=>validateScene([{frame:1,position:{x:0,y:0},state:"hold"}],100));
assert.throws(()=>validateScene([keys[0],keys[0]],100));
const hip={x:0,y:0};
const unreachable=solveTwoBone(hip,{x:500,y:0},75,75);
assert.equal(unreachable.reachable,false);
assert.ok(Math.hypot(unreachable.foot.x,unreachable.foot.y)<150);
const reachable=solveTwoBone(hip,{x:40,y:90},75,75);
assert.equal(reachable.reachable,true);
assert.ok(Math.abs(Math.hypot(reachable.knee.x,reachable.knee.y)-75)<0.01);
assert.ok(Math.abs(Math.hypot(reachable.foot.x-reachable.knee.x,reachable.foot.y-reachable.knee.y)-75)<0.01);
assert.throws(()=>solveTwoBone(hip,{x:1,y:1},0,50));
console.log("Motion and IK regression assertions passed");
