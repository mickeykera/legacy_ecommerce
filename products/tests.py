from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product
from django.contrib.auth.models import User


class ProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='tester', password='pass')
        self.cat = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            name='Phone',
            description='Smartphone',
            price=199.99,
            category=self.cat,
            stock_quantity=10,
            image_url='http://example.com/image.jpg',
        )

    def test_list_products(self):
        resp = self.client.get(reverse('product-list-create'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_product_unauthenticated(self):
        data = {'name': 'Tablet', 'price': 99.99, 'stock_quantity': 5}
        resp = self.client.post(reverse('product-list-create'), data)
        self.assertIn(
            resp.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def get_token_for_user(self, username='tester', password='pass'):
        # Obtain JWT token via DRF SimpleJWT endpoint
        url = reverse('token_obtain_pair')
        resp = self.client.post(
            url, {'username': username, 'password': password}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        return resp.data['access']

    def test_create_product_authenticated(self):
        token = self.get_token_for_user()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        data = {
            'name': 'Tablet',
            'price': 99.99,
            'stock_quantity': 5,
            'category_id': self.cat.id,
        }
        resp = self.client.post(
            reverse('product-list-create'), data, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Tablet')

    def test_product_detail_and_update(self):
        token = self.get_token_for_user()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('product-detail', args=[self.product.id])
        # retrieve
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # update
        resp = self.client.patch(url, {'price': 149.99}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(str(resp.data['price']), '149.99')

    def test_search_and_filter(self):
        # create some extra products
        Product.objects.create(
            name='Phone Case', price=9.99, category=self.cat, stock_quantity=50
        )
        Product.objects.create(
            name='Laptop', price=999.99, category=self.cat, stock_quantity=5
        )

        # search partial name
        resp = self.client.get(reverse('product-list-create') + '?search=Phone')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any('Phone' in p['name'] for p in resp.data['results']))

        # price range filter
        resp = self.client.get(
            reverse('product-list-create') + '?price__gte=10&price__lte=200'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for p in resp.data['results']:
            self.assertGreaterEqual(float(p['price']), 10.0)
            self.assertLessEqual(float(p['price']), 200.0)

    def test_pagination(self):
        # create many products to trigger pagination
        for i in range(15):
            Product.objects.create(
                name=f'Bulk{i}', price=1 + i, category=self.cat, stock_quantity=1
            )
        resp = self.client.get(reverse('product-list-create'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # default page size is 10 (set in settings)
        self.assertIn('results', resp.data)
        self.assertLessEqual(len(resp.data['results']), 10)

