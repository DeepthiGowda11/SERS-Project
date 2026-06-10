from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from datetime import datetime, timedelta
from .models import Student, EmotionLog, Alert, ParentNotification
from .serializers import EmotionLogSerializer, AlertSerializer, StudentSerializer, ParentNotificationSerializer

NEGATIVE_EMOTIONS = ['sad', 'angry', 'fearful', 'disgusted']

EMOTION_WEIGHTS = {
    'happy':     1.0,
    'neutral':   0.5,
    'surprised': 0.3,
    'sad':      -0.7,
    'fearful':  -0.8,
    'angry':    -1.0,
    'disgusted':-0.9,
}

@api_view(['POST'])
def log_emotion(request):
    serializer = EmotionLogSerializer(data=request.data)
    if serializer.is_valid():
        log = serializer.save()

        # ── Tier 1: Teacher Alert ──
        five_min_ago = datetime.now() - timedelta(minutes=5)
        recent_negatives = EmotionLog.objects.filter(
            student=log.student,
            emotion__in=NEGATIVE_EMOTIONS,
            timestamp__gte=five_min_ago
        ).count()
        if recent_negatives >= 3:
            Alert.objects.create(
                student=log.student,
                message=f"{log.student.name} has shown negative emotions {recent_negatives} times in the last 5 minutes during {log.subject}."
            )

        # ── Tier 2: Parent Notification ──
        thirty_min_ago = datetime.now() - timedelta(minutes=30)
        recent_neg_30 = EmotionLog.objects.filter(
            student=log.student,
            emotion__in=NEGATIVE_EMOTIONS,
            timestamp__gte=thirty_min_ago
        ).count()
        if recent_neg_30 >= 5:
            existing = ParentNotification.objects.filter(
                student=log.student,
                created_at__gte=thirty_min_ago
            ).count()
            if existing == 0:
                ParentNotification.objects.create(
                    student=log.student,
                    emotion_trigger=log.emotion,
                    subject=log.subject,
                    message=f"Dear Parent, your child {log.student.name} has been showing signs of emotional distress ({log.emotion}) repeatedly during {log.subject} class. Please check in with them."
                )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_emotions(request):
    logs = EmotionLog.objects.select_related('student').order_by('-timestamp')[:100]
    serializer = EmotionLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_dashboard(request):
    total_logs = EmotionLog.objects.count()
    emotion_counts = EmotionLog.objects.values('emotion').annotate(count=Count('emotion'))
    subject_emotions = EmotionLog.objects.values('subject', 'emotion').annotate(count=Count('id'))
    recent_logs = EmotionLog.objects.select_related('student').order_by('-timestamp')[:10]

    # ── CECI Calculation ──
    ceci_score = 50
    if total_logs > 0:
        weighted_sum = sum(
            EMOTION_WEIGHTS.get(e['emotion'], 0) * e['count']
            for e in emotion_counts
        )
        raw = weighted_sum / total_logs
        ceci_score = round((raw + 1) / 2 * 100, 1)

    if ceci_score >= 70:
        ceci_status = "Positive"
        ceci_color  = "green"
    elif ceci_score >= 40:
        ceci_status = "Neutral"
        ceci_color  = "yellow"
    else:
        ceci_status = "Stressed"
        ceci_color  = "red"

    # ── Recommendations (Current State) ──
    recommendations = []
    latest_emotions = EmotionLog.objects.values('emotion').annotate(count=Count('emotion')).order_by('-count')
    if latest_emotions:
        top = latest_emotions[0]['emotion']
        if top in ['sad', 'fearful']:
            recommendations.append("😢 Students seem confused or sad. Consider revising the topic or slowing down.")
        elif top == 'angry':
            recommendations.append("😠 High frustration detected. Consider taking a short break or changing activity.")
        elif top == 'happy':
            recommendations.append("😊 Students are engaged and happy! Keep up the current teaching style.")
        elif top == 'neutral':
            recommendations.append("😐 Students seem neutral. Try interactive activities to boost engagement.")

    # ── Emotion Prediction Engine ──
    predictions = []
    students = Student.objects.all()
    for student in students:
        logs = EmotionLog.objects.filter(student=student).order_by('-timestamp')
        total = logs.count()
        if total < 3:
            continue

        neg_count = logs.filter(emotion__in=NEGATIVE_EMOTIONS).count()
        neg_ratio = neg_count / total

        # Rule 1: Chronic Distress
        if neg_ratio >= 0.7:
            predictions.append(f"🔴 {student.name} shows chronic distress ({int(neg_ratio*100)}% negative). Recommend counseling check-in.")

        # Rule 2: Subject Stress
        subjects = logs.values('subject').distinct()
        for subj in subjects:
            subj_name = subj['subject']
            subj_logs = logs.filter(subject=subj_name)
            subj_neg = subj_logs.filter(emotion__in=NEGATIVE_EMOTIONS).count()
            subj_total = subj_logs.count()
            if subj_total >= 3 and subj_neg / subj_total >= 0.6:
                predictions.append(f"📚 {student.name} shows high stress ({int(subj_neg/subj_total*100)}%) in {subj_name}. Consider additional support.")

        # Rule 3: Escalation trend
        last5 = list(logs[:5].values_list('emotion', flat=True))
        neg_weights = [1 if e in NEGATIVE_EMOTIONS else 0 for e in last5]
        if len(neg_weights) == 5 and sum(neg_weights[:2]) < sum(neg_weights[3:]):
            predictions.append(f"⚠️ {student.name}'s emotional state is worsening. Early intervention recommended.")

        # Rule 4: Recovery detected
        last3 = list(logs[:3].values_list('emotion', flat=True))
        if all(e in ['happy', 'neutral'] for e in last3) and neg_ratio > 0.4:
            predictions.append(f"✅ {student.name} shows signs of emotional recovery. Continue current support.")

    return Response({
        'total_logs': total_logs,
        'emotion_counts': list(emotion_counts),
        'subject_emotions': list(subject_emotions),
        'recent_logs': EmotionLogSerializer(recent_logs, many=True).data,
        'recommendations': recommendations,
        'predictions': predictions,
        'ceci_score': ceci_score,
        'ceci_status': ceci_status,
        'ceci_color': ceci_color,
    })


