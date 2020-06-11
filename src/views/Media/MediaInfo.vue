<template>
  <div class="media-info">media-info</div>
</template>

<script lang="ts">
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'

export default Vue.extend({
  name: 'media-info',
  data () {
    return {
      json: ''
    }
  },
  mounted () {
    console.log(this.$route.params)
    const path = this.$route.params.path
    const uuid = this.$route.params.uuid
    NasFileAPI.fetchMediaInfo(path, uuid).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error)
    })
  }
})
</script>

<style lang="less" scoped>
.media-info {
  background-color: #f6f8fb;
  color: black;
}
</style>
