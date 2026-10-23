require('./check-private.cjs');require('./check-data.cjs');
const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});for(const name of ['index.html','style.css','data.js','sync.js','app.js','catalog.json','applications.json'])fs.copyFileSync(name,'dist/'+name);console.log('Built static tracker in dist/');
