from rest_framework import permissions

class IsOwnerOrAdminReadOnly(permissions.BasePermission):
    """
    Permission boundaries for trading signals.
    Standard users are scoped to their own. Admins can audit all notes
    but cannot modify another analyst's signal.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read-only oversight for principal/admin accounts
        if request.user.role == 'admin' and request.method in permissions.SAFE_METHODS:
            return True

        # Standard check: must own the record
        return obj.user == request.user
