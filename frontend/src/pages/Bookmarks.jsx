import { useEffect, useState } from 'react'
import api from '../api/client'
import StoryCard from '../components/StoryCard'
import { useT } from '../i18n'

export default function Bookmarks() {
  const { t } = useT()
  const [stories, setStories] = useState(null)
  useEffect(() => { api.get('/bookmarks/').then((r) => setStories(r.data.results)) }, [])
  return (
    <>
      <h1 className="page-title">{t('saved_title')}</h1>
      {!stories ? <div className="feed">{[1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
        : stories.length === 0 ? <p className="empty">{t('no_saved')}</p>
        : <div className="feed">{stories.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</div>}
    </>
  )
}