@api_view(['GET'])
def get_alerts(request):
    alerts = Alert.objects.select_related('student').order_by('-created_at')
    serializer = AlertSerializer(alerts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_parent_notifications(request):
    notifications = ParentNotification.objects.select_related('student').order_by('-created_at')
    serializer = ParentNotificationSerializer(notifications, many=True)
    return Response(serializer.data)
import subprocess
import os

detector_process = None

@api_view(['POST'])
def control_detector(request):
    global detector_process
    action = request.data.get('action')

    if action == 'start':
        if detector_process is None or detector_process.poll() is not None:
            script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'emotion_detector.py')
            detector_process = subprocess.Popen(['python', script_path])
            return Response({'status': 'started'})
        return Response({'status': 'already_running'})

    elif action == 'stop':
        if detector_process and detector_process.poll() is None:
            detector_process.terminate()
            detector_process = None
            return Response({'status': 'stopped'})
        return Response({'status': 'not_running'})

    return Response({'error': 'invalid action'}, status=400)
@api_view(['POST'])
def send_manual_notification(request):
    student_id = request.data.get('student_id')
    message = request.data.get('message')
    subject = request.data.get('subject', 'General')
    emotion = request.data.get('emotion', 'neutral')

    try:
        student = Student.objects.get(id=student_id)
        ParentNotification.objects.create(
            student=student,
            message=message,
            emotion_trigger=emotion,
            subject=subject,
            is_sent=True
        )
        return Response({'status': 'sent', 'student': student.name}, status=status.HTTP_201_CREATED)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)