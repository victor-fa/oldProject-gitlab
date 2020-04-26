<template>
  <div>
    <main-page
      :category="category"
      :dataSource="dataArray"
      :currentTab="'backup'"
      v-on:transportOperateAction="handleOperateAction"
    >
      <template v-slot:renderItem="{ item, index}">
        <transport-item
          :ref="'renderItem' + item.id"
          :key="item.id"
          :model="item"
          :index="index"
          v-on:operationAction="handleItemAction"
        />
      </template>
    </main-page>
    <!-- 上传所选文件夹 -->
    <input ref="FolderArea" type="file" multiple @change="PrepareUploadFile" webkitdirectory hidden>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import TransportItem from '../MainPage/TransportItem.vue'
import { backupCategorys, TransportStatus } from '../../../model/categoryList'
import uploadBackup from '../../../utils/file/uploadBackup';
import StringUtility from '../../../utils/StringUtility'
import ClientAPI from '../../../api/ClientAPI'
import TransportHandler from '../TransportHandler'
import { mapGetters } from 'vuex'
import _ from 'lodash'

export default Vue.extend({
  name: 'backup-list',
  components: {
    MainPage,
    TransportItem
  },
  data () {
    return {
      dataArray: [],
      transBackupData: [],
      category: backupCategorys,
      state: 'interrupted',
      hostname: '',
      timer: null
    }
  },
  computed: {
    ...mapGetters('Transform', ['backupInfo'])
  },
  created () {
    // this.getListData()
    this.hostname = require("os").hostname();  // 获取主机名
  },
  mounted () {
    this.transBackupData = this.backupInfo
  },
  watch: {
		transBackupData: {
			handler() {
        const _this = this as any
        this.getListData()
				// _this.$nextTick(() => {
        //   _this.fnThrottle(this.getListData, 300, 600)() // 节流
        // });
			},
			deep: true
		}
  },
  methods: {
    // handle views action
    handleOperateAction (command: string) {
      const _this = this as any
      switch (command) {
        case 'pauseAll':  // 全部暂停
          let pauseCount = 0
          this.backupInfo.forEach(item => {
            if (item.files[0].state === 'progressing') {
              pauseCount++
              item.files[0].state = 'interrupted'
              uploadBackup.prepareFile(item, { data: this.hostname + ClientAPI.getMac(), add: file => {}, success: (file, rs) => { _this.getListData() } });
            }
          })
          if (pauseCount === 0)  _this.$message.warning('无可暂停任务')
          break;
        case 'resumeAll':  // 全部开始
          let resumeCount = 0
          this.backupInfo.forEach(item => {
            if (item.files[0].state === 'interrupted') {
              resumeCount++
              item.files[0].state = 'progressing'
              uploadBackup.prepareFile(item, { data: this.hostname + ClientAPI.getMac(), add: file => {}, success: (file, rs) => { _this.getListData() } });
            }
          })
          if (resumeCount === 0) _this.$message.warning('无可开始任务')
          break;
        case 'cancelAll': // 全部取消
          let cancelCount = 0
          _this.backupInfo.forEach((item, index, self) => {
            if (item.files[0].state === 'progressing' || item.files[0].state === 'interrupted') {
              cancelCount++
              self.splice(index, 1)
            }
          })
          if (cancelCount === 0) {
            _this.$message.warning('无可取消任务')
          } else {
            setTimeout(() => { _this.getListData() }, 1000);
          }
          break;
        case 'backupFolder': // 上传文件夹
          _this.$refs.FolderArea.value = '';
          _this.$refs.FolderArea.click();
          break;
        default:
          break;
      }
    },
    // inner private methods
    handleItemAction(command: string, ...args: any[]) {
      console.log(command);
      const item:any = this.dataArray[args[0]]
      console.log(item);
      const _this = this as any
      switch (command) {
        case 'cancel':  // 取消
          console.log(_this.backupInfo);
          let deleteList = _this.backupInfo
          const index = deleteList.map(o => o.foldName).indexOf(item.sourcePath)
          deleteList.splice(index, 1)
          _this.$store.dispatch('Transform/updateTransBackupInfo', deleteList)
          setTimeout(() => {
            _this.getListData()
          }, 1000);
          break;
        case 'pause': // 暂停 开始
          item.state = item.state === 'interrupted' ? 'progressing' : 'interrupted';
          uploadBackup.prepareFile(item, { data: this.hostname + ClientAPI.getMac(), add: file => {}, success: (file, rs) => { _this.getListData() } });
          break;
        case 'jump': // 打开所在文件夹
          _this.$electron.shell.showItemInFolder(item.sourcePath.replace(/\//g, '\\'))
          break;
        case 'open': // 打开文件
          _this.$electron.shell.openItem(item.sourcePath.replace(/\//g, '\\'))
          break;
        case 'openInFinder': // 打开所在文件夹
          _this.$electron.shell.showItemInFolder(item.sourcePath.replace(/\//g, '\\'))
          break;
        case 'delete': // 删除
          _this.deleteFile(item)
          break;
        default:
          break;
      }
    },
    deleteFile (item) {  // 删除文件
      const _this = this as any
      _this.$electron.shell.beep()
      _this.$confirm({
        title: '删除',
        content: '是否将所选文件彻底删除',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          // _this.$electron.shell.moveItemToTrash(item.path)  // 暂时不把本地文件删除了
          let deleteList = _this.backupInfo
          const index = deleteList.map(o => o.foldName).indexOf(item.sourcePath)
          deleteList.splice(index, 1)
          _this.$store.dispatch('Transform/updateTransBackupInfo', deleteList)
          _this.$store.dispatch('Transform/saveTransBackupInfo', deleteList)
          _this.getListData()
        }
      });
    },
    getListData () {
      // console.log(JSON.parse(JSON.stringify(this.backupInfo)));
      if (this.backupInfo.length === 0) return
      this.$nextTick(() => {
        let filesArr:any = [];
        let arr = this.backupInfo
        arr.forEach(item => {
          if (filesArr.length > 0) {
            filesArr.forEach((cell, index) => {
              if (StringUtility.pathDirectory(item.path.replace(new RegExp("\\\\", "g"), '/')) === cell.path) {
                cell.files.forEach((unit, index2, self) => {
                  if (unit.path === item.path) {
                    unit = item
                  } else {
                    self.push(item)
                  }
                })
                cell.files = StringUtility.filterRepeatPath(cell.files)	// 去重
              } else {
                let temp = { files: [] as any, path: '' }
                temp.files.push(item)
                temp.path = StringUtility.pathDirectory(item.path.replace(new RegExp("\\\\", "g"), '/'))
                filesArr.push(temp)
                filesArr = StringUtility.filterRepeatPath(filesArr)	// 去重
              }
            })
          } else {
            let temp = { files: [] as any, path: '' }
            temp.files.push(item)
            temp.path = StringUtility.pathDirectory(item.path.replace(new RegExp("\\\\", "g"), '/'))
            filesArr.push(temp)
          }
        })
        // console.log(JSON.parse(JSON.stringify(filesArr)));
        this.dataArray = filesArr.map(item => {
          return TransportHandler.convertBackupTask(item)
        })
        backupCategorys[0].count = 0
        this.dataArray.forEach((item:any) => {
          if (item.status === TransportStatus.running) {
            backupCategorys[0].count += 1
          }
        })
        console.log(JSON.parse(JSON.stringify(this.dataArray)));
      })
    },
		MathSpeend(item) {  // 计算速度
      const myThis = this as any
			let NowTime = new Date().getTime() / 1000;
      const res:any = item.chunk / (NowTime - item.time)
      let speed = parseFloat(res).toFixed(0);
			return StringUtility.formatShowSize(speed) + '/s';
		},
		PrepareUploadFile(data: any) {
      // let finalPath = data.target.files[0].path.split('\\')
      // finalPath.pop()
      // console.log(finalPath.join('/'));
      // this.checkFile(finalPath.join('/'))

      const _this = this as any
			uploadBackup.prepareFile(data.target, { // 备份上传
        data: _this.hostname + ClientAPI.getMac(),
				add: file => {
          _this.transBackupData.push(file);
          console.log(JSON.parse(JSON.stringify(file)));
          console.log(_this.transBackupData);
          // // 删除重复元素
          // let repeatFlag = false
          // _this.transBackupData.forEach((item, index) => {
          //   if (item.foldName === foldName.join('\\') && index !== backupLength-1) {
          //     repeatFlag = true
          //   }
          // })
          // console.log(repeatFlag);
          // repeatFlag ? _this.transBackupData.splice(backupLength-1, 1) : null
				},
				success: (file, response) => {
          const rs = response.data;
          console.log(response);
					if (rs.code !== 200) {
						if (rs.code === '4050') {
							_this.$message.warning('文件已存在')
						} else {
							_this.$message.warning(rs.msg)
						}
						return
          }
          _this.$store.dispatch('Transform/updateTransBackupInfo', _this.transBackupData)
          _this.getListData()
					_this.$message.success('文件上传成功！')
          _this.$ipc.send('system', 'popup', file.name + '上传完成');
				}
			});
    },
    checkFile (flagPath) {
      var fs = require('fs');
      var path = require('path');
      var filePath = path.resolve(flagPath);
      const _this = this
      fs.readdir(filePath, (err, files) => {
        if (err) {
          console.warn(err)
        } else {
          files.forEach((filename) => {
            var filedir = path.join(filePath, filename);
            fs.readFile(filedir, (err, data) => {
              if (err) {
                _this.checkFile(filedir)  // 递归获取
              } else {
                fs.stat(filedir, (err, stats) => {
                  // console.log(stats);
                  let file = new File([stats], filename, {
                    lastModified: stats.mtime
                  })
                  // console.log(file);
                  // console.log(filedir.replace(new RegExp("\\\\", "g"), '/'));
                });
              }
            });
          });
        }
      })
    },
    fnThrottle (method, delay, duration) {
      const _this = this as any
      var timer = _this.timer;
      var begin = new Date().getTime();
      return function() {
        var current = new Date().getTime();
        clearTimeout(timer);
        if (current - begin >= duration) {
          method();
          begin = current;
        } else {
          _this.timer = setTimeout(function() {
            method();
          }, delay);
        }
      };
    },
  }
})
</script>

<style lang="less" scoped>
</style>
