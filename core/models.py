from django.db import models

class Student(models.Model):
    name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.class_name})"


class EmotionLog(models.Model):
    EMOTION_CHOICES = [
        ('happy', 'Happy'),
        ('sad', 'Sad'),
        ('angry', 'Angry'),
        ('neutral', 'Neutral'),
        ('surprised', 'Surprised'),
        ('fearful', 'Fearful'),
        ('disgusted', 'Disgusted'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='emotion_logs')
    emotion = models.CharField(max_length=20, choices=EMOTION_CHOICES)
    subject = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.emotion} during {self.subject}"


class Alert(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='alerts')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert for {self.student.name}: {self.message[:50]}"
class ParentNotification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_notifications')
    message = models.TextField()
    emotion_trigger = models.CharField(max_length=20)
    subject = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.student.name}'s parent - {self.created_at.strftime('%d %b %Y')}"
