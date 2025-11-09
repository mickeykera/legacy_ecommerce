from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    # Category should be a ForeignKey to the Category model so other
    # parts of the code (serializers, views, tests) can reference
    # category__id and assign Category instances.
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='products'
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=120, blank=True)
    negotiable = models.BooleanField(default=False)
    owner = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    bumped_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Track price changes for history
        creating = self.pk is None
        old_price = None
        if not creating:
            try:
                old_price = Product.objects.only('price').get(pk=self.pk).price
            except Product.DoesNotExist:
                old_price = None
        super().save(*args, **kwargs)
        if creating or (old_price is not None and old_price != self.price):
            ProductPriceHistory.objects.create(product=self, price=self.price)

    def __str__(self):
        return self.name
    
    class Meta:
        # Provide a default ordering to avoid unordered pagination warnings
        ordering = ['-bumped_at', '-created_at', 'id']


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product_id}"[:60]


class ProductPriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_history')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.product_id} @ {self.price} ({self.recorded_at:%Y-%m-%d})"


class Favorite(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"Fav {self.user_id}-{self.product_id}"[:50]

    @staticmethod
    def toggle(user, product):
        obj, created = Favorite.objects.get_or_create(user=user, product=product)
        if not created:
            obj.delete()
            return False
        return True
