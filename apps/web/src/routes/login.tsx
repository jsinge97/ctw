import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button.js";

export function LoginRoute() {
  const navigate = useNavigate();

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
            void navigate({ to: "/deals" });
          }}
        >
          <label>
            Email
            <input type="email" defaultValue="am@northgate.cre" />
          </label>
          <label>
            Password
            <input type="password" defaultValue="password" />
          </label>
          <Button type="submit" variant="primary">Sign in</Button>
        </form>
      </section>
    </main>
  );
}
