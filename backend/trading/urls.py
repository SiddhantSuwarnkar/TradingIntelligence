from django.urls import path, include
from rest_framework.routers import DefaultRouter
from trading.views import TradeNoteViewSet

router = DefaultRouter()
router.register(r'notes', TradeNoteViewSet, basename='tradenote')

urlpatterns = [
    path('', include(router.urls)),
]
