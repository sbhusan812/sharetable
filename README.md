# Deploy on Vercel

This static site needs no build command on Vercel.

1. Install Git for Windows: https://git-scm.com/download/win
2. Create an empty GitHub repository named `sharetable`.
3. In the VS Code terminal, run `cd c:\project`, then `git init`, `git add .`, `git commit -m "Create ShareTable prototype"`, `git branch -M main`, `git remote add origin https://github.com/YOUR-USERNAME/sharetable.git`, and `git push -u origin main`.
4. Open https://vercel.com/new and sign in with GitHub.
5. Import the `sharetable` repository and select **Deploy**.
6. If asked, use framework `Other`, leave the build command empty, and use `.` as the output directory.

Vercel will provide a public `.vercel.app` URL. Future GitHub pushes redeploy automatically.

# ShareTable

A static prototype for redistributing surplus food to neighbours, NGOs, and volunteers.

## Publish it quickly with Netlify

1. Open [netlify.com/drop](https://app.netlify.com/drop).
2. Create a free Netlify account or sign in.
3. In VS Code, open the `c:\project` folder in File Explorer.
4. Drag the whole `c:\project` folder into the Netlify drop area.
5. Netlify will give you a public URL ending in `.netlify.app`.
6. Open that URL and test the food filters, share form, volunteer form, and support form.

Do not upload passwords, API keys, or private user information. This project currently contains none of those.

## Publish it with GitHub Pages

This route is better when you want version history and future collaborators.

1. Install Git from [git-scm.com/download/win](https://git-scm.com/download/win).
2. Create a new empty repository on GitHub, for example `sharetable`.
3. Open the VS Code terminal in `c:\project` and run:

```powershell
git init
git add .
git commit -m "Create ShareTable prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sharetable.git
git push -u origin main
```

4. On GitHub, open the repository's **Settings**, then **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose the `main` branch and the `/ (root)` folder, then save.
7. GitHub will show the public URL after deployment finishes.

## Important before real-world use

This version is a front-end demo. New posts are saved only in the browser's `localStorage`, so one visitor cannot see another visitor's posts. Login, identity verification, NGO accounts, volunteer hour records, payment processing, notifications, moderation, and permanent verification history still need a secure backend and database.

Before accepting real food claims or money, add:

- Authentication with role-based access for donors, receivers, NGOs, and volunteers.
- A database for listings, claims, handoffs, verification records, and volunteer hours.
- Server-side authorization and audit logs.
- Food safety, allergen, expiry, and incident-reporting fields.
- Payment processing through a provider such as Razorpay or Stripe.
- Privacy rules: show approximate locations until a claim is accepted.
- A moderation and emergency contact process.

For the first public test, use sample data and label the site as a pilot.
