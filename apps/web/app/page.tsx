import { headers } from "next/headers";
import { getTenantPublicData } from "../lib/api";

export default async function HomePage() {
  const host = (await headers()).get("host");
  const tenant = await getTenantPublicData(host);

  return (
    <main>
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>{tenant.profile.businessName}</span>
        </div>
        <nav className="actions">
          <a className="button secondary" href="/book">
            Book Now
          </a>
          <a className="button" href="/chat">
            Chat with AI
          </a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="badge">AI-Enabled Booking</span>
          <h1>Book in minutes with a concierge-style assistant.</h1>
          <p>
            {tenant.profile.businessName} combines human-crafted service details with real-time
            availability to lock in appointments without the back-and-forth.
          </p>
          <div className="actions">
            <a className="button" href="/chat">
              Start a Conversation
            </a>
            <a className="button secondary" href="/book">
              View Services
            </a>
          </div>
        </div>
        <div className="hero-card">
          <h3>Today at a glance</h3>
          <ul>
            <li>Timezone: {tenant.profile.timezone}</li>
            <li>Contact: {tenant.profile.phone ?? "By request"}</li>
            <li>Email: {tenant.profile.email ?? "hello@amfion.example"}</li>
            <li>Location: {tenant.profile.city ?? "Remote"}</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="section-title">Services</h2>
        <div className="grid">
          {tenant.services.length === 0 ? (
            <div className="card">
              <h4>Services are being updated</h4>
              <p>Check back soon or start a chat to get personalized guidance.</p>
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
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: "48px" }}>
        <h2 className="section-title">Quick answers</h2>
        <div className="grid">
          {tenant.faqs.length === 0 ? (
            <div className="card">
              <h4>FAQs are loading</h4>
              <p>Ask anything in chat and we'll guide you.</p>
            </div>
          ) : (
            tenant.faqs.map((faq) => (
              <div className="card" key={faq.id}>
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="footer">
        Powered by Amfion AI booking. Policies apply: {tenant.policies?.cancellationPolicy ?? "See chat for details."}
      </footer>
    </main>
  );
}
