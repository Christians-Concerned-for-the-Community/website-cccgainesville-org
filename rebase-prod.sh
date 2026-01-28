#!/usr/bin/env bash

git checkout production && git pull --rebase origin main && git push && git checkout -
