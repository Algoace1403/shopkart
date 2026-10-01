import Icon from './Icon';

export default function AuthLayout({ children }) {
  return <main className="auth-shell">
    <section className="auth-story" aria-label="Welcome to ShopKart">
      <div className="brand"><span className="brand-mark"><Icon /></span>ShopKart<span className="brand-dot">.</span></div>
      <div className="auth-story-copy"><p className="eyebrow">A little discovery. Every day.</p><h2>Find your<br />next favorite.</h2><p>Browse, save what you love, and make it yours. Your everyday essentials, all in one place.</p></div>
      <div className="bag-art" aria-hidden="true"><div className="bag-art-circle" /><Icon size={130} /><span className="art-tag">Made for your everyday.</span></div>
      <p className="auth-footnote">Good finds start here.</p>
    </section>
    <section className="auth">{children}</section>
  </main>;
}
