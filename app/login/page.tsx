import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="loginShell">
      <div className="loginStack">
        <Link className="brand" href="/">
          <span className="brandMark">ME</span>
          <span>
            <strong>Manicure Expert</strong>
            <small>Sua manicure onde você estiver.</small>
          </span>
        </Link>
        <AuthForm />
      </div>
    </main>
  );
}
