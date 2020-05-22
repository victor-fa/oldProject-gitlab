import { CustomModule } from '@/api/NasFileModel'
import { nasServer } from '@/api/NasServer'

export default {
  formatItem (item: CustomModule, apiToken: string) {
    item.custom = 'custom'
    item.name = item.myself_folder.name
    const path = item.myself_folder.background_path
    let image_path = nasServer.defaults.baseURL
    if (path.length === 0 || image_path === undefined) {
      item.myself_folder.image_path = require('../../assets/custom_placeholder.png')
      return item
    }
    image_path += '/v1/file/http_download?'
    image_path += `uuid=${item.uuid}&path=${item.myself_folder.background_path}&api_token=${apiToken}`
    item.myself_folder.image_path = image_path
    return item
  }
}
