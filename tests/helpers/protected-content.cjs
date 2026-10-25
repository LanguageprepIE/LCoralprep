const crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function protectedContent(source,acorn){
 const records=[];
 const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'});
 function walk(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='VariableDeclarator'&&node.id?.type==='Identifier'&&node.init&&
    (/prompt|criteria|calibration/i.test(node.id.name)||/^(DATA|RP_|OPINION|PAST_Q|FUT_Q|STORIE|PERSONAL_OPENERS|FULL_MOCK|SRAITH_|POEMS_)/.test(node.id.name)))records.push(['variable',node.id.name,source.slice(node.init.start,node.init.end)]);
  if(node.type==='FunctionDeclaration'&&/^(assessmentPrompt|germanAssessmentPrompt)$/.test(node.id?.name))records.push(['function',node.id.name,source.slice(node.start,node.end)]);
  if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='callSmartAI'&&node.arguments[0]&&['TemplateLiteral','BinaryExpression','Literal'].includes(node.arguments[0].type))records.push(['directAI',source.slice(node.arguments[0].start,node.arguments[0].end)]);
  for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'&&value.type)walk(value);}
 }
 walk(ast);return {count:records.length,hash:hash(JSON.stringify(records))};
}
module.exports={hash,protectedContent};
