from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.LoginView.as_view()),
    path('refresh/', views.RefreshView.as_view()),
    path('logout/', views.logout),
    path('me/', views.me),
    path('password/', views.change_password),
    path('users/<str:username>/', views.profile),
    path('users/<str:username>/follow/', views.toggle_follow),
    path('users/<str:username>/<str:kind>/', views.follow_list),
]
