from django.db import models


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
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products'
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    class Meta:
        # Provide a default ordering to avoid unordered pagination warnings
        ordering = ['-created_at', 'id']
