// Narx, eski narx chizilgan holda
import { useStore } from '../lib/store';
import { money } from '../lib/format';

export default function PriceTag({ product, size = 'md' }) {
  const { lang } = useStore();
  const old = product.oldPrice && product.oldPrice > product.price ? product.oldPrice : null;
  return (
    <div className={`price price-${size}`}>
      <span className="price-now">{money(product.price, lang)}</span>
      {old && <span className="price-old">{money(old, lang)}</span>}
    </div>
  );
}
