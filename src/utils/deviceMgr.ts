export default {
  getPlatform (): number {
    const platform = process.platform
    if (platform === 'win32') {
      return 0
    } else if (platform === 'darwin') {
      return 1
    }
    return -1
  }
}
