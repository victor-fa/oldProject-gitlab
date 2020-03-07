<template>
  <resource-list
    :dataSource="dataArray"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ResourceList from '../../components/ResourceList/index.vue'
import { realResourceList } from '../MockData/index'
import NasFileAPI from '../../api/NasFileAPI'
import { message } from 'ant-design-vue'

export default {
  name: 'recent',
  components: {
    ResourceList
  },
  data () {
    return {
      // 0: apk 1: mp4, 2: mp3, 3:jpg, 4:txt, 5:pdf, 6:file
      dataArray: realResourceList
    }
  },
  computed: {

  },
  mounted () {
    this.getStoragesInfo()
  },
  methods: {
    getStoragesInfo () {  // 获取磁盘信息
      const myThis: any = this
      NasFileAPI.storages().then((response): void => {
        if (response.data.code !== 200) {
          myThis.$message.warning(response.data.msg)
          return
        }
        const res = response.data.data
        myThis.getFileList(res.storages[0].partitions[0].uuid);
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getFileList(params) { // 获取文件列表
      const myThis: any = this
      NasFileAPI.list('', params).then((response): void => {
        if (response.data.code !== 200) {
          myThis.$message.warning(response.data.msg)
          return
        }
        const res = response.data.data
        myThis.dataArray = res.list;
        console.log(JSON.parse(JSON.stringify(myThis.dataArray)));
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    }
  }
}
</script>

<style lang="less" scoped>

</style>
