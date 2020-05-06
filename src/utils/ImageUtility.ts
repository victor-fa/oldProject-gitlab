import fs from 'fs'

export default {
  /**获取图片base64编码 */
  getImageBase64 (path: string): Promise<object> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (error, buffer) => {
        if (error !== null) {
          reject(error)
        } else {
          const base64 = buffer.toString('base64')
          const index = path.lastIndexOf('.') + 1
          const fileSuffix = path.substring(index, path.length)
          const mime = 'image/' + fileSuffix
          resolve({
            imageData: `data:${mime};base64,${base64}`,
            base64
          })
        }
      })
    })
  },
  /**调整图片比例为16:9 */
  zoomImage (src: string) {
    const image = new Image()
    image.src = src
    image.onload = () => {
      const ratio = (16 / 9).toFixed(2)
      const imageRatio = (image.width / image.height).toFixed(2)
      if (ratio !== imageRatio) {
        
      }
    }
  }
}
