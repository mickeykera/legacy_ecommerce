from django.urls import path
from .views import (
    ProductListCreateView,
    ProductRetrieveUpdateDestroyView,
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    product_page,
    storefront,
    FavoriteListCreateView,
    FavoriteDestroyView,
    ProductPriceHistoryListView,
    bump_product,
)

urlpatterns = [
    path(
        '', ProductListCreateView.as_view(), name='product-list-create'
    ),
    path(
        '<int:pk>/',
        ProductRetrieveUpdateDestroyView.as_view(),
        name='product-detail',
    ),
    path(
        'categories/', CategoryListCreateView.as_view(), name='category-list-create'
    ),
    path(
        'categories/<int:pk>/',
        CategoryRetrieveUpdateDestroyView.as_view(),
        name='category-detail',
    ),
    # HTML product form page for local development
    path('page/', product_page, name='product-page'),
    # No-Node storefront UI
    path('ui/', storefront, name='storefront'),
    # Favorites
    path('favorites/', FavoriteListCreateView.as_view(), name='favorite-list-create'),
    path('favorites/<int:pk>/', FavoriteDestroyView.as_view(), name='favorite-destroy'),
    # Price history & bump
    path('<int:pk>/price-history/', ProductPriceHistoryListView.as_view(), name='price-history'),
    path('<int:pk>/bump/', bump_product, name='product-bump'),
]
