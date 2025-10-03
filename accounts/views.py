from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        # Create user using serializer, then return access and refresh tokens
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        data = {
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


class VerifyEmailView(generics.GenericAPIView):
    """Activate a user given a simple verification token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token or not token.startswith('verify-'):
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils.http import base36_to_int
        try:
            user_id = base36_to_int(token.split('-', 1)[1])
            user = User.objects.get(id=user_id)
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = True
        user.save()
        return Response({'detail': 'Account verified'}, status=status.HTTP_200_OK)


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # don't reveal presence of email in production; here we return 200
            return Response({'detail': 'If an account exists, a reset token was generated'}, status=status.HTTP_200_OK)
        # generate a simple reset token and return it (dev-friendly)
        token = f"reset-{user.id}-{str(RefreshToken.for_user(user).access_token)}"
        return Response({'detail': 'Reset token generated', 'token': token}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        password = request.data.get('password')
        if not token or not password:
            return Response({'detail': 'Token and password required'}, status=status.HTTP_400_BAD_REQUEST)
        if not token.startswith('reset-'):
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        parts = token.split('-')
        if len(parts) < 3:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = int(parts[1])
            user = User.objects.get(id=user_id)
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        return Response({'detail': 'Password updated'}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # allow users to retrieve/update their own profile; admins can access any
        obj = super().get_object()
        user = self.request.user
        if user.is_staff or obj == user:
            return obj
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied()
