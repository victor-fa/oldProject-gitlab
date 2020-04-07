<template>
  <div>
    <transport-header-view
      :transformList="transformData"
      v-on:CallbackAction="handleHeaderViewAction"
    />
    <TransportList
      ref="realResourceList"
      :currentTag="currentTag"
      :isDownOrFin="isDownOrFin"
      :transformList="transformData"
      v-on:CallbackItemAction="handleListViewAction"
    />
    <!-- 上传所选文件 -->
    <input ref="FileArea" type="file" multiple directory @change="PrepareUploadFile" mozdirectory hidden />
    <!-- 上传所选文件夹 -->
    <input ref="FolderArea" type="file" multiple @change="PrepareUploadFile" webkitdirectory hidden>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import TransportHeaderView from './TransportHeaderView.vue'
import MainView from '../MainView/index.vue'
import TransportList from '../../components/TransportList/index.vue'
import { TaskCategoryType } from '../../model/categoryList'
import { TRANSFORM_INFO } from '../../common/constants';
import { EventBus, EventType } from '../../utils/eventBus'
import uploadBackup from '../../utils/file/uploadBackup';
import ClientAPI from '../../api/ClientAPI'

export default {
  name: 'transport',
  extends: MainView,
  components: {
    TransportList,
    TransportHeaderView,
  },
  data () {
    return {
      transformData: [],
      currentTag: 'download',
      isDownOrFin: ''
    }
  },
  watch: {
    $route (to, from) {
      const myThis = this as any
      if (to.name === 'transport') {  // 仅任务管理下有变化
        myThis.getData()
      }
    }
  },
  computed: {
    // itemCount: function () {
    //   const myThis: any = this
    //   return myThis.transformData.length
    // }
  },
  mounted () {
    const myThis = this as any
    myThis.getData()
  },
  methods: {
    handleHeaderViewAction (actionType: any, ...args: any[]) {
      const myThis = this as any
      switch (actionType) {
        case TaskCategoryType.download:
          myThis.currentTag = TaskCategoryType.download
          // myThis.handleArrangeChange(args[0])
          break;
        case TaskCategoryType.upload:
          myThis.currentTag = TaskCategoryType.upload
          break;
        case TaskCategoryType.offline:
          myThis.currentTag = TaskCategoryType.offline
          break;
        case TaskCategoryType.backup:
          myThis.currentTag = TaskCategoryType.backup
          break;
        case TaskCategoryType.remote:
          myThis.currentTag = TaskCategoryType.remote
          break;
        case 'down':
          myThis.isDownOrFin = 'down' // 正在下载、正在上传
          break;
        case 'fin':
          myThis.isDownOrFin = 'fin' // 下载完成、上传完成
          break;
        case 'stopAll':  // 全部暂停
          break;
        case 'cancelAll':  // 全部取消
          break;
        case 'clearAll':  // 清除所有记录
          myThis.clearAllTrans()
          break;
        case 'backupFile':  // 上传备份
          myThis.backUpload('backupFile')
          break;
        case 'backupFolder':  // 上传备份文件夹
          myThis.backUpload('backupFolder')
          break;
      }
      myThis.getData()
    },
    handleListViewAction (actionType: any, ...args: any[]) {
      const myThis = this as any
      switch (actionType) {
        case 'refresh': // 刷新
          myThis.getData()
          break;
        case 'pause': // 暂停
          args[0].state = args[0].state === 'interrupted' ? 'progressing' : 'interrupted';
          myThis.PrepareUploadFile(args[0])
          break;
        case 'start': // 开始
          args[0].state = args[0].state === 'interrupted' ? 'progressing' : 'interrupted';
          myThis.PrepareUploadFile(args[0])
          break;
        case 'cancle':  // 删除
          myThis.transformData.splice(args[1], 1)
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.transformData))
          break;
      }
    },
    getData () {  // 获取最新值
      const myThis = this as any
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      let tempJson = JSON.parse(temp)
      myThis.transformData = tempJson !== null ? tempJson : []
    },
    clearAllTrans() { // 清空所有记录
      const myThis = this as any
      myThis.$electron.shell.beep()
      if (myThis.transformData === null) {
        myThis.$message.warning('当前无记录')
        return
      }
      myThis.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          // myThis.transformData.filter(item => item.trans_type === myThis.currentTag).forEach(item => {
          //   myThis.$electron.shell.moveItemToTrash(item.path)  // 暂时先不清空本地文件
          // })
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify([]))
          myThis.getData()
        }
      });
    },
    backUpload (flag) { // 上传备份文件
      const myThis = this as any
      if (flag === 'backupFile') {
        myThis.$refs.FileArea.value = '';
        myThis.$refs.FileArea.click();
      } else if (flag === 'backupFolder') {
        console.log(myThis.$refs.FolderArea);
        myThis.$refs.FolderArea.value = '';
        myThis.$refs.FolderArea.click();
      }
    },
		PrepareUploadFile(data: any) {
      const myThis = this as any
      var hostname = require("os").hostname();  // 获取主机名
			uploadBackup.prepareFile(data, { // 备份上传
        data: hostname + ClientAPI.getMac(),
				add: file => {
					myThis.transformData.push(file);
					myThis.$message.info((data.target ? data.target : data).files.length + '个文件已加入上传列队');
				},
				success: (file, response) => {
					const rs = response.data;
					if (rs.code !== 200) {
						if (rs.code === '4050') {
							myThis.$message.warning('文件已存在')
						} else {
							myThis.$message.warning(rs.msg)
						}
						return
					}
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.transformData))
          // 刷新
          myThis.handleRefreshAction()
					myThis.$message.success('文件上传成功！')
          myThis.$ipc.send('system', 'popup', file.name + '上传完成');
				}
			});
		},
  }
}
</script>

<style lang="less" scoped>

</style>
