<template>
  <div class="main-header-view" :key="key">
    <div class="header-left-view">
      <custom-button
        v-if="false"
        :image="backIcon"
        :disableImage="disableBackIcon"
        :disable="disableBack"
        class="back-icon-style"
        iconWidth="6px"
        @click.native="backAction"
      />
      <a-breadcrumb separator=">" class="modal-breadcrumb" ref="breadcrumb">
        <a-breadcrumb-item
          v-for=" (item, index) in showPaths"
          :key="index"
          :class="{ 'modal-breadcrumb-item': showHover(index) }"
          @click.native.stop="handleBreadcrumbClick(index)"
        >
          {{ item }}
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>
    <div class="header-right-view">
      <a-input
        v-if="showSearch"
        v-focus
        ref="searchInput"
        placeholder="搜索"
        v-model="keyword"
        :allowClear="true"
        style="width: 150px"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
        @pressEnter="handleSearchAction"
      />
      <div
        v-for="(item, index) in funcList"
        :key="index"
        class="right-item"
      >
        <a-popover
          v-if="showPopover(item)"
          trigger="click"
          v-model="visible"
          placement="bottom"
        >
          <sort-popover-list
            slot="content"
            :sortList="popoverList"
            v-on:sortWayChange="sortWayChange"
          />
          <custom-button
            class="right-button"
            :image="item.icon"
            :ref="item.command"
            :title="item.title"
            :iconWidth="item.iconWidth"
            v-show="item.isHidden !== true"
            @click.native="handleItemClick(index)"
          />
        </a-popover>
        <custom-button
          v-show="showItem(item)"
          class="right-button"
          :key="item.command"
          :image="item.icon"
          :title="item.title"
          :selectedImage="item.selectedIcon"
          :isSelected="item.isSelected"
          :iconWidth="item.iconWidth"
          @click.native="handleItemClick(index)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { categorys, taskCategorys, Category } from '@/model/categoryList'
import { EventBus, EventType } from '@/utils/eventBus'
import CustomButton from '@/components/CustomButton/index.vue'
import SortPopoverList from '@/components/SortPopoverList/index.vue'
import { SortWay, SortKind, SortType, sortList, uploadSortList, SortList } from '@/model/sortList'
import { ArrangeWay, OrderType, ResourceType } from '@/api/NasFileModel'
import { commonFuncList, ResourceFuncItem, searchItem } from './ResourceFuncList'
import { CacheRoute } from '@/store/modules/Router'
import RouterUtility from '@/utils/RouterUtility'
import FileModalHandler, { CacheParams } from '../SelectFilePath/FileModalHandler'

