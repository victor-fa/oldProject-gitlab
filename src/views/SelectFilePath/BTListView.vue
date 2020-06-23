<template>
  <a-spin :spinning="loading">
    <basic-list
      :busy="busy"
      :dataSource="dataArray"
      class="bt-list"
      v-on:loadMoreData="handleLoadMoreAction"
    >
      <template v-slot:renderItem="{ item, index }">
        <div
          class="content-list-item"
          v-bind:class="{
            'content-list-item-odd': index % 2,
            'content-list-item-selected': item.isSelected
          }"
          @click.stop="singleClick(index)"
        >
          <img src="../../assets/resource/txt_icon.png">
          <span>{{ item.name }}</span>
        </div>
      </template>
    </basic-list>
  </a-spin>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicList from '@/components/BasicList/index.vue'
import { ResourceItem, ResourceType } from '@/api/NasFileModel'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'

export default Vue.extend({
  name: 'bt-list-view',
  components: {
    BasicList
  },
  data () {
    return {
      page: 1,
      busy: false,
      loading: false,
      dataArray: [] as ResourceItem[]
    }
  },
  mounted () {
    this.fetchBtList()
  },
  methods: {
    handleLoadMoreAction () {
      this.page++
      this.fetchBtList()
    },
    singleClick (index: number) {
      this.dataArray = this.dataArray.map((item, aIndex) => {
        item.isSelected = index === aIndex
        return item
      })
      const item = this.dataArray[index]
      this.$emit('didSelectItem', item)
    },
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 20) this.busy = true
      list = ResourceHandler.formatResourceList(list).map(item => {
        item.name = item.alias
        return item
      })
      list = this.page === 1 ? list : this.dataArray.concat(list)
      this.dataArray = list.map((item, index) => {
        item.index = index
        return item
      })
    },
    fetchBtList () {
      this.loading = true
      let utime = 0
      const lastItem = _.last(this.dataArray)
      if (this.page > 1 && lastItem !== undefined) {
        utime = lastItem.utime
      }
      NasFileAPI.fetchTlist(this.page, utime, ResourceType.bt).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.bt-list {
  height: 259px !important;
  .content-list-item {
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: white;
    img {
      width: 20px;
      height: 17px;
      margin-left: 14px;
    }
    span {
      color: #484848;
      font-size: 12px;
      margin-left: 9px;
    }
  }
  .content-list-item-odd {
    background-color: #f6f8fb;
  }
  .content-list-item-selected {
    background-color: #def1ea;
  }
}
</style>
