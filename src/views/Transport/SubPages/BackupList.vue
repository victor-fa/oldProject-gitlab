<template>
  <main-page
    :category="category"
    :dataSource="dataArray"
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
  >
    <template v-slot:renderItem="{ item, index}">
      <transport-item :model="item" :index="index"/>
    </template>
  </main-page>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainPage from '../MainPage/index.vue'
import { TRANSFORM_INFO } from '../../../common/constants'
import { backupCategorys } from '../../../model/categoryList'
import TransportItem from '../MainPage/TransportItem.vue'
import ClientAPI from '../../../api/ClientAPI'
import uploadBackup from '../../../utils/file/uploadBackup'

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
      state: 'interrupted'
    }
  },
  computed: {
    ...mapGetters('Transform', ['backupInfo'])
  },
  created () {
    this.resetSelected()
    this.getListData()
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在备份"、"备份完成"
      if (index === 0) {
        this.state = 'progressing'
      } else if (index === 1) {
        this.state = 'completed'
      }
      this.getListData()
    },
    handleOperateAction (command: string) {
      const _this = this as any
      // console.log(command);
      switch (command) {
        case 'pauseAll':  // 全部暂停
          
          break;
        case 'cancelAll': // 全部取消
          
          break;
        case 'clearAll': // 清除所有记录
          this.clearAllTrans()
          break;
        case 'backupFile': // 上传文件
          _this.$refs.FileArea.value = '';
          _this.$refs.FileArea.click();
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
    getListData () {
      const list = this.backupInfo
      backupCategorys[0].count = list.filter(item => item.trans_type === 'backup' && item.state === 'interrupted').length  // 正在上传
      backupCategorys[1].count = list.filter(item => item.trans_type === 'backup' && item.state === 'completed').length  // 上传完成
      this.dataArray = list.filter(item => {
        return item.trans_type === 'backup' && item.state === this.state
      })
      console.log(JSON.parse(JSON.stringify(this.dataArray)));
    },
		PrepareUploadFile(data: any) {
      const _this = this as any
      var hostname = require("os").hostname();  // 获取主机名
			uploadBackup.prepareFile(data, { // 备份上传
        data: hostname + ClientAPI.getMac(),
				add: file => {
					_this.transBackupData.push(file);
					_this.$message.info((data.target ? data.target : data).files.length + '个文件已加入上传列队');
				},
				success: (file, response) => {
					const rs = response.data;
					if (rs.code !== 200) {
						if (rs.code === '4050') {
							_this.$message.warning('文件已存在')
						} else {
							_this.$message.warning(rs.msg)
						}
						return
					}
          this.$store.dispatch('Transform/updateTransBackupInfo', _this.transBackupData)
          this.getListData()
					_this.$message.success('文件上传成功！')
          _this.$ipc.send('system', 'popup', file.name + '上传完成');
				}
			});
		},
    clearAllTrans() { // 清空所有记录
      const _this = this as any
      if (_this.transBackupData.length === 0) {
        _this.$message.warning('当前无记录')
        return
      }
      _this.$electron.shell.beep()
      _this.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          _this.$store.dispatch('Transform/updateTransBackupInfo', [])
          _this.$store.dispatch('Transform/saveTransBackupInfo') // 清空后要更新缓存，不然下次进来可能有问题
          _this.getListData()
        }
      });
    },
    resetSelected() { // 重置默认选项
      backupCategorys[0].isSelected = true
      backupCategorys[1].isSelected = false
    },
    handleControl(model, ...args: any[]) {
      const _this = this as any
      switch (args[0]) {
        case 'deleteFile':
          _this.$electron.shell.beep()
          _this.$confirm({
            title: '删除',
            content: '是否将所选文件彻底删除',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
              // _this.$electron.shell.moveItemToTrash(item.path)  // 暂时不把本地文件删除了
              const index = _this.uploadInfo.map(o => o.name).indexOf(model.name)
              _this.uploadInfo.splice(index, 1)
              _this.getListData()
            }
          });
          break;
        case 'refresh':
          break;
        default:
          break;
      }
    }
  }
})
</script>

<style lang="less" scoped>

</style>
