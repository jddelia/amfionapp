import { headers } from "next/headers";
import { getTenantPublicData } from "../../lib/api";
import { ChatWidget } from "../../components/ChatWidget";

export default async function ChatPage() {
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
          <a className="button secondary" href="/book">
            Services
          </a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>Chat with our booking assistant</h1>
          <p>
            Ask about availability, prices, or rescheduling. We’ll confirm details before booking.
          </p>
        </div>
        <div className="hero-card">
          <h3>Try asking</h3>
          <ul>
            <li>“Do you have anything next Wednesday afternoon?”</li>
            <li>“What’s your cancellation policy?”</li>
            <li>“Book the 60-minute session this week.”</li>
          </ul>
        </div>
      </section>

      <ChatWidget />
    </main>
  );
}
