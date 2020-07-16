<template>
  <div class="basic-form" v-bind:class="{ 'basic-form-error': showError }">
    <div class="input-wrapper">
      <img :src="icon">
      <div class="input-content">
        <a-input
          ref="basicFormInput"
          :type="inputType"
          :placeholder="placeholder"
          :value="text"
          :allowClear="true"
          :suffix="suffixContent"
          :max-length="maxLength"
          @change="handleChange($event.target.value)"
          @focus="handleFocus"
          @blur="handleBlur"
          v-on:pressEnter="handlePressEnter"
        />
        <ul v-if="showDropdown" class="dropdown-content">
          <li
            v-for="(item, index) in selectItems"
            :key="index"
            class="dropdown-item"
            @click.stop.prevent="handleSelect(item)"
          >
            <label>{{ item.account }}</label>
            <custom-button
              :image="CloseIcon"
              iconWidth="20px"
              class="delete-button"
              @click.stop.native="handleDelete(item)"
            />
          </li>
        </ul>
      </div>
    </div>
    <span v-if="showError">{{ error }}</span>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import CustomButton from '@/components/CustomButton/index.vue'
import CloseIcon from '../../assets/close_icon.png'

export default Vue.extend({
  name: 'basic-form',
  components: {
    CustomButton
  },
  model: {
    prop: 'text',
    event: 'change'
  },
  props: {
    text: String,
    placeholder: String,
    icon: {
      default: null
    },
    isSecure: {
      default: false
    },
    suffix: {
      default: ''
    },
    maxLength: {
      default: 15
    },
    selectItems: Array,
    error: String
  },
  data () {
    return {
      CloseIcon,
      isFocus: false,
      showDropdown: false
    }
  },
  watch: {
    selectItems: function (newValue: any[]) {
      if (!this.isFocus) return
      this.showDropdown = !_.isEmpty(newValue)
    }
  },
  computed: {
    inputType: function () {
      return this.isSecure ? 'password' : 'text'
    },
    suffixContent: function () {
      return this.suffix ? this.suffix : ''
    },
    showError: function () {
      const error = this.error as string
      return !_.isEmpty(error)
    }
  },
  methods: {
    handleChange (value: string) {
      this.$emit('change', value)
    },
    handleFocus () {
      this.$emit('focus')
      this.isFocus = true
      if (!_.isEmpty(this.selectItems)) this.showDropdown = true
    },
    handleBlur () {
      this.$emit('blur')
      this.isFocus = false
      setTimeout(() => {
        this.showDropdown = false
      }, 100)
    },
    handlePressEnter () {
      this.$emit('pressEnter')
    },
    handleSelect (item: any) {
      this.$emit('select', item)
    },
    handleDelete (item: any) {
      this.$emit('delete', item)
      // 删除按钮点击，输入框不能失去焦点
      const input = this.$refs.basicFormInput as HTMLElement
      input.focus()
    }
  }
})
</script>

<style lang="less" scoped>
.basic-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .input-wrapper {
    width: 100%;
    height: 40px;
    border-bottom: 1px solid #cacdca;
    display: flex;
    align-items: center;
    img {
      height: 20px;
      margin-left: 13px;
    }
    .input-content {
      flex: 1;
      position: relative;
      margin:0px 13px 0px 8px;
      .ant-input {
        font-size: 14px;
        line-height: 20px;
        padding-left: 8px;
        display: inline-block;
        position: relative;
      }
      .dropdown-content {
        z-index: 100;
        width: 100%;
        position: absolute;
        background-color: white;
        max-height: 130px;
        overflow: auto;
        margin-top: 4px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        border-radius: 3px;
        .dropdown-item {
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          label {
            color: #7d7e7e;
            font-size: 13px;
            font-weight: bold;
            margin-left: 13px;
          }
          .delete-button {
            width: 8px;
            margin-right: 17px;
          }
        }
        .dropdown-item:hover {
          background-color: #DEF1EA;
        }
      }
    }
  }
}
.basic-form-error {
  .input-wrapper {
    padding-bottom: 4px;
    border-bottom: 1px solid #FF0101;
  }
  span {
    margin-top: 4px;
    font-size: 10px;
    line-height: 10px;
    color: #FF0101;
  }
}
</style>

<style>
.basic-form .ant-input {
  border: none;
}
</style>
