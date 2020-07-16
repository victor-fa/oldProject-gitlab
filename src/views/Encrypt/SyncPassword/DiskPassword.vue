<template>
  <div class="disk-password-style">
    <div class="disk-content">
      <div class="disk-info">
        <img src="../../../assets/disk_square_icon.png">
        <div class="disk-desc">
          <span>{{ diskInfo.diskpos }}</span>
          <span>原设备：{{ diskInfo.devname }}</span>
          <span>原设备序列号：{{ diskInfo.sn }}</span>
        </div>
      </div>
      <a-input
        v-focus
        type="password"
        v-model="password"
        placeholder="请输入原加密空间密码"
        @pressEnter="handleEnterAction"
      />
      <div class="disk-bottom">
        <a-button class="bottom-btn" @click="handlePreviousAction">上一步</a-button>
        <a-button class="bottom-btn" @click="handleNextAction">下一步</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { EncryptInfo } from '../../../api/NasFileModel'

export default Vue.extend({
  name: 'disk-password',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  data () {
    return {
      password: ''
    }
  },
  computed: {
    ...mapGetters('Resource', ['encryptInfos']),
    isFirst: function () {
      const localtion = this.$route.query.diskLocaltion
      const result = (localtion !== 'second') as boolean
      return result
    },
    previousPwd: function () {
      const pwd = this.$route.query.pwd as string
      return pwd
    },
    diskInfo: function () {
      const isFirst = this.isFirst as boolean
      const diskInfos = this.encryptInfos as EncryptInfo[]
      const index = isFirst ? 0 : 1
      return diskInfos[index]
    }
  },
  watch: {
    $route: {
      handler: function () {
        this.password = ''
      }
    }
  },
  methods: {
    handleEnterAction () {
      if (_.isEmpty(this.password)) return
      this.handleNextAction()
    },
    handleNextAction () {
      if (_.isEmpty(this.password)) {
        this.$message.error('请输入密码')
        return 
      }
      if (this.isFirst) {
        this.$router.push({
          path: 'disk-password',
          query: { 'diskLocaltion': 'second', 'pwd': this.password }
        })
      } else {
        this.$router.push({
          path: 'sync-password',
          query: { 'firstPwd': this.previousPwd, 'secondPwd': this.password }
        })
      }
    },
    handlePreviousAction () {
      this.$router.go(-1)
    }
  }
})
</script>

<style lang="less" scoped>
.disk-password-style {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .disk-content {
    margin-top: 150px;
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    .disk-info {
      display: flex;
      img {
        height: 90px;
        margin-right: 22px;
      }
      .disk-desc {
        width: 185px;
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        span {
          font-size: 14px;
          color: black;
          line-height: 30px;
          text-align: left;
        }
        span:first-child {
          font-weight: bold;
        }
      }
    }
    .ant-input {
      margin-top: 30px;
      height: 42px;
      font-size: 14px;
    }
    .disk-bottom {
      margin-top: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .bottom-btn {
        width: 138px;
        height: 46px;
        border-radius: 23px;
        font-size: 18px;
      }
    }
  }
}
</style>
