import Link from "next/link";

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
          <Link className="scenario-link" href="/restaurant">
            <article className="scenario-card">
              <div className="scenario-art" aria-hidden="true">
                <RestaurantIcon />
              </div>
              <div className="scenario-content">
                <div className="scenario-meta">
                  <span>Principiante</span>
                  <span>Conversación libre</span>
                </div>
                <div className="scenario-heading">
                  <h2>Restaurante</h2>
                  <span className="scenario-arrow" aria-hidden="true">
                    →
                  </span>
                </div>
                <p>
                  Pide una mesa, pregunta por los especiales y ordena algo para comer.
                </p>
              </div>
            </article>
          </Link>
        </div>
      </section>

      <footer>
        <span className="privacy-dot" aria-hidden="true" />
        Cada conversación se adapta a tu ritmo
      </footer>
    </main>
  );
}

function RestaurantIcon() {
  return (
    <svg viewBox="0 0 96 96" role="img" aria-label="Restaurante">
      <path
        d="M28 56h40M34 56c0-11 6-20 14-20s14 9 14 20M48 36v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 62h46"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M19 32v16c0 4 3 7 7 7M26 32v31M74 32v31M69 32v12c0 3 2 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
