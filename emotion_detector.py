import cv2
import requests
import time
from deepface import DeepFace

# ── CONFIG ──────────────────────────────────────────────
API_URL     = "http://127.0.0.1:8000/api/emotion/"
STUDENT_ID  = 1        # Change to match the student you want to monitor
SUBJECT     = "Math"   # Change to current subject
INTERVAL    = 5        # Seconds between each emotion log
# ────────────────────────────────────────────────────────

def send_emotion(emotion):
    try:
        res = requests.post(API_URL, json={
            "student": STUDENT_ID,
            "emotion": emotion,
            "subject": SUBJECT
        })
        if res.status_code == 201:
            print(f"[✓] Sent emotion: {emotion}")
        else:
            print(f"[!] API error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[!] Could not connect to API: {e}")

def main():
    print("🎥 Starting webcam... Press Q to quit.")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[!] Could not open webcam.")
        return

    last_sent = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        display = frame.copy()

        try:
            results = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )

            for face in results:
                emotion  = face['dominant_emotion']
                region   = face['region']
                x, y, w, h = region['x'], region['y'], region['w'], region['h']

                # Emotion color
                color_map = {
                    'happy': (0,200,100), 'sad': (200,100,0),
                    'angry': (0,0,220), 'neutral': (150,150,150),
                    'surprised': (0,200,200), 'fearful': (180,0,180),
                    'disgusted': (0,150,50)
                }
                color = color_map.get(emotion, (255,255,255))

                # Draw box and label
                cv2.rectangle(display, (x,y), (x+w, y+h), color, 2)
                cv2.rectangle(display, (x, y-30), (x+w, y), color, -1)
                cv2.putText(display, emotion.upper(), (x+6, y-8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255,255,255), 2)

                # Send to API every INTERVAL seconds
                now = time.time()
                if now - last_sent >= INTERVAL:
                    send_emotion(emotion)
                    last_sent = now

        except Exception as e:
            cv2.putText(display, "No face detected", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,200), 2)

        # Status bar
        cv2.rectangle(display, (0, display.shape[0]-40), (display.shape[1], display.shape[0]), (30,30,30), -1)
        cv2.putText(display, f"SERS | Student: {STUDENT_ID} | Subject: {SUBJECT} | Interval: {INTERVAL}s",
                    (10, display.shape[0]-12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,200), 1)

        cv2.imshow("SERS - Emotion Detector", display)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("👋 Detector stopped.")

if __name__ == "__main__":
    main()