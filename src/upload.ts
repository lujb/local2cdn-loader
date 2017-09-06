import { createReadStream, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import * as rmdir from 'rmdir'
import * as FormData from 'form-data'

const _rootdir = join(__dirname, '..')
const _uploaddir = join(_rootdir, 'upload-files')

if (existsSync(_uploaddir)) {
  rmdir(_rootdir, 'upload-files')
} else {
  mkdirSync(_uploaddir)
}

const upload = (url:string, filepath:string, content?:string):Promise<[string, string]> => {
  if (!url) {
    return Promise.reject('upload url is required')
  }

  return new Promise((resolve, reject) => {
    let form = new FormData()
    let _f = filepath

    if (content) {
      _f = join(_uploaddir, basename(filepath))
      writeFileSync(_f, content, 'utf8')
    }

    form.append('https', '1')
    form.append('keepName', '1')
    form.append('file', createReadStream(_f))

    form.submit(url, function(err, res) {
      if (err) {
        reject(err)
      } else {
        let rawData = ''

        res.setEncoding('utf8')
        res.on('data', chunk => rawData += chunk)
        res.on('end', () => {
          let out = JSON.parse(rawData)

          if (out.error === 0) {
            resolve([filepath, out.url])
          } else {
            reject(out)
          }
        })
      }
    })
  })
}

export default upload