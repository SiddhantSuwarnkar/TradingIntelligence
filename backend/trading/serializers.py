from rest_framework import serializers
from trading.models import TradeNote

class TradeNoteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = TradeNote
        fields = ('id', 'user', 'username', 'user_role', 'asset_symbol', 'action', 'note', 'price_target', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_asset_symbol(self, value):
        # Strip whitespace and check alphanumeric
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Asset symbol cannot be blank.")
        if not cleaned.isalnum():
            raise serializers.ValidationError("Asset symbol must be alphanumeric (e.g. BTC, ETH, SOL).")
        return cleaned.upper()

    def validate_price_target(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Price target must be a positive number.")
        return value
