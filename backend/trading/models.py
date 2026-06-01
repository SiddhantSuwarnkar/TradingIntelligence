from django.db import models
from django.conf import settings

class TradeNote(models.Model):
    ACTION_CHOICES = (
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
        ('HOLD', 'Hold'),
        ('WATCH', 'Watch'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trade_notes',
        db_index=True  # Django automatically indexes FKs; making it explicit.
    )
    asset_symbol = models.CharField(max_length=15, db_index=True)  # Indexing for query speed
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, default='WATCH')
    note = models.TextField()
    price_target = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.asset_symbol} ({self.action}) by {self.user.username}"
