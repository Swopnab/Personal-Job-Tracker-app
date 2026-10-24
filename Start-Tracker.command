#!/usr/bin/env node
require('./scripts/manage.cjs').main(['start','--open']).catch(error=>{console.error(error.message);process.exitCode=1;});
