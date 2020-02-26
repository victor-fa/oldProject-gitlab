<template>
  <div class="bottom-bar">
    <div class="left-bar">
      <custom-button
        :image="operateFuncList.back"
        class="back-icon-style"
        iconWidth="6px"
        @click.native="backAction"
      />
      <span>{{ this.$store.state.directory }}</span>
    </div>
    <div class="right-bar">
      <custom-button
        :image="operateFuncList.search"
        :selectedBackgroundImage="operateFuncList.selectedBg"
        iconWidth="13px"
        class="right-item"
      />
      <custom-button
        :image="operateFuncList.refresh"
        :selectedBackgroundImage="operateFuncList.selectedBg"
        iconWidth="12px"
        class="right-item"
      />
      <a-popover
        trigger="click"
        v-model="visible"
        overlayClassName="sortPopover"
      >
        <sort-popover-list
          slot="content"
          v-on:sortWayChange="sortWayChange"
        />
        <span>
          <custom-button
            :image="operateFuncList.sort"
            @click="clicked"
            :selectedBackgroundImage="operateFuncList.selectedBg"
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
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CustomButton from '../../components/CustomButton/index.vue'
import SortPopoverList from './SortPopoverList.vue'
import { SortWay } from './Model/sortList'
import { operateFuncList } from './Model/operateIconList'
import { EventBus } from '../../utils/eventBus'
import { BACK_ACTION } from '../../common/constants'

export default Vue.extend({
  name: 'bottom-bar',
  components: {
    CustomButton,
    SortPopoverList
  },
  data () {
    return {
      visible: false,
      operateFuncList
    }
  },
  methods: {
    sortWayChange (sender: SortWay) {
      this.visible = false
      console.log(sender)
    },
    clicked (sender: any) {
      console.log('123')
    },
    backAction () {
      // TODO: 一级目录不能返回，应该是置灰button
      if (this.$store.state.directory === '网盘') {
        return
      }
      EventBus.$emit(BACK_ACTION)
    }
  }
})
</script>

<style lang="less" scoped>
.bottom-bar {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px 15px;
  padding-top: 15px;
  border-bottom: 1px solid #dcdcdc;
  .left-bar {
    line-height: 32px;
    display: flex;
    align-items: center;
    .back-icon-style {
      height: 22px;
      width: 30px;
      vertical-align: middle;
      margin-right: 3px;
    }
    span {
      font-size: 14px;
      line-height: 22px;
      color: #484848;
    }
  }
  .right-bar {
    line-height: 15px;
    margin-right: 2px;
    .right-item {
      height: 22px;
      width: 22px;
      margin-right: 2px;
    }
  }
}
</style>

<style>
.bottom-bar > .right-bar > .ant-btn {
  padding: 6px;
  border: none;
  background-color: transparent;
}
.sortPopover .ant-popover-inner-content {
  padding: 8px 0px;
}
</style>
