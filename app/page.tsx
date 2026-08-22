import Link from "next/link";
import RestaurantScenarioCard from "./restaurant-scenario-card";

export default function Home() {
  return (
    <main className="home-shell notranslate" translate="no">
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" href="/" aria-label="Rato, inicio">
          rato<span>.</span>
        </Link>
        <div className="locale-pill">
          <span aria-hidden="true">🇲🇽</span>
          Español de México
        </div>
      </header>

      <section className="scenario-picker" aria-labelledby="page-title">
        <div className="eyebrow">ELIGE UNA ESCENA</div>
        <h1 id="page-title">
          ¿Dónde quieres
          <br />
          <em>practicar hoy?</em>
        </h1>
        <p className="intro">
          Conversaciones reales para esos momentos cotidianos en México.
        </p>

        <div className="scenario-grid">
          <RestaurantScenarioCard />
        </div>
      </section>

      <footer>
        <span className="privacy-dot" aria-hidden="true" />
        Cada conversación se adapta a tu ritmo
      </footer>
    </main>
  );
}
