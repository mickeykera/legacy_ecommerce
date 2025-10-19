from rest_framework import generics, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer
from django.conf import settings
from django.shortcuts import render


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = {
        'category__id': ['exact'],
        'price': ['gte', 'lte'],
        'stock_quantity': ['gte'],
    }

    def perform_create(self, serializer):
        # Only authenticated users can create; enforced by permission_classes
        serializer.save()

    def get_permissions(self):
        # In local development allow anonymous POST so the UI create button works
        # without setting up auth. In production (DEBUG=False) the normal
        # permission_classes apply.
        if self.request and self.request.method == 'POST' and settings.DEBUG:
            return [permissions.AllowAny()]
        return [p() for p in self.permission_classes]


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


def product_page(request):
    # Simple HTML form page that posts to the API. Template loads categories
    # from the API via JS. Keep this view minimal.
    return render(request, 'products/product_form.html')
