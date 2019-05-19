#!/bin/bash

trap -- 'echo [$(date -u)] "SIGHUP, SIGTERM TRAPPED"' SIGHUP SIGTERM

from=$FIRST_BLOCK
to=$LAST_BLOCK
thr=$PROCESS_NUMBER

[[ -z "$from" ]] && { echo "Error: var FIRST_BLOCK not found in env"; exit 1; }
[[ -z "$to" ]] && { echo "Error: var LAST_BLOCK not found in env"; exit 1; }
[[ -z "$thr" ]] && { echo "Error: var PROCESS_NUMBER not found in env"; exit 1; }

max=$(( from > to ? from : to ))
t_min=$(( from < to ? from : to ))
PORTION=$[($max-$t_min+1+$thr-1)/$thr]
while [[ $t_min -le $max ]] ; do
    t_max=$(( t_min+PORTION-1 ))
    node server.js $t_min $(( max < t_max ? max : t_max )) &
    t_min=$[$t_min+$PORTION]
done

wait
