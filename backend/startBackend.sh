#!/usr/bin/env bash
node server/service.js &
 node data-points-service/service.js &
  node block-timestamp-service/service.js &
   node contract-info-service/service.js &
    node transaction-list-service/service.js

