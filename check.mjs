import fs from 'fs';
import * as css from 'css';
const p = '/home/user/goldhall/styles.css';
const out = css.parse(fs.readFileSync(p,'utf8'));
console.log('css parse errors :', (out.stylesheet.parsingErrors||[]).length);
const flat=[]; const walk=r=>r.forEach(x=>{ if(x.rules) walk(x.rules); if(x.selectors) flat.push(x); });
walk(out.stylesheet.rules);
const r = flat.find(x=>x.selectors.includes('.footer-contact a'));
console.log('.footer-contact a ->', r ? r.declarations.map(d=>d.property).join(', ') : 'MISSING');

const footer = fs.readFileSync('/home/user/goldhall/includes/footer.php','utf8');
console.log('footer has new address :', footer.includes('goldrefineryhall01@gmail.com'));
console.log('footer mailto link     :', /href="mailto:goldrefineryhall01@gmail\.com"/.test(footer));
console.log('old address anywhere   :', /goldhall@umat\.edu\.gh/.test(footer + fs.readFileSync('/home/user/goldhall/includes/pages.php','utf8')));
const contact = fs.readFileSync('/home/user/goldhall/includes/pages.php','utf8');
console.log('contact page updated   :', contact.includes('goldrefineryhall01@gmail.com'));
// student email placeholders are example addresses for the form, not the hall's address
console.log('student placeholders untouched :', fs.readFileSync('/home/user/goldhall/student.php','utf8').includes('ama.mensah@st.umat.edu.gh'));
