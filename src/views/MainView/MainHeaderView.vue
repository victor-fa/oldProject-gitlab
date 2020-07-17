<template>
  <div class="main-header-view" :key="key">
    <div v-if="showHeaderView" class="header-top-view">
      <div class="top-left-view">
        <div v-for="(item, index) in toolbars" :key="index">
          <a-dropdown v-if="showUploadPopover(item)" overlayClassName="upload-dropdown-list">
            <div>
              <custom-button
                class="toolbar-btn"
                :image="item.icon"
                :text="item.title"
                :disableImage="item.disableIcon"
                :disable="item.disable"
                :iconWidth="item.iconWidth"
                @click.native="handleToolbarClick(index)"
              />
            </div>
            <a-menu slot="overlay" @click="handleMenuClick">
              <a-menu-item key="uploadFile">上传文件</a-menu-item>
              <a-menu-item key="uploadFolder">上传文件夹</a-menu-item>
            </a-menu>
          </a-dropdown>
          <custom-button
            v-else
            class="toolbar-btn"
            :image="item.icon"
            :text="item.title"
            :disableImage="item.disableIcon"
            :disable="item.disable"
            :iconWidth="item.iconWidth"
            @click.native="handleToolbarClick(index)"
          />
        </div>
      </div>
      <div class="top-right-view">
        <a-input
          ref="searchInput"
          placeholder="搜索"
          v-model="keyword"
          :allowClear="true"
          @pressEnter="handleSearchAction"
          @change="handleChangeAction"
        >
          <template slot="prefix">
            <img src="../../assets/search_disable.png" class="search-indicator"/>
          </template>
        </a-input>
      </div>
    </div>
    <div class="header-bottom-view">
      <div class="bottom-left-view">
        <custom-button
          :image="backIcon"
          :disableImage="disableBackIcon"
          :disable="disableBack"
          class="back-icon-style"
          iconWidth="6px"
          @click.native="backAction"
        />
        <a-breadcrumb class="modal-breadcrumb" ref="breadcrumb">
          <img slot="separator" class="separator-icon" src="../../assets/accessory_icon.png">
          <a-breadcrumb-item
            v-for=" (item, index) in showPaths"
            :key="index"
            :class="{ 'modal-breadcrumb-item': showHover(index) }"
            @click.native.stop="handleBreadcrumbClick(index)"
          >
            {{ item.path }}
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>
      <div class="bottom-right-view">
        <a-input
          v-focus
          v-if="showSearch"
          placeholder="搜索"
          v-model="keyword"
          :allowClear="true"
          @blur="handleSearchBlur"
          @pressEnter="handleSearchAction"
          @change="handleChangeAction"
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
              :disable="item.disable"
              :disableImage="item.disableIcon"
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
            :disable="item.disable"
            :disableImage="item.disableIcon"
            :iconWidth="item.iconWidth"
            @click.native="handleItemClick(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { categorys, Category } from '@/model/categoryList'
