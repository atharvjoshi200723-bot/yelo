#!/bin/bash
cd ~/Documents/"project dune"/backend
export PORT=3001
exec node --import tsx src/index.ts
