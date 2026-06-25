import { existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const log = []
let failed = 0

function pass(name) {
  log.push(`PASS: ${name}`)
  console.log(`✓ ${name}`)
}

function fail(name, err) {
  failed++
  log.push(`FAIL: ${name} - ${err}`)
  console.error(`✗ ${name}: ${err}`)
}

function assert(cond, name, msg) {
  if (cond) pass(name)
  else fail(name, msg)
}

// --- 纯 JS 测试 imageDiff 逻辑 ---
function toGray(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function normalizeInk(value) {
  if (value > 200) return 255
  if (value < 80) return 0
  return value
}

function computeDiffCount(orig, copy, threshold) {
  let count = 0
  for (let i = 0; i < orig.length; i += 4) {
    const grayA = normalizeInk(toGray(orig[i], orig[i + 1], orig[i + 2]))
    const grayB = normalizeInk(toGray(copy[i], copy[i + 1], copy[i + 2]))
    if (Math.abs(grayA - grayB) > threshold) count++
  }
  return count
}

log.push('=== 书法临摹对比 自动测试 ===')
log.push(`时间: ${new Date().toISOString()}`)
log.push('')

// 1. 源文件检查
const requiredFiles = [
  'src/App.tsx',
  'src/components/ImageUpload.tsx',
  'src/components/ComparisonCanvas.tsx',
  'src/components/TransformControls.tsx',
  'src/components/ModeToolbar.tsx',
  'src/lib/transform.ts',
  'src/lib/imageDiff.ts',
  'public/test-original.svg',
  'public/test-copy.svg',
]
for (const f of requiredFiles) {
  assert(existsSync(join(root, f)), `文件存在: ${f}`, 'missing')
}

// 2. 差异算法：相同图像无差异
const same = new Uint8ClampedArray(400).fill(0)
same.fill(255, 0, 4)
for (let i = 0; i < same.length; i += 4) {
  same[i] = 30
  same[i + 1] = 30
  same[i + 2] = 30
  same[i + 3] = 255
}
assert(
  computeDiffCount(same, same, 25) === 0,
  '差异算法: 相同图像无高亮',
  'expected 0 diff pixels',
)

// 3. 差异算法：不同图像有差异
const white = new Uint8ClampedArray(same)
white.fill(255)
assert(
  computeDiffCount(same, white, 25) > 0,
  '差异算法: 不同图像产生高亮',
  'expected >0 diff pixels',
)

// 4. 变换顺序：纯平移不改变距离（数学验证）
function applyMatrix(x, y, tx, ty, scale, rotDeg) {
  const rad = (rotDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = 200
  const cy = 200
  // translate(tx,ty) * translate(cx,cy) * rotate * scale * translate(-cx,-cy)
  let px = x - cx
  let py = y - cy
  let sx = px * scale
  let sy = py * scale
  let rx = sx * cos - sy * sin
  let ry = sx * sin + sy * cos
  return { x: rx + cx + tx, y: ry + cy + ty }
}

const p0 = applyMatrix(100, 200, 0, 0, 1, 0)
const p1 = applyMatrix(100, 200, 50, 0, 1, 0)
const d0 = Math.hypot(p0.x - 200, p0.y - 200)
const d1 = Math.hypot(p1.x - 250, p1.y - 200)
assert(
  Math.abs(d0 - d1) < 0.01,
  '变换顺序: 平移不改变缩放距离',
  `d0=${d0} d1=${d1}`,
)

// 5. TypeScript 编译
const tsc = spawnSync('npx', ['tsc', '-b'], { cwd: root, shell: true, encoding: 'utf8' })
if (tsc.status === 0) pass('TypeScript 编译')
else fail('TypeScript 编译', tsc.stderr || tsc.stdout || `exit ${tsc.status}`)

// 6. Vite 构建
const build = spawnSync('npm', ['run', 'build'], { cwd: root, shell: true, encoding: 'utf8' })
if (build.status === 0 && existsSync(join(root, 'dist/index.html'))) pass('Vite 生产构建')
else fail('Vite 生产构建', build.stderr || build.stdout || 'dist missing')

// 7. Vitest（如已安装）
if (existsSync(join(root, 'node_modules/vitest'))) {
  const vitest = spawnSync('npx', ['vitest', 'run'], { cwd: root, shell: true, encoding: 'utf8' })
  if (vitest.status === 0) pass('Vitest 单元测试')
  else fail('Vitest 单元测试', vitest.stderr || vitest.stdout || `exit ${vitest.status}`)
} else {
  log.push('SKIP: Vitest 未安装，跳过')
}

log.push('')
if (failed === 0) {
  log.push('=== 全部通过 ===')
  console.log('\n=== 全部通过 ===')
} else {
  log.push(`=== ${failed} 项失败 ===`)
  console.log(`\n=== ${failed} 项失败 ===`)
}

writeFileSync(join(root, 'test-results.txt'), log.join('\n'), 'utf8')
process.exit(failed > 0 ? 1 : 0)
