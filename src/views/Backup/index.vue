<template>
  <resource-list
    :dataSource="dataArray"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ResourceList, { ResourceType } from '../../components/ResourceList/index.vue'

export default Vue.extend({
  name: 'backup',
  components: {
    ResourceList
  },
  data () {
    return {
      dataArray: [
        { name: '文件夹1', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹2', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹3', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹4', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹5', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹6', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹7', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹8', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹9', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹10', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹11', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹12', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹13', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹14', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹15', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹16', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹17', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹18', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹19', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' },
        { name: '文件夹20', type: ResourceType.folder, modifyTime: '2020年2月13日', memeoy: '10M' }
      ]
    }
  }
})
</script>

<style lang="less" scoped>

</style>
