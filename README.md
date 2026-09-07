# Sketch game for gamers
Is a game like pinturillo but using game characters from League of legends, Overwatch and more.

## Requirements
* nodejs >=14
* yarn >=1.21.1
* a Supabase project with email/password Auth enabled

## Installing
Clone the repository, copy `.env.example` to `.env.local`, add the Supabase URL and publishable key, then run `yarn install`.

Run the database locally with the Supabase CLI:

```sh
supabase start
supabase db reset
```

Hosted projects should set email confirmation off in the Auth email provider settings for immediate access. Only the project URL and publishable key belong in browser environment variables; never expose a service-role key.

## Available Scripts
In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.

### `yarn build`

Builds the app for production to the `build` folder.

## Deployment

The React SPA is configured for Vercel in `vercel.json`. Configure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY` independently in Vercel Preview and Production environments. Production promotion and DNS changes remain separate release steps.


