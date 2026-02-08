#!/bin/bash

cd backend

if [ ! -d "venv" ]; then
    echo "venv not found. Creating it now..."
    python3 -m venv venv
else
    echo "venv already exists."
fi

source venv/bin/activate
pip install -r requirements.txt
python3 main.py