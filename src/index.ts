import * as loaderUtils from 'loader-utils'
import * as mime from 'mime'
import * as sha1 from 'sha1'
import { basename } from 'path'

import cache from './cache'
import upload from './upload'

interface Loader {
    (content: Buffer | string): any
}

const loader: Loader = function(content) {
    this.cacheable && this.cacheable()
    let options =  loaderUtils.getOptions(this) || {}
    let limit = options.limit || (this.options && this.options.url && this.options.url.dataUrlLimit)

    if(limit) {
        limit = parseInt(limit, 10)
    }

    let mimetype = options.mimetype || options.minetype || mime.lookup(this.resourcePath)


    if(typeof content === "string") {
        content = new Buffer(content)
    }
    
    let b64Content = content.toString("base64")

    if(!limit || b64Content.length < limit) {
        return "module.exports = " + JSON.stringify("data:" + (mimetype ? mimetype + ";" : "") + "base64," + b64Content)
    } else {
        if (options.uploadUrl) {
            let callback = this.async()
            let fn = options.uploadFn || upload

            fn.call(null, options.uploadUrl, this.resourcePath, b64Content).then(([filepath, url]) => {
                callback(null, "module.exports = " + JSON.stringify(`${url}`))
            })
        } else {
            let fileLoader = require('file-loader')

            return fileLoader.call(this, content)
        }
    }
}

export const raw = true

export default loader
