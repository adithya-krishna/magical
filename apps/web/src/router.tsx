import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet
} from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "./lib/auth-client";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

function RootLayout() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-lg font-semibold">Muzigal Dashboard</div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link to="/" className="transition hover:text-slate-100">
              Home
            </Link>
            <Link to="/login" className="transition hover:text-slate-100">
              Login
            </Link>
            <Link
              to="/request-access"
              className="transition hover:text-slate-100"
            >
              Request Access
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-slate-300">{user.email}</span>
                <button
                  className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-slate-500"
                  onClick={() => authClient.signOut()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <span className="text-slate-400">Not signed in</span>
            )}
          </div>
        </div>
      </header>
      <main className="px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-2xl font-semibold">Welcome to Muzigal</h1>
      <p className="mt-2 text-slate-300">
        Use the sidebar to navigate through leads, admissions, and classroom
        workflows.
      </p>
    </div>
  );
}

function LoginPage() {
  const loginMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) =>
      authClient.signIn.email(values),
    onSuccess: async () => {
      await authClient.getSession();
    }
  });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your approved account to access the dashboard.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const email = String(formData.get("email") ?? "");
            const password = String(formData.get("password") ?? "");

            loginMutation.mutate({ email, password });
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                disabled={loginMutation.isPending}
              />
            </div>
            {loginMutation.error ? (
              <p className="text-sm text-rose-200">
                Unable to sign in. Double-check your credentials.
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function RequestAccessPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-2xl font-semibold">Request Access</h1>
      <p className="mt-2 text-sm text-slate-300">
        Submit your details for super admin approval.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          await fetch(`${apiUrl}/api/v1/access-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.get("email"),
              firstName: formData.get("firstName"),
              lastName: formData.get("lastName"),
              phone: formData.get("phone"),
              roleRequested: formData.get("roleRequested")
            })
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="firstName">
              First name
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              id="firstName"
              name="firstName"
              type="text"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="lastName">
              Last name
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              id="lastName"
              name="lastName"
              type="text"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            id="email"
            name="email"
            type="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="phone">
            Phone
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            id="phone"
            name="phone"
            type="tel"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="roleRequested">
            Requested role
          </label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            id="roleRequested"
            name="roleRequested"
            required
          >
            <option value="staff">Staff</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          className="w-full rounded-md bg-slate-200 px-3 py-2 text-slate-900 transition hover:bg-white"
          type="submit"
        >
          Submit request
        </button>
      </form>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage
});

const requestAccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/request-access",
  component: RequestAccessPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  requestAccessRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
