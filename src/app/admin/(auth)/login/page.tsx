import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="rounded-[var(--radius-site)] border border-line bg-surface p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-sm font-medium text-ink">Store administration</p>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Sign in to manage products, content and settings. Sessions expire after 7 days.
      </p>
      <LoginForm />
    </div>
  );
}
