import { useEffect, useRef, useState } from 'react'
import { getActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import { todayKey } from '../../core/dates'
import {
  BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  FOCUS_MINUTES,
  formatClock,
  isFinished,
  pauseFocus,
  remainingMs,
  resumeFocus,
  startFocus,
  type FocusSession,
} from '../../core/focus'
import { t } from '../../i18n'
import { pushBackHandler } from '../../platform/backButton'
import { CloseIcon } from '../../ui/icons'
import { useToast } from '../../ui/toastContext'
import { pushAdBlocker } from '../ads/blockers'
import { changeStatus } from '../tasks/actions'
import { closeFocus, openFocus, setFocus, useFocus, useFocusView } from './focusStore'
import './focus.css'

/** The current time, refreshed every second while `active` (a paused timer needs no clock). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(timer)
    }
  }, [active])
  return now
}

/** The full-screen focus timer: choose minutes, count down, then a break or mark the plan done. */
export function FocusScreen() {
  const view = useFocusView()
  if (!view.open) return null
  return <FocusPanel task={view.task} />
}

function FocusPanel({ task }: { task: { id: string; title: string } | null }) {
  const session = useFocus()
  const [minutes, setMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const running = session !== null && session.pausedAt === null
  const now = useNow(running)
  const toast = useToast()

  // Covers the screen: no ad banner over it, and Android back closes it.
  useEffect(() => {
    const releaseAd = pushAdBlocker()
    const releaseBack = pushBackHandler(() => closeFocus())
    document.body.classList.add('focus-open')
    return () => {
      releaseAd()
      releaseBack()
      document.body.classList.remove('focus-open')
    }
  }, [])

  const finished = session !== null && isFinished(session, now)
  // Buzz once when the time is up while the screen is open.
  const buzzed = useRef<FocusSession | null>(null)
  useEffect(() => {
    if (finished && session && buzzed.current !== session) {
      buzzed.current = session
      navigator.vibrate?.([300, 150, 300])
    }
  }, [finished, session])

  async function markDone(taskId: string) {
    const current = await getActive(db.tasks, taskId)
    if (current) {
      await changeStatus(db, current, 'done', todayKey())
      toast.show(t('focus.marked'))
    }
    setFocus(null)
    closeFocus()
  }

  const other = session && task && session.taskId !== task.id
  const title = session?.title ?? task?.title ?? ''
  const total = session?.durationMs ?? minutes * 60_000
  const left = session ? remainingMs(session, now) : total
  const progress = 1 - left / total

  return (
    <div className="focus" role="dialog" aria-modal="true" aria-label={t('focus.title')}>
      <header className="focus__header">
        <span className="focus__phase">
          {session?.phase === 'break' ? t('focus.phase.break') : t('focus.phase.work')}
        </span>
        <button type="button" className="icon-btn" onClick={closeFocus} aria-label={t('focus.hide')}>
          <CloseIcon />
        </button>
      </header>

      <h2 className="focus__task">{title}</h2>
      {other && <p className="notice">{t('focus.busy', { title: session.title })}</p>}

      <div className="focus__ring" style={{ '--focus-progress': progress } as React.CSSProperties}>
        <span className="focus__clock" role="timer" aria-live="off">
          {formatClock(left)}
        </span>
        {session?.pausedAt !== null && session !== null && !finished && (
          <span className="focus__paused">{t('focus.paused')}</span>
        )}
      </div>

      {!session && task && (
        <>
          <div className="chips focus__minutes" role="group" aria-label={t('focus.title')}>
            {FOCUS_MINUTES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={minutes === value}
                className="chip"
                onClick={() => setMinutes(value)}
              >
                {t('focus.minutes', { count: value })}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => setFocus(startFocus(task, minutes, Date.now()))}
          >
            {t('focus.begin')}
          </button>
        </>
      )}

      {session && !finished && (
        <div className="focus__buttons">
          {running ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setFocus(pauseFocus(session, Date.now()))}
            >
              {t('focus.pause')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setFocus(resumeFocus(session, Date.now()))}
            >
              {t('focus.resume')}
            </button>
          )}
          <button type="button" className="btn" onClick={() => setFocus(null)}>
            {t('focus.stop')}
          </button>
        </div>
      )}

      {session && finished && (
        <div className="focus__done">
          <p className="focus__done-title" role="status">
            {session.phase === 'work' ? t('focus.done.work') : t('focus.done.break')}
          </p>
          {session.phase === 'work' && (
            <>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => void markDone(session.taskId)}
              >
                {t('focus.markDone')}
              </button>
              <button
                type="button"
                className="btn btn--block"
                onClick={() =>
                  setFocus(startFocus({ id: session.taskId, title: session.title }, BREAK_MINUTES, Date.now(), 'break'))
                }
              >
                {t('focus.takeBreak', { minutes: BREAK_MINUTES })}
              </button>
            </>
          )}
          {session.phase === 'break' && (
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() =>
                setFocus(startFocus({ id: session.taskId, title: session.title }, DEFAULT_FOCUS_MINUTES, Date.now()))
              }
            >
              {t('focus.again')}
            </button>
          )}
          <button
            type="button"
            className="btn btn--block"
            onClick={() => {
              setFocus(null)
              closeFocus()
            }}
          >
            {t('focus.finish')}
          </button>
        </div>
      )}
    </div>
  )
}

/** While a session runs with the full-screen timer closed: a small pill that brings it back. */
export function FocusBar() {
  const session = useFocus()
  const view = useFocusView()
  const now = useNow(session !== null && session.pausedAt === null && !view.open)
  if (!session || view.open) return null
  const left = remainingMs(session, now)
  const label = left === 0 ? t('focus.phase.over') : formatClock(left)
  return (
    <div className="focus-bar-region">
      <button
        type="button"
        className={`focus-bar${session.pausedAt !== null ? ' focus-bar--paused' : ''}`}
        onClick={() => openFocus()}
        aria-label={t('focus.bar', { time: label, title: session.title })}
      >
        <span className="focus-bar__time">⏱ {label}</span>
        <span className="focus-bar__title">{session.title}</span>
      </button>
    </div>
  )
}
