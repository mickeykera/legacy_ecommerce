from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User


class AccountsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin', password='adminpass', email='admin@example.com'
        )

    def test_register_user(self):
        data = {
            'username': 'newuser',
            'email': 'u@example.com',
            'password': 'newpass123',
        }
        resp = self.client.post(
            reverse('user-register'),
            data,
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        # registration should return tokens
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_user_list_requires_admin(self):
        resp = self.client.get(reverse('user-list'))
        self.assertIn(
            resp.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
        # login as admin
        self.client.login(username='admin', password='adminpass')
        resp = self.client.get(reverse('user-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_verify_and_password_reset_flow(self):
        # register user
        data = {
            'username': 'vuser',
            'email': 'v@example.com',
            'password': 'verify123',
        }
        resp = self.client.post(
            reverse('user-register'),
            data,
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # token for verification: generate via serializer util
        from django.contrib.auth.models import User
        user = User.objects.get(username='vuser')
        from .serializers import RegisterSerializer
        token = RegisterSerializer().generate_verification_token(user)
        # verify
        resp = self.client.post(
            reverse('verify-email'),
            {'token': token},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # request password reset
        resp = self.client.post(
            reverse('password-reset'),
            {'email': 'v@example.com'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('token', resp.data)
        reset_token = resp.data['token']

        # confirm reset
        resp = self.client.post(
            reverse('password-reset-confirm'),
            {'token': reset_token, 'password': 'newpass456'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # login with new password
        login = self.client.login(username='vuser', password='newpass456')
        self.assertTrue(login)
