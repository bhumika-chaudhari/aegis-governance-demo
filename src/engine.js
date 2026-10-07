const patterns = [
  [/ignore (all )?(previous instructions|all rules)/i,'Instruction override'], [/reveal (the )?system prompt|system prompt/i,'System prompt extraction'], [/bypass security|disable guardrails|override policy/i,'Guardrail bypass'], [/drop table|delete database|destroy (the )?production/i,'Destructive command'], [/dump all|export all|send .* (webhook|external)/i,'Bulk data exfiltration'], [/aadhaar|ssn|telephone numbers|credit.card/i,'Sensitive data request'], [/credential theft|extract credentials/i,'Credential access'], [/grant .*administrator|grant .*admin|privilege escalation/i,'Privilege escalation'], [/169\.254\.169\.254|cloud metadata endpoint/i,'Cloud metadata access']
];
export function evaluate(action, agent, now = new Date()) {
  const text = action.action || '';
  if (!text.trim()) return { error:'ACTION INPUT REQUIRED' };
  const flags = patterns.filter(([re])=>re.test(text)).map(([,name])=>name);
  const reasons=[];
  let risk=0;
  const add=(n,label,category='Context')=>{risk+=n; reasons.push({points:n,label,category});};
  const amount=Number(action.amount)||0;
  if(action.env==='Production') add(15,'Production environment','Impact');
  if(amount>10000) add(Math.min(25,Math.round(amount/2500)),'High financial amount','Impact');
  if(action.frequency>5) add(20,'Abnormal transaction frequency','Behaviour');
  if(action.hour<7||action.hour>=21) add(10,'Outside normal operating hours','Behaviour');
  const withinHours=action.hour>=Number(agent.hours.slice(0,2))&&action.hour<Number(agent.hours.slice(6,8));
  if(!withinHours) add(14,'Behaviour differs from agent baseline','Behaviour');
  if(!action.reversible) add(15,'Low action reversibility','Reversibility');
  if(/unknown|external|unverified/i.test(action.target)) add(15,'Unverified or external target','Intent');
  if(agent.budget && amount && agent.used+amount>agent.budget) add(25,'Safety budget would be exceeded','Impact');
  const refundRestriction=agent.restrictions.find(x=>/refund >/i.test(x));
  const refundLimit=refundRestriction?Number(refundRestriction.match(/[\d,]+/)?.[0].replaceAll(',','')):10000;
  if(/refund/i.test(action.intent||text)&&amount>refundLimit) add(10,'Action exceeds agent authorization','Authorization');
  if(flags.some(f=>/override|extraction|bypass/i.test(f))) add(60,'Prompt injection or policy override detected','Authorization');
  if(flags.includes('Destructive command')) add(70,'Destructive production operation','Authorization');
  if(flags.includes('Bulk data exfiltration')||flags.includes('Sensitive data request')) add(60,'Potential sensitive data exfiltration','Intent');
  risk=Math.min(100,risk);
  const critical=flags.some(f=>['Destructive command','Bulk data exfiltration','Credential access','System prompt extraction','Instruction override','Guardrail bypass','Privilege escalation','Cloud metadata access'].includes(f));
  const trust=Math.max(0,Math.min(100,Math.round(100-risk*.48)));
  let decision=critical?'BLOCK':trust>=75?'ALLOW':trust>=40?'REVIEW':'BLOCK';
  if(agent.budget&&amount&&agent.used+amount>agent.budget*1.25) decision='BLOCK';
  const vector={authorization:Math.min(100,flags.length?95:(amount>10000?20:8)),intent:Math.min(100,Math.round(risk*.42)),impact:Math.min(100,Math.round((action.blast||10)*.7+amount/1500)),behaviour:Math.min(100,(action.frequency>5?91:withinHours?12:52)),reversibility:action.reversible?12:88};
  const hour=Number.isFinite(Number(action.hour))?Number(action.hour):14;
  return {risk,trust,decision,critical,reasons,flags,vector,blast:action.blast||Math.min(100,Math.round(risk*.8)),latency:14+flags.length*4+reasons.length,actionDNA:{agent:agent.id,intent:action.intent||'Agent action',target:action.target||'Internal service',amount,sensitivity:action.sensitivity||'Operational',environment:action.env||'Production',time:action.timeLabel||`${String(hour).padStart(2,'0')}:47`,frequency:action.frequency||1,reversibility:action.reversible?'High':'Low',authorization:critical?'VIOLATION':flags.length?'REVIEW':'VALID'}};
}
