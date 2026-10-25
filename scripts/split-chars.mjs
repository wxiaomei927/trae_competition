/**
 * 把 characters.json 拆成逐字的小模块，配合 Vite 的动态 import 实现按需加载。
 * 产出：src/data/chars/<hex>.json（字形帧 + 义项 + 读音）
 *      src/data/chars-index.json（字表索引，不含字形，体积小）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/characters.json'), 'utf8'))
const OUT = path.join(ROOT, 'src/data/chars')
fs.mkdirSync(OUT, { recursive: true })

const asciiId = (str) =>
  Buffer.from(str, 'utf8').toString('hex').match(/.{1,12}/g).join('-')

const index = {}
let total = 0

for (const [char, entry] of Object.entries(src)) {
  const id = asciiId(char)
  const file = id
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(entry), 'utf8')
  total += fs.statSync(path.join(OUT, `${file}.json`)).size
  // 索引里只留元信息，字形按需加载
  index[char] = {
    id,
    file,
    frames: entry.frames.length,
    meanings: entry.meanings.length,
    phonetics: entry.phonetics.length,
    gloss: entry.meanings[0]?.gloss ?? '',
    modern: entry.phonetics[0]?.modern ?? '',
  }
}

fs.writeFileSync(path.join(ROOT, 'src/data/chars-index.json'), JSON.stringify(index), 'utf8')
const idxSize = fs.statSync(path.join(ROOT, 'src/data/chars-index.json')).size
console.log(`拆分 ${Object.keys(index).length} 个字模块`)
console.log(`字形模块总体积: ${(total / 1024 / 1024).toFixed(2)} MB`)
console.log(`索引体积: ${(idxSize / 1024).toFixed(1)} KB`)
console.log(`单字平均: ${(total / Object.keys(index).length / 1024).toFixed(1)} KB`)
