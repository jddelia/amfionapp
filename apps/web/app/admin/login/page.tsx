export default function AdminLoginPage() {
  return (
    <main>
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>Amfion Admin</span>
        </div>
        <nav className="actions">
          <a className="button secondary" href="/">
            Back to site
          </a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>Admin access</h1>
          <p>Sign in with your tenant credentials to manage services, FAQs, and branding.</p>
        </div>
        <div className="hero-card">
          <h3>Coming online</h3>
          <ul>
            <li>Secure auth via Supabase</li>
            <li>Role-based access controls</li>
            <li>Audit logging enabled</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h4>Authentication is being configured</h4>
        <p>
          The admin portal will authenticate against Supabase and enforce tenant-scoped access.
        </p>
      </section>
    </main>
  );
}
