import ProductCarousel from "./ProductCarousel";

function FeaturePanel() {
  return (
    <div className="feature-panel">
      <div className="feature-panel__glow feature-panel__glow--one" aria-hidden="true" />
      <div className="feature-panel__glow feature-panel__glow--two" aria-hidden="true" />

      <div className="feature-panel__content">
        <header className="feature-panel__brand">
          <div className="feature-panel__logo">
            <img
              className="feature-panel__logo-image"
              src="/icons8-sphere-50%20(1).png"
              alt="FlowSphere logo"
            />
            <span className="feature-panel__logo-text">Sync<span className="space">Space</span></span>
          </div>
          {/*    */}
          <p className="feature-panel__tagline">
            Manage projects, teams, and workflows in one place.
          </p>
        </header>

        <ProductCarousel />
      </div>
    </div>
  );
}

export default FeaturePanel;
