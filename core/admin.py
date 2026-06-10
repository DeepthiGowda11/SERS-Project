from django.contrib import admin
from .models import Student, EmotionLog, Alert, ParentNotification

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'class_name']

@admin.register(EmotionLog)
class EmotionLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'emotion', 'subject', 'timestamp']
    list_filter = ['emotion', 'subject']

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['student', 'message', 'created_at', 'is_read']

@admin.register(ParentNotification)
class ParentNotificationAdmin(admin.ModelAdmin):
    list_display = ['student', 'emotion_trigger', 'subject', 'created_at', 'is_sent']