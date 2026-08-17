# Contributing to FriendChise Mobile App

Thanks for helping improve FriendChise.

## 1. Start with an issue

Either pick an issue posted or submit an issue you wish to work on and wait for approval. Depending on the issue, we expect completion within 2 days before assigning the issue to someone else.

If you are looking for ideas, see [Ideas for Contributing](https://friendchise.app/doc/contributing/ideas-for-contribution).

If the issue belongs to the web app, use the web repo instead: https://github.com/IvanTran-2001/FriendChise

## 2. Follow the exact setup steps

[Quick Start](https://friendchise.app/doc/getting-started/quick-start-mobile-app) has the step-by-step mobile setup guide.

### 2.1 Fork and clone the repo

```bash
git clone https://github.com/IvanTran-2001/friendchise-mobile-app.git
cd friendchise-mobile-app
```

### 2.2 Install dependencies

```bash
pnpm install
```

### 2.3 Create `.env`

Create a `.env` file in the repo root with these values:

```env
EXPO_PUBLIC_API_URL=https://friendchise.app
```

If you are testing against a local backend on a physical mobile device, use your computer's network IP instead of `localhost`.

### 2.4 Start the app

```bash
pnpm start
```

### 2.5 Validate changes

Run these commands in order:

```bash
pnpm typecheck
pnpm lint
```

If you ever have an application error or out of sync rerun the whole thing especially after a huge update.

## 3. Pull requests

- First of, everything should be in our dedicated [doc](https://friendchise.app/doc) otherwise, make a discussion or ask around.
- Keep PRs focused on one change when possible.
- Update docs if huge change or worth mentioning to help other developers.
- Avoid unrelated refactors in the same PR. Just make a different PR.

## 4. Congrats

You have pretty muchly all the baseline setup. Good luck and thanks for contributing.
