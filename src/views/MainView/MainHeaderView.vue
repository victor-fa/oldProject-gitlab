<template>
  <div class="main-header-view">
    <basic-tabs :tabs="categorys" v-on:tabChange="handleTabChange"/>
    <div class="bottom-bar">
      <div class="left-bar">
        <custom-button
          :image="operateFuncList.back"
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
        <custom-button
          v-else
          :image="operateFuncList.search"
          iconWidth="13px"
          class="right-item"
          @click.native="searchAction"
        />
        <custom-button
          :image="operateFuncList.refresh"
          iconWidth="12px"
          class="right-item"
          @click.native="refreshAction"
        />
        <a-popover
          trigger="click"
          v-model="visible"
          placement="bottom"
          overlayClassName="sortPopover"
        >
          <sort-popover-list
            slot="content"
            :sortList="popoverList"
            v-on:sortWayChange="sortWayChange"
          />
          <span>
            <custom-button
              ref="sortButton"
              :image="operateFuncList.sort"
              iconWidth="14px"
              class="right-item"
            />
          </span>
        </a-popover>
        <custom-button
          :image="operateFuncList.arrange"
          :selectedBackgroundImage="operateFuncList.selectedBg"
          iconWidth="14px"
          class="right-item"
          ref="arrangeBtn"
          @click.native="arrangeBtnClick"
        />
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

const operateFuncList = {
  back: require('../../assets/back_icon.png'),
  search: require('../../assets/search_icon.png'),
  refresh: require('../../assets/refresh_icon.png'),
  sort: require('../../assets/sort_icon.png'),
  arrange: require('../../assets/arrange_icon.png'),
  selectedBg: require('../../assets/func_button_bg.png')
}

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
    popoverList: Object,
    categoryType: {
      default: CategoryType.all
    }
  },
  data () {
    return {
      categorys: _.cloneDeep(categorys),
      operateFuncList,
      visible: false, // 控制排序气泡弹窗是否显示 
      showSearch: false, // 控制搜索框是否显示
      keyword: '', // 搜索关键字
    }
  },
  computed: {
    disableBack: function () {
      return this.directory.indexOf('/') === -1
    }
  },
  methods: {
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
    arrangeBtnClick () {
      this.hideSearchInput()
      const arrangeBtn: any = this.$refs.arrangeBtn
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
      height: 22px;
      margin-right: 2px;
      .right-item {
        height: 22px;
        width: 22px;
        margin-right: 2px;
      }
      .search-item {
        height: 22px;
        widows: 22px;
      }
      .right-button {
        border: 1px solid #e5e5e5;
        border-radius: 0px;
        margin-right: 7px;
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
