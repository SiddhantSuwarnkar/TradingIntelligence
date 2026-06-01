from rest_framework import viewsets, permissions
from trading.models import TradeNote
from trading.serializers import TradeNoteSerializer
from trading.permissions import IsOwnerOrAdminReadOnly

class TradeNoteViewSet(viewsets.ModelViewSet):
    serializer_class = TradeNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return TradeNote.objects.none()

        if user.role == 'admin':
            # Admins see all trade notes in the system
            queryset = TradeNote.objects.all().select_related('user').order_by('-created_at')
        else:
            # Standard users see only their own trade notes
            queryset = TradeNote.objects.filter(user=user).select_related('user').order_by('-created_at')

        # Add optional query parameter search by asset symbol
        symbol = self.request.query_params.get('symbol', None)
        if symbol:
            queryset = queryset.filter(asset_symbol__icontains=symbol.strip())

        return queryset

    def perform_create(self, serializer):
        # Set current user as owner of the new note
        serializer.save(user=self.request.user)
