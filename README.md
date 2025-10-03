E-commerce Product API (Django + DRF)

This project provides a backend API for managing products in an e-commerce platform.

Quick start

1. Create a virtual environment and activate it.

2. Install dependencies:

   pip install -r requirements.txt

3. Run migrations:

   python manage.py migrate

4. Create a superuser:

   python manage.py createsuperuser

5. Run the development server:

   python manage.py runserver

Running tests

   python manage.py test

Migrations

   python manage.py makemigrations
   python manage.py migrate

Project layout

- store_backend/: Django project
- products/: Django app for product and category models

Notes

- Configure production database and secret key via environment variables or a .env file.
- A `Procfile` is included for Heroku deployment.

Heroku deployment notes

1. Create a Heroku app and set environment variables (SECRET_KEY, DEBUG=0, DATABASE_URL if using Heroku Postgres, ALLOWED_HOSTS).

2. Install buildpacks if necessary and push the repository. Ensure `runtime.txt` matches the Python runtime.

3. Collect static files on deploy (Heroku will run `python manage.py collectstatic --noinput` if configured).

4. Example environment vars to set on Heroku:

   - DJANGO_SECRET_KEY: your-production-secret
   - DEBUG: 0
   - ALLOWED_HOSTS: yourapp.herokuapp.com

Remember to configure a production database (Heroku Postgres) or set `DATABASE_URL` appropriately. Static files are served using WhiteNoise.

User endpoints
----------------

This project exposes user management endpoints under `/api/accounts/`:

- Register a new user (returns 201):
   POST /api/accounts/register/  {"username": "alice", "email": "a@a.com", "password": "secret123"}

- List users (admin only):
   GET /api/accounts/users/

- Retrieve / update a user (self or admin):
   GET/PATCH /api/accounts/users/<id>/

Authentication
--------------
Use the token endpoints to obtain JWT tokens and include them on protected requests:

- Obtain token: POST /api/auth/token/ with {"username": "youruser", "password": "yourpass"}
- Refresh token: POST /api/auth/token/refresh/ with {"refresh": "<refresh_token>"}

Example: set header

   Authorization: Bearer <access_token>


Authentication (JWT)

This project includes JWT auth endpoints using djangorestframework-simplejwt:

- Obtain token: POST /api/auth/token/ with {"username": "youruser", "password": "yourpass"}
- Refresh token: POST /api/auth/token/refresh/ with {"refresh": "<refresh_token>"}

Include the access token in the Authorization header for protected endpoints:

   Authorization: Bearer <access_token>
