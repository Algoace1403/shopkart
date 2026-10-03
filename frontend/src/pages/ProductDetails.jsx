import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import AddToCartButton from '../components/AddToCartButton';
import { api } from '../services/api';

// Read the product ID from the /products/:id URL.
export default function ProductDetails() {
  const { id } = useParams();
  // A new key resets loading and product state when the URL switches to another product.
  return <ProductDetailsContent key={id} id={id} />;
}

// Load and display one product, with loading and error messages.
function ProductDetailsContent({ id }) {
  // Keep the returned product and current request status in state.
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Fetch this ID from the backend when the component opens.
  useEffect(() => {
    // Cancel the fetch if this product page is closed before the response arrives.
    const controller = new AbortController();
    api(`/products/${id}`, { signal: controller.signal }).then(setProduct).catch(error => {
      if (error.name !== 'AbortError') setError(error.status === 404 ? 'Product not found.' : 'Something went wrong while loading products.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [id]);
  // Render the details only after the request has succeeded.
  return (
    <>
      <main>
        <Link className="back-link" to="/products">← Back to Products</Link>
        {loading ? <p role="status">Loading products...</p> : error ? <p className="error" role="alert">{error}</p> : (
          <article className="product-details">
            <div className="detail-image"><ProductImage product={product} /></div>
            <div>
              <p className="eyebrow">{product.category}</p><h1>{product.name}</h1>
              <p>{product.description}</p>
              <p className="price detail-price">₹{product.price.toLocaleString('en-IN')}</p>
              <p>Category: {product.category}</p>
              <p>Stock: {product.stock}</p>
              <AddToCartButton product={product} />
            </div>
          </article>
        )}
      </main>
    </>
  );
}
