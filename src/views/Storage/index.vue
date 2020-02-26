<template>
  <div class="storage-content">
    <recycle-scroller
      :style="{ height: scrollHeight + 'px' }"
      :items="list"
      :item-size="32"
      key-field="id"
      v-slot="{ item }"
    >
      <div class="user" @click="didSelectItem(item)">
        {{ item.name + item.id }}
      </div>
    </recycle-scroller>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default Vue.extend({
  name: 'storage',
  directives: { infiniteScroll },
  components: {
    'RecycleScroller': RecycleScroller
  },
  data () {
    return {
      list: [
        { name: 'name', id: '1' },
        { name: 'name', id: '2' },
        { name: 'name', id: '3' },
        { name: 'name', id: '4' },
        { name: 'name', id: '5' },
        { name: 'name', id: '6' },
        { name: 'name', id: '7' },
        { name: 'name', id: '8' },
        { name: 'name', id: '9' },
        { name: 'name', id: '10' },
        { name: 'name', id: '21' },
        { name: 'name', id: '31' },
        { name: 'name', id: '41' },
        { name: 'name', id: '51' },
        { name: 'name', id: '61' },
        { name: 'name', id: '71' },
        { name: 'name', id: '81' },
        { name: 'name', id: '91' },
        { name: 'name', id: '101' }
      ],
      scrollHeight: 450
    }
  },
  mounted () {
    window.addEventListener('resize', (event: any): void => {
      console.log(document.body.clientHeight)
      const newHeight = document.body.clientHeight - 128
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    }, false)
  }
})
</script>

<style lang="less" scoped>
.storage-content {
  background-color: red;
  height: 100%;
  .scroller {
    height: 400px;
  }
  .user {
    height: 32px;
    width: 100%;
    padding: 0 12px;
    display: flex;
    align-items: center;
    color: black;
    border-bottom: 1px solid black;
    background-color: white;
  }
}
</style>
