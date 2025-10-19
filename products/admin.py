from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'price',
        'stock_quantity',
        'created_at',
    )
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('price', 'stock_quantity')
    readonly_fields = ('created_at',)
    fields = (
        'name',
        'description',
        'price',
        'stock_quantity',
        'category',
        'image_url',
        'created_at',
    )
    ordering = ('-created_at', 'id')
