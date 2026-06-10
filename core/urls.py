from django.urls import path
from . import views

urlpatterns = [
    path('emotion/', views.log_emotion),
    path('emotions/', views.get_emotions),
    path('dashboard/', views.get_dashboard),
    path('alerts/', views.get_alerts),
    path('students/', views.get_students),
    path('parent-notifications/', views.get_parent_notifications),
    path('detector/control/', views.control_detector),
    path('notify-parent/', views.send_manual_notification),
]