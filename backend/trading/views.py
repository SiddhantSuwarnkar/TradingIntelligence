from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
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

        # Admin override to query all notes for audit, standard users scoped to self
        if user.role == 'admin':
            queryset = TradeNote.objects.all().select_related('user').order_by('-created_at')
        else:
            queryset = TradeNote.objects.filter(user=user).select_related('user').order_by('-created_at')

        # Filter by symbol query params if searched
        symbol = self.request.query_params.get('symbol', None)
        if symbol:
            queryset = queryset.filter(asset_symbol__icontains=symbol.strip())

        return queryset

    def perform_create(self, serializer):
        # Tie the logged-in analyst to the note instance
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        
        # Scoped queryset metrics matching get_queryset() roles
        if user.role == 'admin':
            base_qs = TradeNote.objects.all()
        else:
            base_qs = TradeNote.objects.filter(user=user)

        # Database aggregate query to keep stats pagination-resilient
        stats_data = base_qs.aggregate(
            total=Count('id'),
            buy=Count('id', filter=Q(action='BUY')),
            sell=Count('id', filter=Q(action='SELL')),
            watch=Count('id', filter=Q(action='WATCH'))
        )
        return Response(stats_data)
