// ---------------------------------------------------------------------------
// Harness Learning Lab V0.2 —— 学习首页（三屏）
// 第一屏 Hero + 进度 / 第二屏 学习路线（分组） / 第三屏 为什么用这个网站
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, GraduationCap, Search, FileCode2, GitCompare } from 'lucide-react'
import { LESSONS, LESSON_GROUPS, lessonById, TOTAL_MINUTES, nextLessonToContinue } from '../course/lessons'
import { useProgress } from '../course/useProgress'
import VersionStatusCard from '../components/VersionStatusCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { progress, completedCount, percent, isCompleted } = useProgress()

  const resume = nextLessonToContinue(progress.lastLesson, isCompleted)
  const continueRoute = resume.route
  const continueLabel = resume.shortTitle
  const isFresh = progress.completedLessons.length === 0 && !progress.lastLesson

  const remainingMin = Math.max(
    0,
    TOTAL_MINUTES -
      LESSONS.filter((l) => isCompleted(l.id)).reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0),
  )

  const go = (route: string) => navigate(route)

  return (
    <div className="home">
      {/* ---------- 第一屏：Hero ---------- */}
      <section className="home-hero">
        <h1 className="hh-title">DeepSeek Harness</h1>
        <p className="hh-sub">
          从「它为什么这么设计」开始理解，而不是背 API。
          <br />
          用动态图 + 真实源码，学会如何扩展与运行 Harness。
        </p>

        <div className="hh-actions">
          <button className="btn primary" onClick={() => go(continueRoute)}>
            {isFresh ? '开始学习' : '继续学习'} {continueLabel} <ArrowRight size={15} />
          </button>
          <button className="btn ghost" onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}>
            浏览学习路线
          </button>
        </div>

        <div className="hh-progress">
          <div className="hhp-label">你的进度</div>
          <div className="hhp-bar"><div className="hhp-fill" style={{ width: `${percent}%` }} /></div>
          <div className="hhp-meta">{completedCount} / {LESSONS.length} 已完成 · 预计剩余约 {remainingMin} 分钟</div>
        </div>

        {/* 版本信息：仅上游变化时在 Hero 底部轻量提示 */}
        <VersionStatusCard />
      </section>

      {/* ---------- 第二屏：学习路线 ---------- */}
      <section className="home-roadmap" id="roadmap">
        <h2 className="hh-section-title">学习路线</h2>
        <p className="hh-section-sub">按知识结构分组，从「是什么」一路学到「怎么写插件」。</p>
        {LESSON_GROUPS.map((g) => (
          <div className="hm-group" key={g.title}>
            <div className="hmg-title">{g.title}</div>
            <div className="hmg-items">
              {g.lessonIds.map((id) => {
                const l = lessonById(id)!
                const done = isCompleted(id)
                const isCur = progress.lastLesson === id
                return (
                  <button
                    key={id}
                    className={`hm-item ${done ? 'done' : ''} ${isCur ? 'current' : ''}`}
                    onClick={() => go(l.route)}
                  >
                    <span className="hmi-no">{String(l.order).padStart(2, '0')}</span>
                    <span className="hmi-body">
                      <span className="hmi-t">{l.shortTitle}</span>
                      <span className="hmi-d">{l.description}</span>
                    </span>
                    <span className="hmi-status">
                      {done ? '✓ 已完成' : isCur ? '● 正在学习' : `${l.estimatedMinutes ?? ''} min`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- 第三屏：为什么用这个网站 ---------- */}
      <section className="home-why">
        <h2 className="hh-section-title">为什么用这个网站？</h2>
        <div className="hw-cards">
          <div className="hw-card">
            <div className="hwc-ic" style={{ color: 'var(--primary)' }}><GraduationCap size={20} /></div>
            <div className="hwc-t">Concept First</div>
            <div className="hwc-d">先理解，再看源码。每课一句话解释 → 动态图 → 概念卡片。</div>
          </div>
          <div className="hw-card">
            <div className="hwc-ic" style={{ color: 'var(--accent)' }}><FileCode2 size={20} /></div>
            <div className="hwc-t">Source Driven</div>
            <div className="hwc-d">每个关键结论都能追溯到官方源码与具体 commit。</div>
          </div>
          <div className="hw-card">
            <div className="hwc-ic" style={{ color: 'var(--warning)' }}><GitCompare size={20} /></div>
            <div className="hwc-t">Version Aware</div>
            <div className="hwc-d">课程绑定 Harness 快照，上游更新时告诉你哪些内容可能变化。</div>
          </div>
        </div>
        <div className="hw-foot">
          <button className="btn ghost" onClick={() => go('/version')}>
            <Search size={14} /> 查看学习快照与官方版本
          </button>
          <button className="btn ghost" onClick={() => go('/plugin-generator')}>
            <Compass size={14} /> 前往 Plugin Generator
          </button>
        </div>
      </section>
    </div>
  )
}
