'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw, Trophy, Zap } from 'lucide-react'
import { levels, tracks, type Difficulty } from '@/data'

type Result = { trackId: number; difficulty: Difficulty; score: number; total: number; completedAt: string }

function formatTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function Page() {
    const [selectedTrack, setSelectedTrack] = useState(0)
    const [difficulty, setDifficulty] = useState<Difficulty>('Normal')
    const [started, setStarted] = useState(false)
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [revealed, setRevealed] = useState(false)
    const [finished, setFinished] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(420)
    const [results, setResults] = useState<Result[]>([])

    const track = tracks[selectedTrack]
    const questions = useMemo(() => track.questions.filter((question) => question.difficulty === difficulty), [track, difficulty])
    const safeCurrent = Math.min(current, Math.max(questions.length - 1, 0))
    const activeQuestion = questions[safeCurrent]
    const score = answers.reduce((sum, answer, index) => sum + (answer === questions[index]?.answer ? 1 : 0), 0)
    const result = results.find((item) => item.trackId === track.id && item.difficulty === difficulty)

    useEffect(() => {
        const stored = window.localStorage.getItem('preplab-results')
        if (stored) setResults(JSON.parse(stored))
    }, [])

    useEffect(() => {
        setCurrent(0)
        setRevealed(false)
    }, [selectedTrack, difficulty])

    useEffect(() => {
        if (!started || finished || questions.length === 0) return
        const timer = window.setInterval(() => {
            setSecondsLeft((value) => {
                if (value <= 1) {
                    window.clearInterval(timer)
                    finishTrack()
                    return 0
                }
                return value - 1
            })
        }, 1000)
        return () => window.clearInterval(timer)
    }, [started, finished, questions.length])

    function finishTrack(finalAnswers = answers) {
        const finalScore = finalAnswers.reduce((sum, answer, index) => sum + (answer === questions[index]?.answer ? 1 : 0), 0)
        const next = [
            ...results.filter((item) => !(item.trackId === track.id && item.difficulty === difficulty)),
            { trackId: track.id, difficulty, score: finalScore, total: questions.length, completedAt: new Date().toISOString() },
        ]
        setResults(next)
        window.localStorage.setItem('preplab-results', JSON.stringify(next))
        setFinished(true)
    }

    function beginTrack(index = selectedTrack) {
        setSelectedTrack(index)
        setStarted(true)
        setFinished(false)
        setCurrent(0)
        setAnswers([])
        setRevealed(false)
        setSecondsLeft(420)
    }

    function chooseAnswer(index: number) {
        if (!activeQuestion) return
        const next = [...answers]
        next[safeCurrent] = index
        setAnswers(next)
        setRevealed(true)
    }

    function goToQuestion(index: number) {
        const nextIndex = Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0))
        setCurrent(nextIndex)
        setRevealed(answers[nextIndex] !== undefined)
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-background pb-28 text-foreground">
            <header className="border-b border-border bg-card/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:size-10"><Zap className="size-5" /></div>
                        <div className="min-w-0"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.22em]">Assessment sprint</p><h1 className="font-serif text-lg font-bold tracking-tight sm:text-xl">PrepLab</h1></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm"><Clock3 className="size-4 shrink-0" /> 7 minutes · {questions.length}</div>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-5 sm:py-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-12">
                <aside className="flex min-w-0 flex-col gap-4 sm:gap-5">
                    <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your tracks</p><h2 className="mt-2 font-serif text-2xl font-bold">Pick a lane.</h2></div>
                    <nav className="flex w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Study tracks">
                        {tracks.map((item, index) => {
                            const trackResult = results.find((entry) => entry.trackId === item.id && entry.difficulty === difficulty)
                            return <button key={item.id} onClick={() => !started && setSelectedTrack(index)} className={`flex min-w-max items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selectedTrack === index ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:bg-muted'}`}><span className="flex items-center gap-3"><span className="font-mono text-xs opacity-60">{String(item.id).padStart(2, '0')}</span><span className="text-sm font-semibold">{item.short}</span></span>{trackResult && <span className="font-mono text-xs opacity-70">{trackResult.score}/{trackResult.total}</span>}</button>
                        })}
                    </nav>
                    <div className="hidden rounded-2xl border border-border bg-card p-4 lg:block"><p className="text-sm font-semibold">Your target</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Think in constraints, mechanisms, and trade-offs. That is where the hard points live.</p></div>
                </aside>

                <section className="min-w-0">
                    {!started ? <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7 lg:p-10"><p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Track {String(track.id).padStart(2, '0')}</p><h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold leading-tight lg:text-6xl">{track.title}</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{track.blurb} Fresh scenario questions built from the study guides.</p><div className="mt-8 flex flex-wrap gap-2">{levels.map((level) => <button key={level} onClick={() => setDifficulty(level)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${difficulty === level ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{level}</button>)}</div><button onClick={() => beginTrack()} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition hover:opacity-90">Start {difficulty} sprint <ArrowRight className="size-4" /></button>{result && <p className="mt-5 text-sm text-muted-foreground">Last run: <strong className="text-foreground">{result.score}/{result.total}</strong>. Retake it to beat your signal.</p>}</div>
                        <div className="rounded-3xl bg-[#162a23] p-6 text-[#f4f0df] shadow-sm sm:p-7 lg:p-9"><Trophy className="size-7 text-[#d8b85a]" /><p className="mt-12 font-mono text-xs uppercase tracking-[0.2em] text-[#d8b85a]">The scoring edge</p><h3 className="mt-3 font-serif text-3xl font-bold">Trace the consequence.</h3><p className="mt-5 leading-7 text-[#cbd8cf]">Read the constraint twice, eliminate the attractive wrong answer, then commit.</p></div>
                    </div> : finished ? <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7 lg:p-10"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sprint complete</p><h2 className="mt-3 font-serif text-4xl font-bold">{score}/{questions.length}</h2><p className="mt-2 text-muted-foreground">{Math.round((score / Math.max(questions.length, 1)) * 100)}% signal on {track.title}.</p></div><button onClick={() => beginTrack()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RotateCcw className="size-4" /> Retake</button></div><div className="mt-8 space-y-3">{questions.map((question, index) => { const correct = answers[index] === question.answer; return <div key={`${question.prompt}-${index}`} className={`rounded-2xl border p-4 ${correct ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}><div className="flex gap-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{correct ? <Check className="size-3.5" /> : index + 1}</span><div><p className="font-semibold leading-6">{question.prompt}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{question.explanation}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Your answer: <span className="font-normal text-foreground">{answers[index] === undefined ? 'No answer' : question.options[answers[index]]}</span></p>{!correct && <p className="mt-1 text-xs font-semibold text-muted-foreground">Correct answer: <span className="font-normal text-emerald-700">{question.options[question.answer]}</span></p>}</div></div></div> })}</div></div> : <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-10"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{track.short} · {difficulty}</p><p className="mt-2 text-sm text-muted-foreground">Question {safeCurrent + 1} of {questions.length}</p></div><div className={`font-mono text-lg font-bold ${secondsLeft < 60 ? 'text-red-600' : 'text-primary'}`}>{formatTime(secondsLeft)}</div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((safeCurrent + 1) / Math.max(questions.length, 1)) * 100}%` }} /></div><h2 className="mt-10 max-w-3xl font-serif text-3xl font-bold leading-tight sm:mt-12 lg:text-5xl">{activeQuestion?.prompt}</h2><div className="mt-8 grid gap-3">{activeQuestion?.options.map((option, index) => <button key={option} onClick={() => chooseAnswer(index)} className={`flex min-w-0 items-start gap-4 rounded-2xl border p-4 text-left transition ${revealed && index === activeQuestion.answer ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : revealed && answers[safeCurrent] === index ? 'border-rose-500 bg-rose-50 text-rose-950' : answers[safeCurrent] === index ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted font-mono text-xs font-bold">{revealed && index === activeQuestion.answer ? <Check className="size-4" /> : String.fromCharCode(65 + index)}</span><span className="pt-0.5 text-sm font-medium leading-6">{option}</span></button>)}</div><div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><button onClick={() => goToQuestion(safeCurrent - 1)} disabled={safeCurrent === 0} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"><ArrowLeft className="size-4" /> Back</button>{safeCurrent === questions.length - 1 ? <button onClick={() => finishTrack()} disabled={answers.length < questions.length} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">Finish sprint <Check className="size-4" /></button> : <button onClick={() => goToQuestion(safeCurrent + 1)} disabled={answers[safeCurrent] === undefined} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">Next <ArrowRight className="size-4" /></button>}</div></div>}
                </section>
            </div>
            {started && !finished && revealed && activeQuestion && <div className={`fixed inset-x-3 bottom-3 z-20 mx-auto max-w-3xl rounded-2xl border p-4 shadow-xl backdrop-blur sm:inset-x-4 ${answers[safeCurrent] === activeQuestion.answer ? 'border-emerald-300 bg-emerald-50/95' : 'border-rose-300 bg-rose-50/95'}`} role="status"><p className={`font-semibold ${answers[safeCurrent] === activeQuestion.answer ? 'text-emerald-800' : 'text-rose-800'}`}>{answers[safeCurrent] === activeQuestion.answer ? 'Correct. Nice read.' : 'Not quite. Review the mechanism before moving on.'}</p><p className="mt-1 text-sm leading-6 text-foreground">{activeQuestion.explanation}</p>{answers[safeCurrent] !== activeQuestion.answer && <p className="mt-1 text-xs font-semibold text-muted-foreground">Correct answer: {activeQuestion.options[activeQuestion.answer]}</p>}</div>}
        </main>
    )
}
