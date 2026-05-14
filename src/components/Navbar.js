import { Navbar as BootstrapNavbar, Nav, Container, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';

const Navbar = () => {
  const { comparisonItems } = useComparison();

  return (
    <BootstrapNavbar bg="light" expand="lg">
      <Container>
        <BootstrapNavbar.Brand href="/">Light</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Главная</Nav.Link>
            <Nav.Link as={Link} to="/catalog">Каталог</Nav.Link>
            <Nav.Link as={Link} to="/contacts">Контакты</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/comparison">
              Сравнение
              {comparisonItems.length > 0 && (
                <Badge bg="primary" className="ms-1">
                  {comparisonItems.length}
                </Badge>
              )}
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;