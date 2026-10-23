// Reject tracked private paths and recognizable credentials without printing them.
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const names=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const privatePath=/(^|\/)(?:\.local-data|\.local-backups|private-[^/]*|\.env(?:\..*)?|credentials[^/]*\.json|tokens?[^/]*\.json|local-settings\.json|[^/]*-import\.json|[^/]*\.(?:sqlite3?|db|pem|key|p12|mbox|eml))($|\/)/i;
const secret=/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|ya29\.[A-Za-z0-9_-]{20,}|["'](?:refresh_token|client_secret|access_token)["']\s*:\s*["'][^"']{12,}["'])/;
let failed=false;
for(const name of names){if(privatePath.test(name)){console.error('Private file is tracked: '+name);failed=true;continue;}if(fs.existsSync(name)&&fs.statSync(name).isFile()&&secret.test(fs.readFileSync(name,'utf8'))){console.error('Possible credential in: '+name);failed=true;}}
if(failed)process.exit(1);console.log('Tracked-file privacy guard passed.');
