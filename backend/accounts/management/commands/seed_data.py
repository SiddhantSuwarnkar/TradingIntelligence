from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from trading.models import TradeNote
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with test accounts and realistic trade notes.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database records...')

        # Create admin user with administrative staff and superuser privileges for Django Admin (/admin)
        admin_user, created = User.objects.get_or_create(
            username='admin',
            email='admin@nexustrade.ai',
            defaults={
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('adminpassword')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user: admin / adminpassword'))
        else:
            # Enforce flags on existing admin profile
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.set_password('adminpassword')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Reset admin credentials and privileges.'))

        # Create standard analyst 1
        analyst1, created = User.objects.get_or_create(
            username='analyst1',
            email='analyst1@nexustrade.ai',
            defaults={'role': 'user'}
        )
        if created:
            analyst1.set_password('analystpassword')
            analyst1.save()
            self.stdout.write(self.style.SUCCESS('Created analyst1 user: analyst1 / analystpassword'))
        else:
            analyst1.set_password('analystpassword')
            analyst1.save()

        # Create standard analyst 2
        analyst2, created = User.objects.get_or_create(
            username='analyst2',
            email='analyst2@nexustrade.ai',
            defaults={'role': 'user'}
        )
        if created:
            analyst2.set_password('analystpassword')
            analyst2.save()
            self.stdout.write(self.style.SUCCESS('Created analyst2 user: analyst2 / analystpassword'))
        else:
            analyst2.set_password('analystpassword')
            analyst2.save()

        # Reset notes for seed run
        TradeNote.objects.all().delete()

        # Analyst 1 Notes (Pragmatic shorthand notes)
        notes_analyst1 = [
            {
                'asset_symbol': 'BTC',
                'action': 'BUY',
                'price_target': Decimal('92500.00'),
                'note': 'BTC broke key res at 90k, daily close looks strong. targeting 100k.'
            },
            {
                'asset_symbol': 'ETH',
                'action': 'WATCH',
                'price_target': Decimal('3200.00'),
                'note': 'gas fees hitting multi-month lows. watching for break above 3.2k.'
            },
            {
                'asset_symbol': 'SOL',
                'action': 'SELL',
                'price_target': Decimal('185.50'),
                'note': 'RSI is overbought on 4h/daily. taking profit here, wait for pullback'
            },
            {
                'asset_symbol': 'LINK',
                'action': 'BUY',
                'price_target': Decimal('22.00'),
                'note': 'CCIP integration expanding. buying on support retests.'
            },
            {
                'asset_symbol': 'AVAX',
                'action': 'HOLD',
                'price_target': Decimal('35.00'),
                'note': 'subnet activity stable. holding till testnet upgrade.'
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
                'note': 'waiting for polkadot 2.0 coretime updates before making major moves.'
            },
            {
                'asset_symbol': 'NEAR',
                'action': 'BUY',
                'price_target': Decimal('7.80'),
                'note': 'AI narrative in crypto still strong. Near leading in dev counts.'
            },
            {
                'asset_symbol': 'BTC',
                'action': 'WATCH',
                'price_target': Decimal('89000.00'),
                'note': 'look to long pullbacks to support line at 89k'
            }
        ]

        for item in notes_analyst2:
            TradeNote.objects.create(user=analyst2, **item)

        self.stdout.write(self.style.SUCCESS('Successfully seeded trade notes!'))
