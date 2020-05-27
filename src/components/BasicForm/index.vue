<template>
  <div class="basic-form">
    <img :src="icon">
    <div class="dropdown">
      <a-input
        ref="basicFormInput"
        :type="inputType"
        :placeholder="placeholder"
        :value="text"
        :allowClear="true"
        @change="handleChange($event.target.value)"
        @focus="handleFocus"
        @blur="handleBlur"
        v-on:pressEnter="handlePressEnter"
      />
      <ul
        v-if="isLoadSelect"
        class="dropdown-content"
        :style="{ 'width': formWidth + 'px' }"
      >
        <li
          v-for="(item, index) in selectItems"
          :key="index"
          class="dropdown-item"
          @click.stop="handleSelect(item)"
        >
          <label>{{ item.account }}</label>
          <custom-button
            :image="CloseIcon"
            iconWidth="8px"
            class="delete-button"
            @click.stop.native="handleDelete(item)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CustomButton from '../../components/CustomButton/index.vue'
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
    selectItems: Array
  },
  data () {
    return {
      CloseIcon,
      showDropdown: false,
      autoFocus: false
    }
  },
  computed: {
    inputType: function () {
      return this.isSecure ? 'password' : 'text'
    },
    isLoadSelect: function (): boolean {
      if (this.selectItems !== undefined && this.selectItems.length > 0) {
        return true && this.showDropdown
      }
      return false && this.showDropdown
    },
    formWidth: function () {
      const width = this.$el.clientWidth as number
      return width - 50
    }
  },
  methods: {
    handleChange (value: string) {
      this.$emit('change', value)
    },
    handleFocus () {
      this.showDropdown = true
    },
    handleBlur () {
      setTimeout(() => {
        if (this.autoFocus) {
          this.autoFocus = false
          return
        }
        this.autoFocus = false
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
      this.autoFocus = true
      const input = this.$refs.basicFormInput as any
      input.focus()
    }
  }
})
</script>

<style lang="less" scoped>
.basic-form {
  height: 40px;
  border-bottom: 1px solid #cacdca;
  display: flex;
  align-items: center;
  img {
    height: 20px;
    margin-left: 13px;
  }
  .dropdown {
    position: relative;
    flex: 1;
    margin-left: 8px;
    margin-right: 13px;
    input {
      font-size: 14px;
      line-height: 20px;
      padding-left: 8px;
      display: inline-block;
      position: relative;
    }
    .dropdown-content {
      z-index: 100;
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
</style>

<style>
.basic-form .ant-input {
  border: none;
}
</style>
