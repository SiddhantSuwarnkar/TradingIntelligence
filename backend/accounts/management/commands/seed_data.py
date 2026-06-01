from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from trading.models import TradeNote
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with test accounts (admin & standard users) and initial trade notes.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Create Users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            email='admin@primetrade.ai',
            defaults={'role': 'admin'}
        )
        if created:
            admin_user.set_password('adminpassword')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user: admin / adminpassword'))
        else:
            self.stdout.write('Admin user already exists.')

        analyst1, created = User.objects.get_or_create(
            username='analyst1',
            email='analyst1@primetrade.ai',
            defaults={'role': 'user'}
        )
        if created:
            analyst1.set_password('analystpassword')
            analyst1.save()
            self.stdout.write(self.style.SUCCESS('Created analyst1 user: analyst1 / analystpassword'))
        else:
            self.stdout.write('Analyst1 user already exists.')

        analyst2, created = User.objects.get_or_create(
            username='analyst2',
            email='analyst2@primetrade.ai',
            defaults={'role': 'user'}
        )
        if created:
            analyst2.set_password('analystpassword')
            analyst2.save()
            self.stdout.write(self.style.SUCCESS('Created analyst2 user: analyst2 / analystpassword'))
        else:
            self.stdout.write('Analyst2 user already exists.')

        # 2. Create Trade Notes
        # Clear existing notes to make seeding clean and repeatable
        TradeNote.objects.all().delete()
        self.stdout.write('Cleared existing trade notes.')

        # Analyst 1 Notes
        notes_analyst1 = [
            {
                'asset_symbol': 'BTC',
                'action': 'BUY',
                'price_target': Decimal('92500.00'),
                'note': 'BTC broke key resistance at $90,000, daily close looks strong. Targeting $100,000.'
            },
            {
                'asset_symbol': 'ETH',
                'action': 'WATCH',
                'price_target': Decimal('3200.00'),
                'note': 'Gas fees are hitting multi-month lows. Watching for a consolidation pattern break above $3,200.'
            },
            {
                'asset_symbol': 'SOL',
                'action': 'SELL',
                'price_target': Decimal('185.50'),
                'note': 'RSI is overbought on the 4H and daily charts. Taking profits here.'
            },
            {
                'asset_symbol': 'LINK',
                'action': 'BUY',
                'price_target': Decimal('22.00'),
                'note': 'Chainlink CCIP integration expanding rapidly. Accumulating on retests of support.'
            },
            {
                'asset_symbol': 'AVAX',
                'action': 'HOLD',
                'price_target': Decimal('35.00'),
                'note': 'Subnet activity is stable. Holding positions until testnet upgrade.'
            }
        ]

        for item in notes_analyst1:
            TradeNote.objects.create(user=analyst1, **item)

        # Analyst 2 Notes
        notes_analyst2 = [
            {
                'asset_symbol': 'DOT',
                'action': 'HOLD',
                'price_target': Decimal('6.50'),
                'note': 'Waiting for Polkadot 2.0 coretime updates before making major trade actions.'
            },
            {
                'asset_symbol': 'NEAR',
                'action': 'BUY',
                'price_target': Decimal('7.80'),
                'note': 'AI narrative in crypto remains strong. Near protocol is leading in developer count.'
            },
            {
                'asset_symbol': 'BTC',
                'action': 'WATCH',
                'price_target': Decimal('89000.00'),
                'note': 'Watching for pullback to support line at $89k to re-enter long positions.'
            }
        ]

        for item in notes_analyst2:
            TradeNote.objects.create(user=analyst2, **item)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(notes_analyst1) + len(notes_analyst2)} trade notes!'))
