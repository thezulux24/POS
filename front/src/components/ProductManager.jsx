import { useEffect, useState } from "react";
import Sidebar from "../other/Sidebar.jsx";
import "../css/ProductManager.css";
import { productService } from "../services/productService.js";

export default function ProductManager() {

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.log("ERROR REAL:", error);
      setError("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    fetchProducts();
  }, []);

  // 🛒 Añadir al carrito
  const addToCart = (product) => {
    const existing = cart.find(item => item.codigo === product.codigo);

    if (existing) {
      setCart(
        cart.map(item =>
          item.codigo === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // ➕➖ Cambiar cantidad
  const updateQuantity = (id, amount) => {
    setCart(cart.map(item =>
      item.codigo === id
        ? { ...item, quantity: Math.max(1, item.quantity + amount) }
        : item
    ));
  };

  // ❌ Eliminar producto
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.codigo !== id));
  };

  // 💰 Total
  const total = cart.reduce(
    (acc, item) => acc + item.precio * item.quantity,
    0
  );

  return (
    <div className="layout">
      <Sidebar />

      <div className="pos-container">

        {/* 🛍 PRODUCTOS */}
        <div className="products-section">
          <h2>Productos</h2>

          {error && <p className="error">{error}</p>}
          {loading && <p>Cargando...</p>}

          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <img
                  src={p.image || "https://via.placeholder.com/200"}
                  alt={p.nombre}
                  className="product-image"
                />

                <h3>{p.nombre}</h3>
                <p className="price">${p.precio}</p>
                <p>Stock: {p.stock}</p>

                <button
                  className="add-button"
                  onClick={() => addToCart(p)}
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🧾 FACTURA */}
        <div className="invoice-section">
          <h2>Factura</h2>

          {cart.length === 0 && <p>No hay productos en el carrito</p>}

          {cart.map(item => (
            <div key={item.codigo} className="invoice-item">
              <div>
                <strong>{item.name}</strong>
                <p>${item.precio} c/u</p>
              </div>

              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.codigo, -1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.codigo, 1)}>+</button>
              </div>

              <div>
                <p>${item.precio * item.quantity}</p>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.codigo)}
                >
                  x
                </button>
              </div>
            </div>
          ))}

          <hr />

          <h3>Total: ${total}</h3>

          <button className="checkout-btn">
            Finalizar Venta
          </button>
        </div>

      </div>
    </div>
  );
}