export default Vue.extend({
  name: 'main-header-view',
  directives: {
    focus: {
      inserted: function (el) {
        const input = el.firstElementChild as HTMLElement
        input.focus()
      }
    }
  },
  model: {
    prop: 'categoryType',
    event: 'handleTabChange'
  },
  components: {
    CustomButton,
    SortPopoverList
  },
  props: {
    funcList: Array,
    popoverList: Object,
    categoryType: {
      default: ResourceType.all
    }
  },
  data () {
    return {
      categorys: _.cloneDeep(categorys),
      backIcon: require('../../assets/back_icon.png'),
      disableBackIcon: require('../../assets/dis_back_icon.png'),
      showPaths: [] as string[],
      visible: false, // 控制排序气泡弹窗是否显示 
      showSearch: false, // 控制搜索框是否显示
      keyword: '' // 搜索关键字
    }
  },
  computed: {
    ...mapGetters('Router', ['showRoutes']),
    key: function () {
      return this.$route.path
    },
    disableBack: function () {
      const disable = (this.showRoutes.length < 2) as boolean
      return disable
    }
  },
  watch: {
    showRoutes: function (newValue: CacheRoute[]) {
      this.showPaths = newValue.map(item => {
        return item.name
      })
      if (this.showPaths.length <= 1) return
      const breadcrumb = this.$refs.breadcrumb as Vue
      FileModalHandler.calculateShowPaths(breadcrumb).then(index => {
        if (index === undefined) return
        this.showPaths = FileModalHandler.replaceElement(newValue, 1, index, '...')
      })
    }
  },
  mounted () {
    this.showPaths = (this.showRoutes as CacheRoute[]).map(item => {
      return item.name
    })
  },
  methods: {
    // public methods
    // 重置header的状态，外部调用
    resetState () { 
      this.hideSearchInput()
    },
    // private methods
    // 缩率item不能点击
    showHover (index: number) {
      if (index === this.showPaths.length - 1) return false
      return this.showPaths[index] !== '...'
    },
    showPopover (item: ResourceFuncItem) {
      const list = this.popoverList as SortList
      if (_.isEmpty(list.kinds) || _.isEmpty(list.types)) {
        return false
      }
      return item.command === 'sort'
    },
    showItem (item: ResourceFuncItem) {
      if (item.command === 'sort') return false
      return item.isHidden !== true
    },
    handleTabChange (index: number) {
      this.hideSearchInput()
      const item = this.categorys[index]
      this.$emit('CallbackAction', 'tabChange', item.type)
      this.$emit('handleTabChange', item.type)
    },
    sortWayChange (sender: SortWay) {
      // hide popover
      this.visible = false
      const orderType = this.convertSortWay(sender)
      this.$emit('CallbackAction', 'sortWayChange', orderType)
    },
    convertSortWay (way: SortWay) {
      switch (way.kind) {
        case SortKind.name:
          return way.type === SortType.descending ? OrderType.byNameDesc : OrderType.byNameAsc
        case SortKind.time:
          return way.type === SortType.descending ? OrderType.ByModifyDesc : OrderType.ByModifyAsc
        case SortKind.memory:
          return way.type === SortType.descending ? OrderType.bySizeDesc : OrderType.bySizeAsc
        case SortKind.upload:
          return way.type === SortType.descending ? OrderType.ByUploadDesc : OrderType.ByUploadAsc
        case SortKind.fileType:
          // TODO: 目前还无法处理文件类型
          break;
      }
      return OrderType.byNameDesc
    },
    backAction () {
      this.hideSearchInput()
      this.$emit('CallbackAction', 'back')
    },
    handleBreadcrumbClick (index: number) {
      if (index === this.showPaths.length - 1) return
      if (this.showPaths[index] === '...') return
      RouterUtility.pop(index)
    },
    handleItemClick (index: number) {
      const item = this.funcList[index] as ResourceFuncItem
      switch (item.command) {
        case 'search':
          this.searchAction()
          break;
        case 'refresh':
          this.refreshAction()
          break;
        case 'sort':
          this.visible = !this.visible
          break;
        case 'arrange':
          this.arrangeAction(index)
          break;
        case 'newCustom':
          this.$emit('CallbackAction', 'newCustom')
          break;
        default:
          break;
      }
    },
    showSearchInput () {
      if (this.showSearch === true) return
      this.keyword = ''
      this.showSearch = true
      this.setHiddenSearch(true)
    },
    hideSearchInput () {
      if (this.showSearch === false) return
      this.showSearch = false
      this.setHiddenSearch(false)
    },
    setHiddenSearch (hide: boolean) {
      if (hide) {
        this.funcList.splice(0, 1)
      } else {
        this.funcList.splice(0, 0, _.cloneDeep(searchItem))
      }
    },
    searchAction () {
      this.showSearchInput()
    },
    handleSearchFocus (event: FocusEvent) {
      // 监听清除按钮的点击
      const searchInput = this.$refs.searchInput as Vue
      const clearButton = searchInput.$el.lastChild as ChildNode
      clearButton.addEventListener('click', event => {
        this.endSearch()
      })
    },
    handleSearchBlur (event: FocusEvent) {
      if (this.keyword.length === 0) { 
        this.endSearch()
      }
    },
    handleSearchAction () {
      if (_.isEmpty(this.keyword)) {
        this.endSearch()
      } else {
        this.$emit('CallbackAction', 'search', this.keyword)
      }
    },
    endSearch () {
      if (this.showSearch === false) return
      this.hideSearchInput()
      this.$emit('CallbackAction', 'endSearch')
    },
    refreshAction() {
      this.$emit('CallbackAction', 'refresh')
    },
    arrangeAction (index: number) {
      const item = this.funcList[index] as ResourceFuncItem
      item.isSelected = !item.isSelected
      this.funcList.splice(index, 1, item)
      const arrangeWay = item.isSelected ? ArrangeWay.vertical : ArrangeWay.horizontal
      this.$emit('CallbackAction', 'arrangeChange', arrangeWay)
    }
  }
})
</script>

<style lang="less" scoped>
.main-header-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .header-left-view {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0px 10px 0px 19px;
    .back-icon-style {
      height: 22px;
      width: 30px;
      vertical-align: middle;
      margin-right: 3px;
    }
    .modal-breadcrumb {
      width: 100%;
      text-align: left;
      font-size: 14px;
      color: black;
      line-height: 22px;
      overflow: hidden;
      white-space: nowrap;
      .modal-breadcrumb-item:hover {
        color: #06b650;
      }
    }
  }
  .header-right-view {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-right: 20px;
    .right-item {
      height: 20px;
      width: 20px;
      margin-left: 7px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .right-button {
      height: 20px;
      width: 20px;
    }
  }
}
</style>

<style>
.main-header-view .header-right-view .ant-input {
  font-size: 12px;
  color: #484848;
  height: 20px;
  margin-right: 4px;
  padding-right: 0px;
}
.main-header-view .header-right-view .ant-input-suffix {
  right: 4px;
}
.main-header-view .modal-breadcrumb .ant-breadcrumb-separator {
  margin: 0px;
  font-size: 10px;
}
.main-header-view .modal-breadcrumb .ant-breadcrumb-link {
  cursor: default;
}
</style>
