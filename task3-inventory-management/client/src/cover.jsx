import { Link } from "react-router-dom";

function Art() {
  return (
    <svg className="art" viewBox="0 0 560 440" fill="none">
      <rect x="70" y="70" width="420" height="250" rx="24" fill="#fff" />
      <rect x="190" y="320" width="180" height="26" rx="10" fill="#f3d3fb" />
      <rect x="130" y="110" width="180" height="60" rx="12" stroke="#1f1a3d" strokeWidth="3" />
      <g transform="translate(160 205)">
        <path d="M0 -22C12 -22 20 -13 20 -3C20 10 0 28 0 28C0 28 -20 10 -20 -3C-20 -13 -12 -22 0 -22Z" fill="#ff5c9d" />
        <circle cy="-4" r="6" fill="#e11d74" />
      </g>
      <g stroke="#8a8a9a" strokeWidth="3" strokeLinecap="round">
        <path d="M130 245H310M130 265H310M130 285H310M340 245H470M340 265H470M340 285H470" />
      </g>
      <g className="spin" style={{ transformOrigin: "350px 110px" }}>
        <circle cx="350" cy="110" r="28" stroke="#2b2b3a" strokeWidth="9" strokeDasharray="4.085 4.085" />
        <circle cx="350" cy="110" r="14" stroke="#2b2b3a" strokeWidth="3" />
      </g>

      <g className="float">
        <rect x="0" y="165" width="70" height="32" rx="8" fill="#ff6fa8" />
        <rect x="20" y="130" width="110" height="200" rx="20" fill="#111a2e" />
        <path d="M40 200H100M40 214H100M40 228H85" stroke="#8fa0c0" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g className="float2">
        <rect x="380" y="150" width="150" height="90" rx="12" fill="#ff74ac" />
        <polyline points="405,215 435,185 455,205 475,190 510,215" stroke="#3b1f4a" strokeWidth="3" fill="none" strokeLinejoin="round" />
        <circle cx="470" cy="172" r="9" stroke="#3b1f4a" strokeWidth="3" />
      </g>

      <circle cx="210" cy="24" r="13" fill="#111a2e" />
      <rect x="195" y="38" width="30" height="34" rx="10" fill="#fde4ee" />
      <rect x="185" y="58" width="64" height="12" rx="6" fill="#111a2e" />

      <rect x="400" y="335" width="140" height="62" rx="14" fill="#fff" />
      <rect x="130" y="335" width="60" height="70" rx="10" fill="#fff" />
      <path d="M190 350C215 350 215 385 190 385" stroke="#fff" strokeWidth="8" fill="none" />
      <g className="float2">
        <rect x="285" y="340" width="60" height="70" rx="6" fill="#fff" transform="rotate(8 315 375)" />
        <path d="M298 362H330M298 374H330M298 386H320" stroke="#9a9ab0" strokeWidth="3" transform="rotate(8 315 375)" />
      </g>
      <rect x="215" y="402" width="170" height="14" rx="4" fill="#ff4d94" />
      <path d="M30 420H545" stroke="#1f1a3d" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Cover({ lib }) {
  const s = lib.data.summary;
  return (
    <section className="hero">
      <div className="hero-text">
        <span className="chip">Auspify Internship - Task 3</span>
        <h1>Smart <em>inventory</em><br />for every shelf.</h1>
        <p>Add products, move stock in and out, get low-stock alerts and see the value of everything you hold.</p>
        <div className="hero-actions">
          <Link className="btn white big" to="/dashboard">Open dashboard</Link>
          <Link className="btn outline big" to="/products/add">Add a product</Link>
        </div>
        <div className="hero-stats">
          <div><b>{s.products ?? 0}</b><span>Products</span></div>
          <div><b>{s.total_units ?? 0}</b><span>Units</span></div>
          <div><b>{s.low_stock ?? 0}</b><span>Low stock</span></div>
        </div>
      </div>
      <div className="hero-art"><Art /></div>
    </section>
  );
}
