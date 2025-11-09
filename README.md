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

Frontend (React + Vite)
-----------------------
No-Node Django UI (Recommended if you don't want Node)
------------------------------------------------------

You can use a built-in storefront page powered by Django templates + vanilla JS. No Node.js is required.

- URL: http://127.0.0.1:8000/api/products/ui/
- Files:
   - Template: `products/templates/products/storefront.html`
   - Styles: `products/static/products/style.css`
   - JS: `products/static/products/storefront.js`

Features:
- Search, category filter, price range, pagination
- Login via JWT token endpoint and basic create-product modal (requires auth)
- Light/dark theme toggle (persisted in localStorage)
 - Sorting (newest, price, name) and Clear Filters shortcut
 - Hash-based deep linking of filter state (shareable URL)
 - Account registration modal and category creation (authenticated)
 - Accessible modals and skeleton loading state
 - Toast notifications for success/error feedback (non-blocking)
 - List/Grid view toggle (persisted)
 - Removable active filter chips synced with URL hash
 - Numeric pagination with first/last and ellipsis
 - Favorites (local-only) with heart on cards
 - Create Product modal with live image preview

How to run:

1. Start the Django server:

    D:/ALX/side_project/legacy_ecommerce/.venv/Scripts/python.exe manage.py runserver

2. Open http://127.0.0.1:8000/api/products/ui/

Note: The React-based `frontend/` folder is optional and can be ignored if you prefer a zero-build setup.

Tips
----
- Post Ad requires sign-in; use the header button or the Post Ad button (it will prompt login).
- Favorites are stored locally in your browser (no server storage yet).
- Use the List view for a classifieds-like layout; the setting is remembered.
- Remove filters from the chip bar to quickly reset specific criteria.

A lightweight React storefront is scaffolded under `frontend/` with:

- Product grid (search, category & price filters, pagination)
- Auth modal (login/register via JWT endpoints)
- Product creation modal (requires auth, uses JWT token)
- Product detail modal and dedicated route (`/product/:id`)
- Light/Dark theme toggle (persisted in localStorage)
- Per-card skeleton loading shimmer while fetching
- Modern CSS theme (inspired by large e-commerce sites; all styles are original)

Quick start (frontend):

1. Install Node.js (>=18 recommended).
2. Install dependencies and start dev server (backend at 8000 should be running):

   npm install --prefix frontend
   npm run dev --prefix frontend

3. Visit http://localhost:5173 (API proxied to http://127.0.0.1:8000).

Routing:

- Home: `/` product grid
- Product detail route: `/product/<id>` (deep link capable)
- Clicking a card opens a modal; product title link navigates to route view.

Theme toggle:

- Header button switches between light and dark themes.
- Styles controlled by CSS variables on `[data-theme]`.

Build production assets:

   npm run build --prefix frontend

This generates a `dist/` folder. You can serve those files via Django by collecting them into static storage or configuring a separate static host.

Design tokens / theming live in `frontend/src/styles.css`. Replace placeholder gradient, colors, and adjust spacing as needed. Product images currently display a neutral placeholder when `image_url` is absent.

Security / Auth Notes
---------------------

- Tokens are stored in `localStorage` for simplicity; consider using httpOnly cookies or a secure storage mechanism for production.
- Registration flow creates inactive users; flows to verify/activate can be integrated into the UI later.
- CSRF protection is not required for pure JWT JSON POSTs but ensure appropriate safeguards if adding session-authenticated forms.

Extending Further
-----------------

- Infinite scroll (replace pagination buttons) using IntersectionObserver.
- Category management UI (create/edit/delete categories for staff).
- Optimistic updates for product creation and stock edits.
- Cart and checkout domain models + UI.
- Accessibility pass (focus trapping in modals, ARIA roles for skeletons).
 - Toast stacking limit & persistence
 - Replace alerts everywhere with toasts (completed)

All brand references are illustrative; replace names, gradients, and marketing copy with your own to avoid trademark issues.
