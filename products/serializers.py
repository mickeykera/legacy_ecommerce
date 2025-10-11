from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = (
        serializers.PrimaryKeyRelatedField(
            queryset=Category.objects.all(),
            source='category',
            write_only=True,
            required=False,
        )
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'category',
            'category_id',
            'stock_quantity',
            'image_url',
            'created_at',
        ]

    def validate(self, data):
        # Handle full and partial updates correctly. On partial updates, only
        # validate fields that are present in the incoming data.
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock_quantity')

        if not getattr(self, 'partial', False):
            # Full object creation/update requires these fields
            if name is None or (isinstance(name, str) and name.strip() == ''):
                raise serializers.ValidationError({'name': 'Name is required.'})
            if price is None or price <= 0:
                raise serializers.ValidationError({'price': 'Price must be greater than 0.'})
            if stock is None or stock < 0:
                raise serializers.ValidationError({'stock_quantity': 'Stock quantity must be 0 or greater.'})
        else:
            # Partial update: only validate provided fields
            if 'name' in data and (name is None or (isinstance(name, str) and name.strip() == '')):
                raise serializers.ValidationError({'name': 'Name is required.'})
            if 'price' in data and (price is None or price <= 0):
                raise serializers.ValidationError({'price': 'Price must be greater than 0.'})
            if 'stock_quantity' in data and (stock is None or stock < 0):
                raise serializers.ValidationError({'stock_quantity': 'Stock quantity must be 0 or greater.'})

        return data
