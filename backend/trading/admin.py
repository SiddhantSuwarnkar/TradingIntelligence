from django.contrib import admin
from trading.models import TradeNote

class TradeNoteAdmin(admin.ModelAdmin):
    list_display = ['asset_symbol', 'action', 'price_target', 'user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['asset_symbol', 'user__username', 'note']

admin.site.register(TradeNote, TradeNoteAdmin)
