<template>
  <ul>
    <li
      v-for="(item, index) in showItems"
      :key="index"
      class="item"
      v-bind:class="{ itemSelected: item.meta.isSelected }"
      @click="onSelectAction(item.meta, item.path)"
    >
      <img :src="item.meta.isSelected ? item.meta.selectedIcon : item.meta.icon"/>
      <label>{{ item.meta.title }}
        <a-badge
          v-show="item.name === 'transport'"
          :count="taskCount"
          :numberStyle="{backgroundColor: '#01B74F', color: '#fff'}"
          style="float: right"
        >
        </a-badge>
      </label>
    </li>
  </ul>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { HomeRouters, FuncListItem } from '../../router/modules/HomeList'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'sider-menu',
  data () {
    let showItems = HomeRouters.filter(item => {
      return !_.isEmpty(item.meta)
    })
    return {
      showItems
    }
  },
  computed: {
    ...mapGetters('Resource', ['taskCount'])
  },
  methods: {
    onSelectAction: function (item: FuncListItem, path: string) {
      this.showItems = this.showItems.map(aItem => {
        aItem.meta!.isSelected = aItem.path === path ? true : false
        return aItem
      })
      EventBus.$emit(EventType.leftMenuChangeAction, path)
      if (this.$route.path !== path) this.$router.replace(path)
    }
  }
})
</script>

<style lang="less" scoped>
.item {
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0px 11px 0px 7px;
  cursor: pointer;
  border-radius: 4px;
  img {
    width: 16px;
    margin-right: 18px;
    cursor: pointer;
  }
  label {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
    color: #484848;
    width: 100px;
    text-align: left;
    cursor: pointer;
  }
}
.itemSelected {
  background-color: #DEF1EA;
  label {
    color: #007934;
  }
}
</style>
