const INDUSTRIES = ['Retail', 'Health', 'Telecom', 'Energy', 'IT', 'Real Estate', 'Technology', 'Finance', 'Government', 'Marketing', 'Hospitality', 'Travel', 'HR', 'Legal', 'Infra'];

export default function Footer() {
  return (
    <footer className="footer">
      <h4>INDUSTRY NEWS</h4>
      <div className="links">
        {INDUSTRIES.map((i) => <a key={i} href="#">{i} News</a>)}
      </div>
      <div className="links" style={{ marginTop: 20 }}>
        {['About Us', 'Contact Us', 'Privacy Policy', 'Terms & Conditions'].map((i) => <a key={i} href="#">{i}</a>)}
      </div>
      <div className="copy">Demo project with sample data only. © {new Date().getFullYear()} AutoMetrics.</div>
    </footer>
  );
}
