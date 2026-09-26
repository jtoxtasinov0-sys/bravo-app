// Rasm: admin bergan joylashuv (zoom/x/y) bilan, yuklanmasa — logo
import { imgUrl } from '../lib/image';
import { frameStyle } from '../lib/frame';

export default function Img({ src, frame, alt = '', className = '', onClick }) {
  return (
    <div className={'img-box ' + className} onClick={onClick}>
      <img
        src={imgUrl(src)}
        alt={alt}
        loading="lazy"
        style={frameStyle(frame)}
        onError={(e) => {
          e.currentTarget.src = '/logo.svg';
          e.currentTarget.style.objectFit = 'contain';
        }}
      />
    </div>
  );
}
