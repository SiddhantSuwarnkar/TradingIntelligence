from django.urls import reverse
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from trading.models import TradeNote

User = get_user_model()

# Override settings globally for the test class to avoid flakiness from auth rate limits
@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ),
        'DEFAULT_PERMISSION_CLASSES': (
            'rest_framework.permissions.IsAuthenticated',
        ),
        'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
        'DEFAULT_THROTTLE_CLASSES': [
            'rest_framework.throttling.AnonRateThrottle',
            'rest_framework.throttling.UserRateThrottle',
        ],
        'DEFAULT_THROTTLE_RATES': {
            'anon': '1000/minute',  
            'user': '1000/minute',
            'auth_anon': '1000/minute', # High limit so normal tests never throttle
        }
    }
)
class TradeIntelligenceTests(APITestCase):

    def setUp(self):
        self.analyst1 = User.objects.create_user(
            username='analyst1',
            email='analyst1@primetrade.ai',
            password='analystpassword123',
            role='user'
        )
        self.analyst2 = User.objects.create_user(
            username='analyst2',
            email='analyst2@primetrade.ai',
            password='analystpassword456',
            role='user'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@primetrade.ai',
            password='adminpassword123',
            role='admin'
        )
        
        self.note1 = TradeNote.objects.create(
            user=self.analyst1,
            asset_symbol='BTC',
            action='BUY',
            price_target=92000.00,
            note='BTC retesting support levels.'
        )

    def test_user_registration_password_strength(self):
        url = reverse('auth_register')
        
        # 1. Password too short
        data = {
            'username': 'newuser',
            'email': 'newuser@primetrade.ai',
            'password': '123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

        # 2. Password with no numbers
        data['password'] = 'shortalphapass'
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Compliant password succeeds
        data['password'] = 'strongpass123'
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_registration_ignores_role_privilege_escalation(self):
        url = reverse('auth_register')
        data = {
            'username': 'fakeadmin',
            'email': 'fakeadmin@primetrade.ai',
            'password': 'fakepassword123',
            'role': 'admin'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Confirm user role defaults strictly to user
        user = User.objects.get(username='fakeadmin')
        self.assertEqual(user.role, 'user')

    def test_user_login_obtains_jwt(self):
        url = reverse('auth_login')
        data = {
            'username': 'analyst1',
            'password': 'analystpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['role'], 'user')
        self.assertEqual(response.data['username'], 'analyst1')

    def test_bola_protection_scopings(self):
        # Authenticate self.client as analyst 2
        login_url = reverse('auth_login')
        res = self.client.post(login_url, {'username': 'analyst2', 'password': 'analystpassword456'}, format='json')
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 1. BOLA Check: Accessing another user's note throws 404
        note_detail_url = reverse('tradenote-detail', kwargs={'pk': self.note1.id})
        response = self.client.get(note_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 2. BOLA Check: Deleting another user's note throws 404
        response = self.client.delete(note_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rbac_admin_oversight_and_write_locks(self):
        # Authenticate self.client as admin
        login_url = reverse('auth_login')
        res = self.client.post(login_url, {'username': 'admin', 'password': 'adminpassword123'}, format='json')
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 1. Admin can read analyst1's note (Oversight access)
        note_detail_url = reverse('tradenote-detail', kwargs={'pk': self.note1.id})
        response = self.client.get(note_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Admin cannot edit analyst1's note (Integrity lock)
        response = self.client.patch(note_detail_url, {'note': 'Admin edit attempt'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_rate_limiting_throttle(self):
        from accounts.views import AuthAnonRateThrottle
        from django.core.cache import cache
        
        # Clear throttle cache to prevent cross-test contamination
        cache.clear()
        
        # Override the rate directly on the class to bypass DRF cached settings flakiness
        original_rate = getattr(AuthAnonRateThrottle, 'rate', None)
        AuthAnonRateThrottle.rate = '2/minute'
        
        try:
            url = reverse('auth_login')
            data = {
                'username': 'analyst1',
                'password': 'wrongpassword'
            }
            
            # 1. First request
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            
            # 2. Second request
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            
            # 3. Third request -> triggers throttle
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            # Restore original rate
            if original_rate is not None:
                AuthAnonRateThrottle.rate = original_rate
            else:
                delattr(AuthAnonRateThrottle, 'rate')
