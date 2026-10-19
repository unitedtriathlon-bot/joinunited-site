/**
 * UNITED Stonehenge 1 — Google Apps Script web app.
 * Deploy as: Execute as Me; access Anyone.
 * Set Script Property LEAD_SECRET to a long random string.
 * Set Script Property ALLOWED_ORIGIN to https://joinunited.ae
 * This uses JSONP for response only; never put personal data in URLs.
 */
const TO = 'bolshakov@joinunited.ae';
const CC = 'support@joinunited.ae';
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const required = ['name','phone','goal','preferred_time','interest'];
    if (required.some(k => !String(data[k] || '').trim())) throw Error('Missing fields');
    if (!/^[a-zA-Z0-9_-]{20,80}$/.test(String(data.request_id || ''))) throw Error('Bad request ID');
    if (String(data.website || '').trim()) throw Error('Spam');
    const id = String(data.request_id);
    lock.waitLock(10000);
    const store = PropertiesService.getScriptProperties();
    if (store.getProperty('lead_' + id) === 'sent') return output({ok:true,id});
    const safe = x => String(x || '').slice(0,400).replace(/[<>]/g,'');
    const subject = 'Stonehenge 1 — ' + safe(data.interest);
    const body = ['New UNITED Stonehenge 1 request', '','Name: '+safe(data.name),
      'WhatsApp: '+safe(data.phone),'Goal: '+safe(data.goal),
      'Preferred time: '+safe(data.preferred_time),'Service: '+safe(data.interest),
      'Source: Stonehenge 1 kiosk','Request ID: '+id].join('\n');
    MailApp.sendEmail({to:TO,cc:CC,subject,body});
    store.setProperty('lead_' + id,'sent');
    return output({ok:true,id});
  } catch(err) {
    return output({ok:false,error:'Unable to send request'});
  } finally {try{lock.releaseLock()}catch(_){}}
}
function doGet(e) {
  const id=String((e.parameter||{}).id||'');
  const callback=String((e.parameter||{}).callback||'');
  if (!/^[a-zA-Z0-9_-]{20,80}$/.test(id) || !/^[a-zA-Z_$][\w$]{0,80}$/.test(callback))
    return ContentService.createTextOutput('Invalid request');
  const sent=PropertiesService.getScriptProperties().getProperty('lead_'+id)==='sent';
  return ContentService.createTextOutput(callback+'('+JSON.stringify({ok:sent,id})+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function output(data) {return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)}
