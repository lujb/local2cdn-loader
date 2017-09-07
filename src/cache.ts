import { join } from 'path'
import { readFile, writeFile } from 'fs'

import log from './log'

let _dbpath = join(process.env.HOME || process.cwd(), '.local2cdn.cache')
let _cache = {}

const KEEP = 28
const THRESHOLD = 1000
const TODAY = Math.floor(Date.now() / (1000 * 24 * 3600))
const NEWEXPIREDDAY = TODAY + KEEP

// init
readFile(_dbpath, 'utf8', (err, content) => {
    if (!err) {
        try {
            let oldCache = JSON.parse(content)
            let cache = oldCache

            if (Object.keys(oldCache).length > THRESHOLD) {
                // clean old cache
                cache = {}
                for (let key in oldCache) {
                    let data = oldCache[key]
                    let { expiredDay = 0 } = data

                    if (expiredDay > TODAY) {
                        cache[key] = data
                    }
                }
            }

            for (let key in cache) {
                _cache[key] = cache[key]
            }

            flush()
        } catch (err) {
            log.warn(`failed to read cache file: ${_dbpath}, for:`, err.message)
        }
    } else {
        log.warn(`failed to read cache file: ${_dbpath}, for:`, err.message)
    }
})

// async flush
const flush = () => {
    let content = JSON.stringify(_cache, null, 2)

    writeFile(_dbpath, content, (err) => {
        if (err) {
            log.error(`failed to write cache file: ${_dbpath}, for:`, err.message)
        }
    })
}

const get = (key:string, path?:string) => {
    if (key) {
        let data = _cache[key]

        if (data) {
            data.expiredDay = NEWEXPIREDDAY

            if (path && !data.paths.includes(path)) {
                data.paths.push(path)
                flush()
            }

            return data.value
        }
    }

    return null
}

const set = (key:string, value:string, path?:string) => {
    if (key) {
        _cache[key] = { value, expiredDay: NEWEXPIREDDAY }
        
        if (path) {
            _cache[key].paths = [path]
            flush()

            return true
        }
    }

    return false
}

export default { get, set }