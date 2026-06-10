\# SERS – Student Emotion Response System



An AI-powered classroom monitoring system that detects and analyzes 

students' emotions in real time using facial expressions.



\## Tech Stack

\- \*\*Backend:\*\* Django 5.x + Django REST Framework

\- \*\*AI:\*\* DeepFace + OpenCV

\- \*\*Frontend:\*\* Tailwind CSS + Chart.js

\- \*\*Database:\*\* SQLite



\## Setup

```bash

py -3.10 -m venv venv

venv\\Scripts\\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver

```



\## Run Emotion Detector

```bash

python emotion\_detector.py

```



\## Features

\- Real-time emotion detection via webcam

\- Live dashboard with charts

\- Teacher recommendations

\- Subject-wise stress analysis

\- Automatic alert system

