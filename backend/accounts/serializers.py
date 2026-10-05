from django.contrib.auth import get_user_model
from rest_framework import exceptions, serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def validate_username(self, v):
        if not v.replace('_', '').isalnum():
            raise serializers.ValidationError('Use only letters, numbers and _ (underscore).')
        return v

    def create(self, data):
        return User.objects.create_user(**data)


class LoginSerializer(TokenObtainPairSerializer):
    """Password correct aana aana account inactive na — clear message kudukkum."""

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        user = User.objects.filter(username=username).first()
        if user and not user.is_active and user.check_password(attrs.get('password', '')):
            msg = ('Your account is waiting for admin approval ⏳' if user.last_login is None
                   else 'Your account has been blocked by the admin 🚫')
            raise exceptions.AuthenticationFailed(msg, code='inactive')
        return super().validate(attrs)


class RefreshSerializer(TokenRefreshSerializer):
    """Block aana user ku pudhu token kidaikkaadhu — udane logout aaguvaanga."""

    def validate(self, attrs):
        token = RefreshToken(attrs['refresh'])
        user = User.objects.filter(id=token.payload.get('user_id')).first()
        if user is None or not user.is_active:
            raise exceptions.AuthenticationFailed('This account is not active.', code='inactive')
        return super().validate(attrs)
