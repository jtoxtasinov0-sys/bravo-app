// Mahsulot rasmlari: 8 tagacha, galereyadan tanlash yoki sudrab tashlash,
// har rasmga rang biriktirish va joylashuvni sozlash
import { useRef, useState } from 'react';
import { api, imgUrl } from '../lib/api';
import { frameStyle, DEFAULT_FRAME } from '../lib/frame';
import { ColorDot } from '../lib/colors';
import ImageEditor from './ImageEditor';

const MAX = 8;

function ColorPicker({ value, presets, onChange, onClose }) {
  const [name, setName] = useState(value?.name || '');
  const [hex, setHex] = useState(value?.hex || '#000000');
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>Rasm rangi</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted small">Mijoz shu rangni tanlasa — shu rasm ko'rsatiladi.</p>
        <div className="color-grid">
          {presets.map((c) => (
            <button
              key={c.name}
              className={'color-opt' + (value?.name === c.name ? ' on' : '')}
              onClick={() => onChange({ name: c.name, hex: c.hex })}
            >
              <ColorDot hex={c.hex} size={18} /> {c.name}
            </button>
          ))}
        </div>
        <div className="label mt16">Yoki qo'lda kiriting</div>
        <div className="row gap8">
          <input className="grow" placeholder="Rang nomi" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} />
          <button className="btn btn-primary btn-sm" disabled={!name.trim()} onClick={() => onChange({ name: name.trim(), hex })}>
            OK
          </button>
        </div>
        <button className="btn btn-light btn-block mt16" onClick={() => onChange(null)}>
          Rangsiz (belgilanmagan)
        </button>
      </div>
    </div>
  );
}

// value: { images: [], imageFrames: [], imageColors: [] }
export default function ImagePicker({ value, onChange, presets }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [edit, setEdit] = useState(null); // indeks
  const [colorFor, setColorFor] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);

  const { images, imageFrames, imageColors } = value;

  const upload = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, MAX - images.length);
    if (!list.length) return;
    setBusy(true);
    try {
      const urls = [];
      for (const f of list) urls.push((await api.upload('products', f)).url);
      // Oxirgi tanlangan rangni yangi rasmlarga ham beramiz (qulaylik uchun)
      const lastColor = imageColors[imageColors.length - 1] || null;
      onChange({
        images: [...images, ...urls],
        imageFrames: [...imageFrames, ...urls.map(() => ({ ...DEFAULT_FRAME }))],
        imageColors: [...imageColors, ...urls.map(() => lastColor)],
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i) =>
    onChange({
      images: images.filter((_, k) => k !== i),
      imageFrames: imageFrames.filter((_, k) => k !== i),
      imageColors: imageColors.filter((_, k) => k !== i),
    });

  const move = (from, to) => {
    if (from === to || to < 0 || to >= images.length) return;
    const mv = (arr) => {
      const a = [...arr];
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x);
      return a;
    };
    onChange({ images: mv(images), imageFrames: mv(imageFrames), imageColors: mv(imageColors) });
  };

  const setAt = (key, i, v) => {
    const a = [...value[key]];
    a[i] = v;
    onChange({ ...value, [key]: a });
  };

  return (
    <div>
      <div className="img-grid">
        {images.map((u, i) => (
          <div
            key={u + i}
            className={'img-item' + (dragIdx === i ? ' dragging' : '')}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null) move(dragIdx, i);
              setDragIdx(null);
            }}
            onDragEnd={() => setDragIdx(null)}
          >
            <div className="img-thumb" onClick={() => setEdit(i)} title="Joylashuvni sozlash">
              <img src={imgUrl(u)} alt="" style={frameStyle(imageFrames[i])} />
              {i === 0 && <span className="img-main">Asosiy</span>}
            </div>
            <button className="img-color" onClick={() => setColorFor(i)}>
              {imageColors[i] ? (
                <>
                  <ColorDot hex={imageColors[i].hex} size={12} /> {imageColors[i].name}
                </>
              ) : (
                <span className="muted">+ rang</span>
              )}
            </button>
            <div className="img-actions">
              <button onClick={() => move(i, i - 1)} disabled={i === 0} title="Chapga">
                ←
              </button>
              <button onClick={() => setEdit(i)} title="Kesish / joylash">
                ✂
              </button>
              <button onClick={() => move(i, i + 1)} disabled={i === images.length - 1} title="O'ngga">
                →
              </button>
              <button className="danger" onClick={() => removeAt(i)} title="O'chirish">
                ✕
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX && (
          <div
            className={'img-add' + (over ? ' over' : '')}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
            }}
          >
            {busy ? 'Yuklanmoqda…' : (
              <>
                <b>+ Rasm</b>
                <span className="small muted">
                  bosing yoki sudrab tashlang
                  <br />
                  {images.length}/{MAX}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />

      {edit !== null && (
        <ImageEditor
          src={images[edit]}
          frame={imageFrames[edit]}
          onClose={() => setEdit(null)}
          onSave={(f) => {
            setAt('imageFrames', edit, f);
            setEdit(null);
          }}
        />
      )}
      {colorFor !== null && (
        <ColorPicker
          value={imageColors[colorFor]}
          presets={presets}
          onClose={() => setColorFor(null)}
          onChange={(c) => {
            setAt('imageColors', colorFor, c);
            setColorFor(null);
          }}
        />
      )}
    </div>
  );
}
