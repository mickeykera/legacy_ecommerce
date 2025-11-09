from rest_framework import serializers
from .models import Category, Product, ProductImage, Favorite, ProductPriceHistory
from django.db import transaction


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'product_count']


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

    owner = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    image_urls = serializers.ListField(child=serializers.URLField(), write_only=True, required=False)

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
            'location',
            'negotiable',
            'owner',
            'images',
            'image_urls',
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
                raise serializers.ValidationError(
                    {'name': 'Name is required.'}
                )
            if price is None or price <= 0:
                raise serializers.ValidationError(
                    {'price': 'Price must be greater than 0.'}
                )
            if stock is None or stock < 0:
                raise serializers.ValidationError(
                    {'stock_quantity': 'Stock quantity must be 0 or greater.'}
                )
        else:
            # Partial update: only validate provided fields
            if (
                'name' in data
                and (name is None or (isinstance(name, str) and name.strip() == ''))
            ):
                raise serializers.ValidationError(
                    {'name': 'Name is required.'}
                )
            if 'price' in data and (price is None or price <= 0):
                raise serializers.ValidationError(
                    {'price': 'Price must be greater than 0.'}
                )
            if 'stock_quantity' in data and (stock is None or stock < 0):
                raise serializers.ValidationError(
                    {'stock_quantity': 'Stock quantity must be 0 or greater.'}
                )

        return data

    def get_owner(self, obj):
        if obj.owner:
            return {'id': obj.owner.id, 'username': getattr(obj.owner, 'username', '')}
        return None

    def get_images(self, obj):
        return [{'id': im.id, 'url': im.url} for im in getattr(obj, 'images').all()]

    @transaction.atomic
    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        product = super().create(validated_data)
        for url in image_urls:
            ProductImage.objects.create(product=product, url=url)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        image_urls = validated_data.pop('image_urls', None)
        price_before = instance.price
        product = super().update(instance, validated_data)
        if image_urls is not None:
            # replace images with provided list
            instance.images.all().delete()
            for url in image_urls:
                ProductImage.objects.create(product=instance, url=url)
        if price_before != product.price:
            ProductPriceHistory.objects.create(product=product, price=product.price)
        return product


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'product_id', 'created_at']


class ProductPriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPriceHistory
        fields = ['id', 'price', 'recorded_at']
