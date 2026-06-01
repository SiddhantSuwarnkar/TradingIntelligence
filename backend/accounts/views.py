from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.serializers import UserRegistrationSerializer, CustomTokenObtainPairSerializer

class AuthAnonRateThrottle(AnonRateThrottle):
    # Dynamic rate limiting based on 'auth_anon' configuration settings
    scope = 'auth_anon'


class UserRegistrationView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthAnonRateThrottle]


class UserLogoutView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({"message": "Successfully logged out, session revoked."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid or already blacklisted token."}, status=status.HTTP_400_BAD_REQUEST)
