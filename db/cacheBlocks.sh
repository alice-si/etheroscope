#!/bin/bash
echo "Preparing logger"
(nice -n 5 node ./db/cacheBlocks.js &> /dev/null) & disown
exit
