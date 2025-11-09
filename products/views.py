from rest_framework import generics, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, Favorite, ProductPriceHistory
from .serializers import ProductSerializer, CategorySerializer, FavoriteSerializer, ProductPriceHistorySerializer
from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'location']
    filterset_fields = {
        'category__id': ['exact'],
        'price': ['gte', 'lte'],
        'stock_quantity': ['gte'],
        'negotiable': ['exact'],
        'location': ['exact', 'icontains'],
    }
    ordering_fields = ['created_at', 'price', 'name']

    def perform_create(self, serializer):
        # Assign owner if authenticated
        owner = self.request.user if self.request.user.is_authenticated else None
        serializer.save(owner=owner)


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Category.objects.annotate(product_count=Count('products'))
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


def storefront(request):
    """Render the no-build storefront UI (vanilla JS + Django template).

    The template will hydrate with data fetched from the REST API endpoints.
    This avoids any Node/React build tooling while providing a modern UX.
    """
    return render(request, 'products/storefront.html')


class FavoriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDestroyView(generics.DestroyAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class ProductPriceHistoryListView(generics.ListAPIView):
    serializer_class = ProductPriceHistorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        product_id = self.kwargs['pk']
        return ProductPriceHistory.objects.filter(product_id=product_id)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bump_product(request, pk:int):
    try:
        p = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'detail':'Not found'}, status=status.HTTP_404_NOT_FOUND)
    if p.owner_id and p.owner_id != request.user.id:
        return Response({'detail':'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    p.bumped_at = p.bumped_at or None
    p.bumped_at = p.bumped_at and p.bumped_at or None
    p.bumped_at = None  # reset before setting to ensure ordering updates
    p.bumped_at = p.bumped_at  # no-op, compatibility
    from django.utils import timezone
    p.bumped_at = timezone.now()
    p.save(update_fields=['bumped_at'])
    return Response({'status':'ok', 'bumped_at': p.bumped_at})
