from django.contrib import admin
from .models import Story, Part, Like, Comment, Bookmark, Notification, Report


class PartInline(admin.TabularInline):
    model = Part
    extra = 0
    fields = ['parent', 'author', 'content', 'is_ending']


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'genre', 'language', 'created_by', 'is_featured', 'is_hidden', 'views', 'created_at']
    list_filter = ['genre', 'language', 'is_featured', 'is_hidden']
    list_editable = ['is_featured', 'is_hidden']
    search_fields = ['title']
    inlines = [PartInline]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ['id', 'story', 'parent', 'author', 'is_ending', 'created_at']
    list_filter = ['story']


admin.site.register(Like)
admin.site.register(Comment)
admin.site.register(Bookmark)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "actor", "verb", "story", "is_read", "created_at"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["part", "reporter", "reason", "status", "created_at"]
    list_filter = ["status", "reason"]
