from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key')

DEBUG = os.environ.get('DEBUG', '1') == '1'

ALLOWED_HOSTS = (
    os.environ.get('ALLOWED_HOSTS', '*').split(',')
    if os.environ.get('ALLOWED_HOSTS')
    else ['*']
)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'products',
    'accounts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'store_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'store_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Allow configuring the database via DATABASE_URL for production (Heroku)
# dj_database_url may be missing in dev/test; annotate to satisfy type checkers
try:
    import dj_database_url  # type: ignore
except Exception:
    dj_database_url = None  # type: ignore

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and dj_database_url:
    # dj_database_url.parse returns a mapping used by Django
    # mypy cannot infer its exact type here
    DATABASES['default'] = dj_database_url.parse(
        DATABASE_URL, conn_max_age=600
    )  # type: ignore

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'MinimumLengthValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'CommonPasswordValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'NumericPasswordValidator'
        ),
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Use WhiteNoise for serving static files in production when available
try:
    import whitenoise  # noqa: F401
    # Insert WhiteNoise middleware just after SecurityMiddleware
    middleware = list(MIDDLEWARE)
    try:
        idx = middleware.index('django.middleware.security.SecurityMiddleware')
        middleware.insert(idx + 1, 'whitenoise.middleware.WhiteNoiseMiddleware')
    except ValueError:
        middleware.insert(0, 'whitenoise.middleware.WhiteNoiseMiddleware')
    MIDDLEWARE = middleware
    STATICFILES_STORAGE = (
        'whitenoise.storage.CompressedManifestStaticFilesStorage'
    )
except Exception:
    # WhiteNoise not installed; skip configuring it (development/test)
    pass

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True

JWT_AUTH = (
    'rest_framework_simplejwt.authentication.'
    'JWTAuthentication'
)
SESSION_AUTH = (
    'rest_framework.authentication.'
    'SessionAuthentication'
)
PAGE_PAGINATION = (
    'rest_framework.pagination.'
    'PageNumberPagination'
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        JWT_AUTH,
        SESSION_AUTH,
    ),
    'DEFAULT_PAGINATION_CLASS': PAGE_PAGINATION,
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'