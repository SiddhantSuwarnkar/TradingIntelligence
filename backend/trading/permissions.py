from rest_framework import permissions

class IsOwnerOrAdminReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit/delete it.
    Admins can view all objects, but can only edit/delete objects they own.
    """

    def has_permission(self, request, view):
        # User must be authenticated to access the API at all
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admins can view any note (SAFE_METHODS: GET, HEAD, OPTIONS)
        if request.user.role == 'admin' and request.method in permissions.SAFE_METHODS:
            return True

        # Write access (or standard user read access) is only allowed for the owner
        return obj.user == request.user
