<template>
  <basic-list
    :busy="busy"
    :dataSource="dataSource"
    class="content-list"
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
        @dblclick.stop="doubleClick(index)"
        @contextmenu.stop.prevent="contextmenu(index)"
      >
        <img src="../../assets/resource/folder_icon.png">
        <a-input
          v-if="item.renaming === true"
          v-focus
          ref="inputName"
          v-model="newName"
          placeholder="请输入文件名"
          @focus="handleFocus($event)"
          @blur="handleBlur($event, index)"
          @keydown.enter="handlePressEnter($event)"
        />
        <span v-else>{{ item.name }}</span>
      </div>
    </template>
  </basic-list>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicList from '@/components/BasicList/index.vue'
import { ResourceItem } from '@/api/NasFileModel'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'second-directory',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  components: {
    BasicList
  },
  props: {
    dataSource: Array,
    busy: {
      default: false
    }
  },
  data () {
    return {
      newName: ''
    }
  },
  watch: {
    dataSource: function (values: ResourceItem[]) {
      for (let index = 0; index < values.length; index++) {
        const element = values[index]
        if (element.renaming === true) {
          this.newName = element.name
          break
        }
      }
    }
  },
  methods: {
    handleLoadMoreAction () {
      if (_.isEmpty(this.dataSource) || this.busy) return
      this.$emit('callbackAction', 'loadmore')
    },
    singleClick (index: number) {
      const item = this.dataSource[index] as ResourceItem
      if (item.disable === true) return
      this.$emit('callbackAction', 'singleClick', index)
    },
    doubleClick (index: number) {
      const item = this.dataSource[index] as ResourceItem
      if (item.disable === true) return
      this.$emit('callbackAction', 'doubleClick', index)
    },
    contextmenu (index: number) {
      const item = this.dataSource[index] as ResourceItem
      if (item.disable === true) return
      this.$emit('callbackAction', 'contextmenu', index)
    },
    handleFocus (event: MouseEvent) {
      const target = event.currentTarget as HTMLInputElement
      target.select()
    },
    handleBlur (event: MouseEvent, index: number) {
      if (_.isEmpty(this.newName)) {
        this.dataSource.shift()
        return
      }
      if (!ResourceHandler.checkFileName(this.newName)) {
        this.$message.error('名称包含非法字符')
        return
      }
      this.$emit('callbackAction', 'newFolderRequest', index, this.newName)
    },
    handlePressEnter (event: MouseEvent) {
      event.stopPropagation()
      event.preventDefault()
      const input = (this.$refs.inputName as Vue).$el as HTMLInputElement
      input.blur()
    }
  }
})
</script>

<style lang="less" scoped>
.content-list {
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
    input {
      height: 18px;
      width: 100px;
      color: #484848;
      font-size: 12px;
      margin-left: 9px;
      padding: 2px 4px;
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
