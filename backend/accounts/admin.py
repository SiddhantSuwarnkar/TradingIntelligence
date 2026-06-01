from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'role', 'is_staff', 'is_superuser']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Roles', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Roles', {'fields': ('role',)}),
    )

admin.site.register(User, CustomUserAdmin)
