import { useState } from 'react';
import Icon from './Icon';

export default function ProductImage({ product }) {
  const [failedSource, setFailedSource] = useState(null);
  return failedSource === product.image || !product.image ?
    <div className="image-fallback" role="img" aria-label={product.name}><Icon size={40} /><span>Image unavailable</span></div> :
    <img src={product.image} alt={product.name} loading="lazy" onError={() => setFailedSource(product.image)} />;
}
