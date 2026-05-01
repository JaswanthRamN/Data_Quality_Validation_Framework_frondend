import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          DataQuality
        </Link>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">Home</Link>
          </li>
          <li className="navbar-item">
            <Link to="/datasets" className="navbar-link">Datasets</Link>
          </li>
          <li className="navbar-item">
            <Link to="/validation" className="navbar-link">Validation</Link>
          </li>
          <li className="navbar-item">
            <Link to="/anomalies" className="navbar-link">Anomalies</Link>
          </li>
          <li className="navbar-item">
            <Link to="/metrics" className="navbar-link">Metrics</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
