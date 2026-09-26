// Story doiralari (bosh sahifa tepasida)
import { useState } from 'react';
import { useStore } from '../lib/store';
import { pick } from '../lib/i18n';
import Img from './Img';
import StoryViewer from './StoryViewer';

const SEEN_KEY = 'bravo_seen_stories';
const loadSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};

export default function Stories({ onOpenProduct }) {
  const { stories, lang } = useStore();
  const [open, setOpen] = useState(null);
  const [seen, setSeen] = useState(loadSeen);

  if (!stories.length) return null;

  const markSeen = (id) => {
    if (seen.includes(id)) return;
    const next = [...seen, id];
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      /* */
    }
  };

  return (
    <>
      <div className="stories">
        {stories.map((s, i) => (
          <button key={s.id} className={'story' + (seen.includes(s.id) ? ' seen' : '')} onClick={() => setOpen(i)}>
            <div className="story-ring">
              <Img src={s.image} />
            </div>
            <span>{pick(s, 'title', lang)}</span>
          </button>
        ))}
      </div>
      {open !== null && (
        <StoryViewer
          stories={stories}
          start={open}
          onSeen={markSeen}
          onClose={() => setOpen(null)}
          onOpenProduct={(id) => {
            setOpen(null);
            onOpenProduct(id);
          }}
        />
      )}
    </>
  );
}