import CustomButton from '@/components/CustomButton/index.vue'
import SortPopoverList from '@/components/SortPopoverList/index.vue'
import { SortWay, SortKind, SortType, sortList, SortList } from '@/model/sortList'
import { ArrangeWay, OrderType, ResourceType } from '@/api/NasFileModel'
import { ResourceFuncItem, searchItem } from './ResourceFuncList'
import { CacheRoute } from '@/store/modules/Router'
import RouterUtility from '@/utils/RouterUtility'
import FileModalHandler, { ShowPath } from '../SelectFilePath/FileModalHandler'

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
    toolbars: Array,
    popoverList: Object,
    categoryType: {
      default: ResourceType.all
    }
  },
  data () {
    return {
      categorys: _.cloneDeep(categorys),
      visible: false, // 控制排序气泡弹窗是否显示 
      showSearch: false, // 控制搜索框是否显示
      keyword: '', // 搜索关键字
      backIcon: require('../../assets/back_icon.png'),
      disableBackIcon: require('../../assets/dis_back_icon.png'),
      showPaths: [] as ShowPath[]
    }
  },
  computed: {
    ...mapGetters('Router', ['showRoutes']),
    key: function () {
      const path: string = this.$route.path
      return path
    },
    showHeaderView: function () {
      const result = !_.isEmpty(this.toolbars) as boolean
      return result
    },
    disableBack: function () {
      const paths = this.showPaths as ShowPath[]
      const disable = (paths.length <= 1) as boolean
      return disable
    }
  },
  watch: {
    showRoutes: function (newValue: CacheRoute[]) {
      this.showPaths = this.fetchShowPaths(newValue)
      if (newValue.length <= 1) return
      const breadcrumb = this.$refs.breadcrumb as Vue
      FileModalHandler.calculateShowPaths(breadcrumb).then(index => {
        if (index === undefined) return
        this.showPaths = FileModalHandler.replaceElement(newValue, 1, index, '...')
      })
    }
  },
  mounted () {
    this.showPaths = this.fetchShowPaths(this.showRoutes)
  },
  methods: {
    // public methods
    // 重置header的状态，外部调用
    resetState () { 
      this.hideSearchInput()
    },
    // private methods
    fetchShowPaths (routers: CacheRoute[]): ShowPath[] {
      return routers.filter(item => {
        return item.hide !== true
      }).map((item, index) => {
        return { path: item.name, index }
      })
    },
    showUploadPopover (item: ResourceFuncItem) {
      if (item.command !== 'upload' || item.disable === true) return false
      if (process.platform !== 'win32') return false
      return true
    },
    // 缩率item不能点击
    showHover (index: number) {
      if (index === this.showPaths.length - 1) return false
      return this.showPaths[index].path !== '...'
    },
    showPopover (item: ResourceFuncItem) {
      const list = this.popoverList as SortList
      if (_.isEmpty(list) || _.isEmpty(list.kinds) || _.isEmpty(list.types)) {
        return false
      }
      return item.command === 'sort'
    },
    showItem (item: ResourceFuncItem) {
      if (item.command === 'sort') return false
      return item.isHidden !== true
    },
    handleToolbarClick (index: number) {
      const item = this.toolbars[index] as ResourceFuncItem
      if (item.command === 'upload' && process.platform === 'win32') return
      this.$emit('callbackAction', item.command)
    },
    handleMenuClick (sender: any) {
      const command = sender.key as string
      this.$emit('callbackAction', command)
    },
    backAction () {
      this.hideSearchInput()
      this.$emit('callbackAction', 'back')
    },
    handleBreadcrumbClick (index: number) {
      this.hideSearchInput()
      if (index === this.showPaths.length - 1) return
      const item = this.showPaths[index]
      if (item.path === '...') return
      this.$emit('callbackAction', 'pop', item.index)
    },
    handleTabChange (index: number) {
      this.hideSearchInput()
      const item = this.categorys[index]
      this.$emit('callbackAction', 'tabChange', item.type)
      this.$emit('handleTabChange', item.type)
    },
    sortWayChange (sender: SortWay) {
      // hide popover
      this.visible = false
      const orderType = this.convertSortWay(sender)
      this.$emit('callbackAction', 'sortWayChange', orderType)
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
          this.$emit('callbackAction', 'newCustom')
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
    handleSearchBlur (event: FocusEvent) {
      if (this.keyword.length === 0) { 
        this.endSearch()
      }
    },
    handleSearchAction () {
      if (_.isEmpty(this.keyword)) {
        this.endSearch()
      } else {
        this.$emit('callbackAction', 'search', this.keyword)
      }
    },
    handleChangeAction (event: any) {
      if (!_.isEmpty(event.inputType)) return
      if (this.showHeaderView) {
        this.$emit('callbackAction', 'endSearch')
      } else {
        this.$nextTick(() => {
          (event.currentTarget as HTMLLIElement).blur()
          this.endSearch()
        })
      }
    },
    endSearch () {
      this.hideSearchInput()
      this.$emit('callbackAction', 'endSearch')
    },
    refreshAction() {
      this.$emit('callbackAction', 'refresh')
    },
    arrangeAction (index: number) {
      const item = this.funcList[index] as ResourceFuncItem
      item.isSelected = !item.isSelected
      this.funcList.splice(index, 1, item)
      const arrangeWay = item.isSelected ? ArrangeWay.vertical : ArrangeWay.horizontal
      this.$emit('callbackAction', 'arrangeChange', arrangeWay)
    }
  }
})
</script>

<style lang="less" scoped>
.main-header-view {
  background-color: #F8F9FC;
  .header-top-view {
    height: 36px;
    border-bottom: 1px solid #E3E5ED;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .top-left-view {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 10px;
      .toolbar-btn {
        padding: 4px 10px;
      }
    }
    .top-right-view {
      border-left: 1px solid #9C9FA9;
      .search-indicator {
        width: 15px;
        height: 15px;
      }
    }
  }
  .header-bottom-view {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #F7F9FB;
    border-top: 1px solid white;
    border-bottom: 1px solid #BCC0CE40;
    .bottom-left-view {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0px 10px 0px 5px;
      .back-icon-style {
        height: 22px;
        width: 30px;
        vertical-align: middle;
        margin-right: 5px;
      }
      .modal-breadcrumb {
        width: 100%;
        text-align: left;
        font-size: 13px;
        color: black;
        line-height: 22px;
        overflow: hidden;
        white-space: nowrap;
        .separator-icon {
          width: 10px;
        }
        .modal-breadcrumb-item:hover {
          color: #06b650;
        }
      }
    }
    .bottom-right-view {
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
        padding: 4px;
      }
    }
  }
}
</style>

<style>
.upload-dropdown-list {
  margin-top: -4px;
  margin-left: -8px;
}
.upload-dropdown-list .ant-dropdown-menu-item {
  font-size: 13px;
  color: black;
}
.main-header-view .header-top-view .top-right-view .ant-input-group-addon {
  padding: 0px;
  border: none;
}
.main-header-view .header-top-view .top-right-view .ant-input {
  border: none;
  width: 190px;
  height: 24px;
  font-size: 13px;
  color: #484848;
  margin: 0px 4px;
  background-color: #F8F9FC;
}
.main-header-view .header-bottom-view .bottom-right-view .ant-input {
  width: 150px;
  height: 20px;
  font-size: 12px;
  color: #484848;
  margin-right: 4px;
  padding-right: 0px;
}
.main-header-view .modal-breadcrumb .ant-breadcrumb-separator {
  margin: 0px;
  font-size: 10px;
}
.main-header-view .modal-breadcrumb .ant-breadcrumb-link {
  cursor: default;
}
</style>
