from rest_framework import serializers
from .models import Student, EmotionLog, Alert, ParentNotification

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class EmotionLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = EmotionLog
        fields = ['id', 'student', 'student_name', 'emotion', 'subject', 'timestamp']


class AlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = Alert
        fields = ['id', 'student', 'student_name', 'message', 'created_at', 'is_read']


class ParentNotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = ParentNotification
        fields = ['id', 'student', 'student_name', 'message', 'emotion_trigger', 'subject', 'created_at', 'is_sent']