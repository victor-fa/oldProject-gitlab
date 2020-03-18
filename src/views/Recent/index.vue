<template>
  <a-spin :spinning="loading">
    <resource-list
      :dataSource="dataArray"
      :busy="busy"
      v-on:callbackAction="handleListInnerAction"
    />
  </a-spin>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { ResourceItem, StorageInfo } from '../../api/NasFileModel'
import ResourceList, { CallbackAction } from '../../components/ResourceList/index.vue'
import NasFileAPI from '../../api/NasFileAPI'
import { User } from '../../api/UserModel'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'recent',
  components: {
    ResourceList
  },
  data () {
    let items: Array<ResourceItem> = []
    let config: PageConfig = { path: '', uuid: '' }
    let stacks: Array<PageConfig> = []
    return {
      loading: false,
      dataArray: items,
      pageConfig: config,
      pageConfigStacks: stacks,
      page: 1,
      busy: false
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['storages'])
  },
  created () {
    this.fetchStorage()
  },
  mounted () {
    EventBus.$on(EventType.refreshAction, () => {
      this.page = 1
      this.busy = false
      this.fetchRecentList()
    })
  },
  destroyed () {
    EventBus.$off(EventType.refreshAction)
  },
  methods: {
    fetchStorage () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        if (response.data.code !== 200) return
        const storages = response.data.data.storages as Array<StorageInfo>
        this.$store.dispatch('Resource/updateStorages', storages)
        this.pageConfig.path = `/.ugreen_nas/${(this.user as User).ugreenNo}`
        this.pageConfig.uuid = storages[0].partitions[0].uuid
        this.fetchRecentList()
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    fetchRecentList () {
      this.loading = true
      NasFileAPI.fetchRecentResourceList(this.pageConfig.path, this.pageConfig.uuid, this.page).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const resources = response.data.data.list as Array<ResourceItem>
        if (_.isEmpty(resources)) this.busy = true
        this.dataArray = this.page === 1 ? resources : this.dataArray.concat(resources)
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    handleListInnerAction (actionType: CallbackAction, ...args: any[]) {
      switch (actionType) {
        case CallbackAction.loadMoreData:
          this.loadMoreData()
          break;
        case CallbackAction.back:
          this.handleBackAction()
          break;
        case CallbackAction.openFolder:
          const item = args[0]
          this.handleOpenAction(item)
          break;
      }
    },
    loadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchRecentList()
    },
    handleBackAction () {
      this.pageConfig = this.pageConfigStacks.pop()!
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchRecentList()
    },
    handleOpenAction (item: ResourceItem) {
      this.pageConfigStacks.push(this.pageConfig)
      this.pageConfig = { path: item.path, uuid: item.uuid }
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchRecentList()
    }
  }
})
interface PageConfig {
  path: string, 
  uuid: string
}
</script>

<style lang="less" scoped>

</style>
