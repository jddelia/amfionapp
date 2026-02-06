import { headers } from "next/headers";
import { getTenantPublicData } from "../../lib/api";

export default async function BookPage() {
  const host = headers().get("host");
  const tenant = await getTenantPublicData(host);

  return (
    <main>
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>{tenant.profile.businessName}</span>
        </div>
        <nav className="actions">
          <a className="button secondary" href="/">
            Home
          </a>
          <a className="button" href="/chat">
            Chat to Book
          </a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>Select a service</h1>
          <p>
            Tell the assistant what you need, or pick a service and we’ll help you lock in an
            available time.
          </p>
        </div>
        <div className="hero-card">
          <h3>Booking tips</h3>
          <ul>
            <li>Have a preferred date range ready.</li>
            <li>Share any accessibility needs upfront.</li>
            <li>Need a custom time? Chat to negotiate.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="grid">
          {tenant.services.length === 0 ? (
            <div className="card">
              <h4>We’re updating our menu</h4>
              <p>Chat with us to get a tailored recommendation.</p>
            </div>
          ) : (
            tenant.services.map((service) => (
              <div className="card" key={service.id}>
                <h4>{service.name}</h4>
                <p>{service.description}</p>
                <div className="meta">
                  <span>{service.durationMinutes} min</span>
                  <span>
                    {service.priceCents ? `$${(service.priceCents / 100).toFixed(0)}` : "Custom"}
                  </span>
                </div>
                <div className="actions">
                  <a className="button" href="/chat">
                    Check availability
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
