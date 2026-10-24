#!/usr/bin/env node
require('./scripts/update.cjs').main().catch(error=>{console.error('Update stopped: '+error.message);process.exitCode=1;});
