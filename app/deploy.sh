#!/usr/bin/env bash
set -x

dir=$(mktemp -d)
cp -r ../../callsign "$dir"
cd "$dir/callsign"
git clean -fXd
rsync -aP app/* 192.168.1.2:~/callsign/

ssh 192.168.1.2 "cd callsign && docker-compose build"
ssh 192.168.1.2 "cd callsign && docker-compose down"
ssh 192.168.1.2 "cd callsign && docker-compose up -d"
