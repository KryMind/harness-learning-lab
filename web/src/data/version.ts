// ---------------------------------------------------------------------------
// 版本感知 —— 学习快照 commit vs 官方 master
// 浏览器直连 GitHub API 查询官方最新提交与差异；失败降级为 unknown，绝不影响
// 网站运行（UX#9 安静化：默认小徽标，不做大横幅）。localStorage 缓存 + TTL 1 小时
// （GitHub 匿名 API 限 60 次/小时）。
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { useData } from '../data'
import { lessonMatchesPath } from '../course/lessons'
import type { Lesson } from '../course/types'

export interface VersionInfo {
  snapshotCommit: string | null
  officialMaster: string | null
  changedFiles: string[] | null
  status: 'unknown' | 'current' | 'outdated'
  checkedAt: string | null
}

const REPO = 'deepseek-ai/deepseek-harness'
const KEY = 'hll.version.cache.v1'
const TTL_MS = 60 * 60 * 1000

interface Cached extends VersionInfo {
  at: number
}

function readCache(snapshot: string): VersionInfo | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cached
    if (!c || c.snapshotCommit !== snapshot || Date.now() - c.at > TTL_MS) return null
    return {
      snapshotCommit: c.snapshotCommit,
      officialMaster: c.officialMaster,
      changedFiles: c.changedFiles,
      status: c.status,
      checkedAt: c.checkedAt,
    }
  } catch {
    return null
  }
}

function writeCache(v: VersionInfo) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...v, at: Date.now() } as Cached))
  } catch {
    /* 隐私模式等场景静默失败 */
  }
}

/** 查询官方 master 并计算相对 snapshot 的变化（缓存 + 失败降级，绝不抛错）。 */
export async function checkOfficialMaster(snapshot: string): Promise<VersionInfo> {
  if (!snapshot) {
    return { snapshotCommit: snapshot, officialMaster: null, changedFiles: null, status: 'unknown', checkedAt: null }
  }

  const cached = readCache(snapshot)
  if (cached) return cached

  try {
    const short = snapshot.slice(0, 7)
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/master`)
    if (!res.ok) throw new Error(String(res.status))
    const j = (await res.json()) as { sha?: string }
    const official = (j.sha ?? '').slice(0, 7)

    let changed: string[] = []
    if (short !== official) {
      const cmp = await fetch(`https://api.github.com/repos/${REPO}/compare/${short}...${official}?per_page=100`)
      if (cmp.ok) {
        const cj = (await cmp.json()) as { files?: { filename?: string }[] }
        changed = (cj.files ?? []).map((f) => f.filename ?? '').filter(Boolean)
      }
    }

    const info: VersionInfo = {
      snapshotCommit: snapshot,
      officialMaster: official,
      changedFiles: changed,
      status: short === official ? 'current' : 'outdated',
      checkedAt: new Date().toISOString(),
    }
    writeCache(info)
    return info
  } catch {
    return { snapshotCommit: snapshot, officialMaster: null, changedFiles: null, status: 'unknown', checkedAt: null }
  }
}

/** 某课在本次 diff 中涉及的文件（changedFiles ∩ lesson.sourcePaths）。 */
export function changedFilesForLesson(info: VersionInfo, lesson: Lesson): string[] {
  if (!info.changedFiles) return []
  return info.changedFiles.filter((f) => lessonMatchesPath(lesson, f))
}

export function changedCountForLesson(info: VersionInfo, lesson: Lesson): number {
  return changedFilesForLesson(info, lesson).length
}

/** 在 diff 中命中任意前缀路径的文件（用于 Plugin Generator 模板等非课程来源）。 */
export function changedFilesForPaths(info: VersionInfo, paths: string[]): string[] {
  if (!info.changedFiles || !paths.length) return []
  const norm = paths.filter(Boolean)
  return info.changedFiles.filter((f) => {
    const m = f.replace(/\\/g, '/')
    return norm.some((p) => {
      const pat = p.replace(/\\/g, '/')
      return pat.endsWith('**') ? m.startsWith(pat.slice(0, -2)) : m.startsWith(pat)
    })
  })
}

/** 读取 snapshot 元数据，挂载后查询一次官方 master。 */
export function useVersionInfo(): VersionInfo {
  const { meta } = useData()
  const snapshot = meta?.repoCommit ?? null
  const [info, setInfo] = useState<VersionInfo>({
    snapshotCommit: snapshot,
    officialMaster: null,
    changedFiles: null,
    status: 'unknown',
    checkedAt: null,
  })

  useEffect(() => {
    if (!snapshot) {
      setInfo({ snapshotCommit: null, officialMaster: null, changedFiles: null, status: 'unknown', checkedAt: null })
      return
    }
    let alive = true
    checkOfficialMaster(snapshot).then((v) => {
      if (alive) setInfo(v)
    })
    return () => {
      alive = false
    }
  }, [snapshot])

  return info
}
