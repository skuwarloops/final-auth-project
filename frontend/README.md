# Angular 21 Auth Boilerplate

Full-featured authentication boilerplate built with Angular 21.2.7.

## Features

- Email sign up and verification
- JWT authentication with refresh tokens
- Role-based authorization (User & Admin roles)
- Forgot password and reset password
- View and update profile
- Admin section to manage all accounts
- Fake backend (runs entirely in the browser, no real API needed)

## Project Structure

```
src/
  app/
    _components/        # Shared components (AlertComponent)
    _helpers/           # Guards, interceptors, validators
    _models/            # TypeScript models/interfaces
    _services/          # Angular services
    account/            # Login, Register, Verify, Forgot/Reset Password
    admin/
      accounts/         # Admin: list, add, edit accounts
    home/               # Home page (after login)
    profile/            # View and update profile
  environments/         # environment.ts / environment.prod.ts
```

## Setup & Run

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open `http://localhost:4200` in your browser.

## How the Fake Backend Works

- No real API needed — all data is stored in `localStorage`
- Register a new account → check the **browser console** for the verification link
- Click the verification link to verify your account, then log in
- The **first** registered account gets the **Admin** role
- Subsequent accounts get the **User** role
- For "Forgot Password", the reset link is also printed to the console

## Switching to a Real Backend

In `src/app/app.module.ts`, remove the `fakeBackendProvider` line and the comment above it. Then set your real API URL in `src/environments/environment.ts`.

## Notes

- `AlertComponent` is declared in `AppModule` and re-declared in each feature module (account, profile, admin) because Angular feature modules have isolated declaration scopes
- `@app/*` and `@environments/*` path aliases are configured in `tsconfig.json`
- JWT tokens expire after 15 minutes; the app silently refreshes them 1 minute before expiry
