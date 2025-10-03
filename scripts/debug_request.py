import os
import django
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_backend.settings')
django.setup()

from django.contrib.auth.models import User
from products.models import Category, Product

# Create test data
User.objects.filter(username='debuguser').delete()
user = User.objects.create_user(username='debuguser', password='pass')
cat, _ = Category.objects.get_or_create(name='Electronics')
prod = Product.objects.create(name='Phone', description='Smartphone', price=199.99, category=cat, stock_quantity=10)

client = Client()
# obtain token
resp = client.post('/api/auth/token/', {'username': 'debuguser', 'password': 'pass'})
print('token status:', resp.status_code, resp.content)
if resp.status_code == 200:
    access = resp.json().get('access')
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access}'

url = f'/api/products/{prod.id}/'
print('GET', url)
resp2 = client.get(url)
print('GET status:', resp2.status_code)
try:
    print('GET data:', resp2.json())
except Exception as e:
    print('GET content:', resp2.content)

# Try PATCH
resp3 = client.patch(url, data='{"price":149.99}', content_type='application/json')
print('PATCH status:', resp3.status_code)
try:
    print('PATCH data:', resp3.json())
except:
    print('PATCH content:', resp3.content)
