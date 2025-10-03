from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        # create inactive user; require email verification to activate
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        user.is_active = False
        user.save()
        return user

    def generate_verification_token(self, user):
        # Simple dev-friendly token — in production use signed tokens / email
        from django.utils.http import int_to_base36
        return f"verify-{int_to_base36(user.id)}"
