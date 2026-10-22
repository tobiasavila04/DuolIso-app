import { Component } from "react";

// Sin esto, un error inesperado en cualquier componente deja la pantalla
// completamente en blanco sin ninguna pista. Es una práctica estándar de
// React para no mandar a producción una app que pueda "morir" en silencio.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error atrapado por ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="errbox">
          Algo salió mal en la aplicación.{" "}
          <button
            className="btn3d green"
            style={{ marginTop: 10 }}
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
