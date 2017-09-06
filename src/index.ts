import * as loaderUtils from 'loader-utils'
import * as mime from 'mime'

import upload from './upload'

interface Loader {
    (content: Buffer): any
    raw?: boolean
}

const loader: Loader = function(content: Buffer) {
    this.cacheable && this.cacheable()
    let options =  loaderUtils.getOptions(this) || {}
    let limit = options.limit || (this.options && this.options.url && this.options.url.dataUrlLimit)

    if(limit) {
        limit = parseInt(limit, 10)
    }

    let mimetype = options.mimetype || options.minetype || mime.lookup(this.resourcePath)

    if(!limit || content.length < limit) {
        if(typeof content === "string") {
            content = new Buffer(content)
        }
        return "module.exports = " + JSON.stringify("data:" + (mimetype ? mimetype + "" : "") + "base64," + content.toString("base64"))
    } else {
        let callback = this.async()
        let fn = options.uploadFn || upload

        fn.call(null, options.uploadUrl, this.resourcePath).then(([filepath, url]) => {
            callback(null, "module.exports = " + JSON.stringify(`${url}`))
        })
    }
}

loader.raw = true

export default loader