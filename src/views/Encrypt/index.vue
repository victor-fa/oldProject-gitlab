<template>
  <div class="encrypt-style">
    <keep-alive>
      <router-view/>
    </keep-alive>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import { EncryptInfo } from '../../api/NasFileModel'

export default Vue.extend({
  name: 'encrypt',
  created () {
    this.checkEncryptStatus()
  },
  methods: {
    checkEncryptStatus() {
      NasFileAPI.getEncryptStatus().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.handleEnceyptResponse(response.data)
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEnceyptResponse (data: BasicResponse) {
      const status = _.get(data.data, 'status') as number
      if (status === 0) { // 未开启
        if (this.$route.name !== 'activate-view') this.$router.push('activate-view')
      } else if (status === 1) { // 已开启
        if (this.$route.name !== 'encrypt-login') this.$router.push('encrypt-login')
      } else if (status === 2) { // 两个磁盘密码不一致
        const infos = _.get(data.data, 'encryptspace_info') as EncryptInfo[]
        this.$store.dispatch('Resource/updateEncryptInfos', infos)
        if (this.$route.name !== 'open-error') this.$router.push('open-error')
      } else {
        this.$message.error('未知加密状态')
      }
    }
  }
})
</script>

<style lang="less" scoped>
.encrypt-style {
  height: 100%;
  width: 100%;
  background-color: white;
}
</style>
