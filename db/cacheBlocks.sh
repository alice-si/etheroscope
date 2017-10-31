#!/bin/bash
echo "Preparing logger"
(nice -n 5 node ./cacheBlocks.js &> /dev/null) & disown
exit
