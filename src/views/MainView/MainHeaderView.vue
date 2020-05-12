<template>
  <div class="main-header-view">
    <basic-tabs :tabs="categorys" v-on:tabChange="handleTabChange"/>
    <div class="bottom-bar">
      <div class="left-bar">
        <custom-button
          :image="backIcon"
          :disable="disableBack"
          class="back-icon-style"
          iconWidth="6px"
          @click.native="backAction"
        />
        <span>{{ directory }}</span>
      </div>
      <div class="right-bar">
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
          v-for="(item, index) in showFuncList"
          :key="index"
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
            <span>
              <custom-button
                class="right-item"
                :image="item.icon"
                :ref="item.command"
                :iconWidth="item.iconWidth"
                v-show="item.isHidden !== true"
                @click.native="handleItemClick(item)"
              />
            </span>
          </a-popover>
          <custom-button
            v-show="showItem(item)"
            class="right-item"
            :image="item.icon"
            :selectedImage="item.selectedIcon"
            :ref="item.command"
            :iconWidth="item.iconWidth"
            @click.native="handleItemClick(item)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicTabs from '../../components/BasicTabs/index.vue'
import { categorys, taskCategorys, Category, CategoryType } from '../../model/categoryList'
import { EventBus, EventType } from '../../utils/eventBus'
import CustomButton from '../../components/CustomButton/index.vue'
import SortPopoverList from '../../components/SortPopoverList/index.vue'
import { SortWay, SortKind, SortType, sortList, uploadSortList } from '../../model/sortList'
import { ArrangeWay, OrderType } from '../../api/NasFileModel'
import { commonFuncList, ResourceFuncItem } from './ResourceFuncList'

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
    BasicTabs,
    CustomButton,
    SortPopoverList
  },
  props: {
    directory: {
      type: String,
      default: ''
    },
    funcList: Array,
    popoverList: Object,
    categoryType: {
      default: CategoryType.all
    }
  },
  data () {
    let list = _.isEmpty(this.funcList) ? commonFuncList : (this.funcList as ResourceFuncItem[])
    return {
      categorys: _.cloneDeep(categorys),
      backIcon: require('../../assets/back_icon.png'),
      showFuncList: list,
      visible: false, // 控制排序气泡弹窗是否显示 
      showSearch: false, // 控制搜索框是否显示
      keyword: '', // 搜索关键字
    }
  },
  watch: {
    funcList: function (newValue: ResourceFuncItem[]) {
      this.showFuncList = newValue
    },
    popoverList: function (newValue) {
      console.log(newValue)
    },
    showSearch: function (newValue: boolean) {
      const item = this.showFuncList[0]
      item.isHidden = newValue
      this.showFuncList.splice(0, 1, item)
    }
  },
  computed: {
    disableBack: function () {
      return this.directory.indexOf('/') === -1
    }
  },
  methods: {
    showPopover (item: ResourceFuncItem) {
      return item.command === 'sort'
    },
    showItem (item: ResourceFuncItem) {
      const show = item.command !== 'sort'
      const hide = item.isHidden
      return show && !hide
    },
    handleTabChange (index: number) {
      this.hideSearchInput()
      const item = categorys[index]
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
    handleItemClick (item: ResourceFuncItem) {
      switch (item.command) {
        case 'search':
          this.searchAction()
          break;
        case 'refresh':
          this.refreshAction()
          break;
        case 'sort':
          break;
        case 'arrange':
          this.arrangeAction()
          break;
        case 'newCustom':
          this.$emit('CallbackAction', 'newCustom')
          break;
        default:
          break;
      }
    },
    searchAction () {
      this.showSearch = true
    },
    handleSearchFocus (event: FocusEvent) {
      // 监听清除按钮的点击
      const searchInput = this.$refs.searchInput as Vue
      const clearButton = searchInput.$el.lastChild as ChildNode
      clearButton.addEventListener('click', () => {
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
        return
      }
      this.$emit('CallbackAction', 'search', this.keyword)
    },
    endSearch () {
      if (!this.showSearch) return
      this.hideSearchInput()
      this.$emit('CallbackAction', 'endSearch')
    },
    hideSearchInput () {
      this.showSearch = false
      this.keyword = ''
    },
    refreshAction() {
      this.hideSearchInput()
      this.$emit('CallbackAction', 'refresh')
    },
    arrangeAction () {
      this.hideSearchInput()
      const arrangeBtn: any = this.$refs.arrange[0]
      const selected: boolean = arrangeBtn.isSelected
      const arrangeWay = selected ? ArrangeWay.vertical : ArrangeWay.horizontal
      this.$emit('CallbackAction', 'arrangeChange', arrangeWay)
    }
  }
})
</script>

<style lang="less" scoped>
.main-header-view {
  background-color: white;
  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0px 6px;
    margin: 0px 15px;
    border-bottom: 1px solid #dcdcdc;
    .left-bar {
      line-height: 32px;
      display: flex;
      align-items: center;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      span {
        color: #484848;
        font-size: 12px;
        line-height: 22px;
      }
      .back-icon-style {
        height: 22px;
        width: 30px;
        vertical-align: middle;
        margin-right: 3px;
      }
      .normal {
        font-size: 14px;
        line-height: 22px;
        color: #484848;
        cursor: pointer;
      }
      .special {
        color: #06B650;
      }
    }
    .right-bar {
      display: flex;
      align-items: center;
      height: 22px;
      margin-right: 4px;
      .right-item {
        height: 22px;
        width: 22px;
        margin-left: 2px;
      }
    }
  }
}
</style>

<style>
.main-header-view .right-bar .ant-input {
  font-size: 12px;
  color: #484848;
  height: 20px;
  margin-right: 4px;
  padding-right: 0px;
}
.main-header-view .right-bar .ant-input-suffix {
  right: 4px;
}
</style>
