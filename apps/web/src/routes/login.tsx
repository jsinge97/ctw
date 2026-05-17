import { Button } from "../components/ui/button.js";
import { useLogin } from "../hooks/use-current-session.js";

export function LoginRoute() {
  const login = useLogin();

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div>
            <strong>CTW 2.0</strong>
            <span>Deal operations</span>
          </div>
        </div>
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            login.mutate({
              email: String(form.get("email")),
              password: String(form.get("password"))
            });
          }}
        >
          <label>
            Email
            <input type="email" name="email" defaultValue="am@northgate.cre" autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" name="password" defaultValue="password" autoComplete="current-password" />
          </label>
          {login.isError ? <p className="form-error">Could not sign in with those credentials.</p> : null}
          <Button type="submit" variant="primary" isLoading={login.isPending} loadingLabel="Signing in">
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
